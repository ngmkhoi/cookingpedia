"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { Star } from "@phosphor-icons/react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { apiGet, apiWrite } from "@/lib/api";
import type { RootState } from "@/lib/store";

type RatingResponse = {
  rating: {
    score: number;
    comment?: string | null;
  } | null;
};

type SaveRatingResponse = {
  rating: {
    score: number;
    comment?: string | null;
  };
  summary: {
    ratingAverage: number;
    ratingCount: number;
  };
};

export function RecipeRatingControl({
  recipeId,
  authorId,
  initialAverage,
  initialCount
}: {
  recipeId: string;
  authorId: string;
  initialAverage: number;
  initialCount: number;
}) {
  const auth = useSelector((state: RootState) => state.auth);
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedScore, setSelectedScore] = useState<string>("");
  const [ratingAverage, setRatingAverage] = useState(initialAverage);
  const [ratingCount, setRatingCount] = useState(initialCount);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isOwner = auth.status === "authenticated" && auth.user?.id === authorId;

  useEffect(() => {
    if (auth.status !== "authenticated" || isOwner) {
      setSelectedScore("");
      return;
    }

    void apiGet<RatingResponse>(`/ratings/${recipeId}/me`, true).then(
      (data) => {
        setSelectedScore(data.rating ? String(data.rating.score) : "");
      },
      () => {
        setSelectedScore("");
      }
    );
  }, [auth.status, isOwner, recipeId]);

  const helperText = useMemo(() => {
    if (isOwner) {
      return "You cannot rate your own recipe.";
    }

    if (auth.status !== "authenticated") {
      return "Sign in to save your rating.";
    }

    return "Tap a score from 1 to 5 to rate this recipe.";
  }, [auth.status, isOwner]);

  const saveRating = (value: string) => {
    if (!value) {
      return;
    }

    if (auth.status !== "authenticated") {
      setDialogOpen(true);
      return;
    }

    if (isOwner) {
      return;
    }

    setError("");
    startTransition(() => {
      void apiWrite<SaveRatingResponse>(`/ratings/${recipeId}`, {
        method: "POST",
        body: JSON.stringify({
          score: Number(value)
        })
      }).then(
        (data) => {
          setSelectedScore(String(data.rating.score));
          setRatingAverage(data.summary.ratingAverage);
          setRatingCount(data.summary.ratingCount);
        },
        (requestError) => {
          const nextMessage =
            typeof requestError === "object" &&
            requestError &&
            "message" in requestError &&
            requestError.message === "CANNOT_RATE_OWN_RECIPE"
              ? "You cannot rate your own recipe."
              : "Unable to save your rating right now.";
          setError(nextMessage);
        }
      );
    });
  };

  return (
    <>
      <div className="grid gap-4 rounded-[1.5rem] border border-[var(--line-subtle)] bg-[rgba(255,255,255,0.68)] p-5">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Rating
          </p>
          <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <span className="inline-flex items-center gap-2 font-medium text-[var(--ink)]">
              <Star weight="fill" />
              {ratingAverage.toFixed(1)} / 5
            </span>
            <span>{ratingCount} ratings</span>
          </div>
        </div>

        <ToggleGroup
          type="single"
          value={selectedScore}
          onValueChange={saveRating}
          disabled={isPending || isOwner}
          className="justify-start"
        >
          {["1", "2", "3", "4", "5"].map((score) => (
            <ToggleGroupItem
              key={score}
              value={score}
              aria-label={`Rate ${score} out of 5`}
              variant="default"
              size="sm"
            >
              {score}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <p className="text-sm text-[var(--muted)]">{helperText}</p>
        {error ? (
          <p className="text-sm text-[rgba(148,52,45,0.95)]">{error}</p>
        ) : null}
      </div>
      <AuthDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        destination={pathname}
      />
    </>
  );
}
