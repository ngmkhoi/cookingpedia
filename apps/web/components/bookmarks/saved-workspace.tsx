"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { apiGet, apiWrite } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CardSurface } from "@/components/ui/card-surface";

type SavedRecipe = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImageUrl?: string | null;
  author: {
    username: string;
    displayName: string;
  };
};

export function SavedWorkspace() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");
  const [pendingRecipeId, setPendingRecipeId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadRecipes = async () => {
    setWorkspaceError("");

    try {
      const data = await apiGet<{ recipes: SavedRecipe[] }>("/bookmarks/me", true);
      setRecipes(data.recipes);
    } catch {
      setWorkspaceError("Unable to load your saved recipes right now.");
    } finally {
      setLoading(false);
      setPendingRecipeId(null);
    }
  };

  useEffect(() => {
    void loadRecipes();
  }, []);

  const unsave = (recipeId: string) => {
    setPendingRecipeId(recipeId);
    startTransition(() => {
      void apiWrite(`/bookmarks/${recipeId}`, {
        method: "DELETE"
      }).then(
        async () => {
          await loadRecipes();
        },
        () => {
          setWorkspaceError("Unable to unsave this recipe right now.");
          setPendingRecipeId(null);
        }
      );
    });
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">Loading saved recipes...</p>;
  }

  if (recipes.length === 0) {
    return (
      <CardSurface className="grid gap-4 p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Saved recipes
          </p>
          <h2 className="text-3xl tracking-tight">Nothing saved yet</h2>
          <p className="max-w-[56ch] text-sm leading-relaxed text-[var(--muted)]">
            Save standout recipes as you explore so they stay easy to revisit.
          </p>
        </div>
        <div>
          <Link href="/search">
            <Button>Browse recipes</Button>
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
      {recipes.map((recipe) => (
        <CardSurface key={recipe.id} className="grid gap-4 p-5 md:grid-cols-[128px_1fr_auto] md:items-center">
          <div
            className="aspect-[4/3] rounded-[1.25rem] bg-[linear-gradient(155deg,#d7d2c8,#ece8df)] bg-cover bg-center"
            style={
              recipe.coverImageUrl
                ? { backgroundImage: `url(${recipe.coverImageUrl})` }
                : undefined
            }
          />
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              {recipe.author.displayName}
            </p>
            <h2 className="text-2xl tracking-tight text-[var(--ink)]">{recipe.title}</h2>
            <p className="max-w-[65ch] text-sm leading-relaxed text-[var(--muted)]">
              {recipe.shortDescription}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Link href={`/recipes/${recipe.slug}`}>
              <Button variant="secondary" size="sm">
                Open
              </Button>
            </Link>
            <Button
              size="sm"
              disabled={isPending && pendingRecipeId === recipe.id}
              onClick={() => unsave(recipe.id)}
            >
              Unsave
            </Button>
          </div>
        </CardSurface>
      ))}
    </div>
  );
}
