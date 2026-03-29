"use client";

import { Heart } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useState, useTransition } from "react";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { apiWrite } from "@/lib/api";
import { toggleBookmark } from "@/features/bookmarks/bookmarks-slice";
import type { RootState } from "@/lib/store";
import { cn } from "@/lib/utils";

export function RecipeSaveButton({
  recipeId,
  size = "sm",
  variant = "secondary",
  className,
  showLabel = true
}: {
  recipeId: string;
  size?: "sm" | "default";
  variant?: "secondary" | "ghost";
  className?: string;
  showLabel?: boolean;
}) {
  const auth = useSelector((state: RootState) => state.auth);
  const savedRecipeIds = useSelector((state: RootState) => state.bookmarks.recipeIds);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isSaved = savedRecipeIds.includes(recipeId);

  const toggle = () => {
    if (auth.status !== "authenticated") {
      setDialogOpen(true);
      return;
    }

    setError("");
    startTransition(() => {
      void apiWrite(`/bookmarks/${recipeId}`, {
        method: isSaved ? "DELETE" : "POST"
      }).then(
        () => {
          dispatch(toggleBookmark(recipeId));
        },
        () => {
          setError("Unable to update saved recipes right now.");
        }
      );
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant={variant}
          size={size}
          aria-label={showLabel ? undefined : isSaved ? "Unsave recipe" : "Save recipe"}
          disabled={isPending}
          className={cn(
            "gap-2",
            isSaved ? "border-[rgba(148,52,45,0.24)] bg-[rgba(148,52,45,0.08)] text-[rgba(148,52,45,0.95)]" : "",
            className
          )}
          onClick={toggle}
        >
          <Heart
            weight={isSaved ? "fill" : "duotone"}
            data-icon="inline-start"
          />
          {showLabel ? (isSaved ? "Saved" : "Save") : null}
        </Button>
        {error ? (
          <p className="text-xs text-[rgba(148,52,45,0.95)]">{error}</p>
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
