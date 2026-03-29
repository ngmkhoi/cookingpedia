"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { apiGet, apiWrite } from "@/lib/api";
import { RECIPE_STATUS_LABELS } from "@/lib/constants/recipes";
import { Button } from "@/components/ui/button";
import { CardSurface } from "@/components/ui/card-surface";
import { StatusBadge } from "@/components/ui/status-badge";

type ManagedRecipe = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  status: "DRAFT" | "PENDING" | "PUBLISHED" | "REJECTED";
  updatedAt: string;
  rejectionReason?: string | null;
};

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));

export function MyRecipesWorkspace() {
  const [recipes, setRecipes] = useState<ManagedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadRecipes = async () => {
    setWorkspaceError("");

    try {
      const data = await apiGet<{ recipes: ManagedRecipe[] }>("/recipes/me", true);
      setRecipes(data.recipes);
    } catch {
      setWorkspaceError("Unable to load your recipes right now.");
    } finally {
      setLoading(false);
      setPendingRecipeId(null);
    }
  };

  useEffect(() => {
    void loadRecipes();
  }, []);

  const runAction = (recipeId: string, run: () => Promise<void>) => {
    setPendingRecipeId(recipeId);
    startTransition(() => {
      void run().then(
        async () => {
          await loadRecipes();
        },
        () => {
          setWorkspaceError("Action failed. Please try again.");
          setPendingRecipeId(null);
        }
      );
    });
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading your recipes...</p>;
  }

  if (recipes.length === 0) {
    return (
      <CardSurface className="grid gap-4 p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Recipe workspace
          </p>
          <h2 className="text-3xl tracking-tight">No recipes yet</h2>
          <p className="max-w-[56ch] text-sm leading-relaxed text-[var(--muted)]">
            Start with one clean draft, then submit it for review when it is ready.
          </p>
        </div>
        <div>
          <Link href="/my-recipes/new">
            <Button>Create your first recipe</Button>
          </Link>
        </div>
      </CardSurface>
    );
  }

  return (
    <div className="grid gap-4">
      {workspaceError ? (
        <p className="text-sm text-[rgba(148,52,45,0.95)]">{workspaceError}</p>
      ) : null}
      {recipes.map((recipe) => {
        const actionPending = isPending && pendingRecipeId === recipe.id;
        const viewHref =
          recipe.status === "PUBLISHED"
            ? `/recipes/${recipe.slug}`
            : `/my-recipes/${recipe.id}`;

        return (
          <CardSurface key={recipe.id} className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-start">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl tracking-tight text-[var(--ink)]">{recipe.title}</h2>
                <StatusBadge
                  status={recipe.status}
                  label={RECIPE_STATUS_LABELS[recipe.status].en}
                />
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  Updated {formatUpdatedAt(recipe.updatedAt)}
                </span>
              </div>
              <p className="max-w-[70ch] text-sm leading-relaxed text-[var(--muted)]">
                {recipe.shortDescription}
              </p>
              {recipe.status === "REJECTED" && recipe.rejectionReason ? (
                <p className="rounded-[1rem] bg-[rgba(148,52,45,0.08)] px-4 py-3 text-sm text-[rgba(148,52,45,0.95)]">
                  Rejection reason: {recipe.rejectionReason}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <Link href={viewHref}>
                <Button variant="secondary" size="sm">
                  View
                </Button>
              </Link>

              {recipe.status === "DRAFT" || recipe.status === "REJECTED" ? (
                <Link href={`/my-recipes/${recipe.id}/edit`}>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                </Link>
              ) : null}

              {recipe.status === "DRAFT" || recipe.status === "REJECTED" ? (
                <Button
                  size="sm"
                  disabled={actionPending}
                  onClick={() =>
                    runAction(recipe.id, async () => {
                      await apiWrite(`/recipes/${recipe.id}/submit`, {
                        method: "POST",
                        body: JSON.stringify({})
                      });
                    })
                  }
                >
                  {recipe.status === "REJECTED" ? "Resubmit" : "Submit for review"}
                </Button>
              ) : null}

              {recipe.status === "DRAFT" || recipe.status === "REJECTED" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={actionPending}
                  onClick={() =>
                    runAction(recipe.id, async () => {
                      await apiWrite(`/recipes/${recipe.id}`, {
                        method: "DELETE"
                      });
                    })
                  }
                >
                  Delete
                </Button>
              ) : null}

              {recipe.status === "PENDING" ? (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={actionPending}
                  onClick={() =>
                    runAction(recipe.id, async () => {
                      await apiWrite(`/recipes/${recipe.id}/move-to-draft`, {
                        method: "POST",
                        body: JSON.stringify({})
                      });
                    })
                  }
                >
                  Move back to draft
                </Button>
              ) : null}
            </div>
          </CardSurface>
        );
      })}
    </div>
  );
}
