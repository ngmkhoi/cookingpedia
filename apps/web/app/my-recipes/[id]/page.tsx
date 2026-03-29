"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CardSurface } from "@/components/ui/card-surface";
import { StatusBadge } from "@/components/ui/status-badge";
import { RECIPE_STATUS_LABELS } from "@/lib/constants/recipes";

type ManagedRecipePreviewPageProps = {
  params: Promise<{ id: string }>;
};

type ManagedRecipePreview = {
  id: string;
  title: string;
  shortDescription: string;
  status: keyof typeof RECIPE_STATUS_LABELS;
  images: Array<{ id: string; imageUrl: string }>;
  ingredients: Array<{ id: string; name: string; quantity: number; unit: string }>;
  steps: Array<{ id: string; stepNumber: number; instruction: string }>;
};

export default function ManagedRecipePreviewPage({
  params
}: ManagedRecipePreviewPageProps) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<ManagedRecipePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");

      try {
        const data = await apiGet<{ recipe: ManagedRecipePreview }>(`/recipes/${id}/edit`, true);
        setRecipe(data.recipe);
      } catch {
        setError("Unable to load this recipe preview.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  if (loading) {
    return <main className="page-main">Loading recipe preview...</main>;
  }

  if (!recipe) {
    return <main className="page-main text-sm text-[rgba(148,52,45,0.95)]">{error}</main>;
  }

  return (
    <main className="page-main">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              My Recipes
            </p>
            <StatusBadge
              status={recipe.status}
              label={RECIPE_STATUS_LABELS[recipe.status].en}
            />
          </div>
          <h1 className="text-4xl tracking-tight">{recipe.title}</h1>
          <p className="max-w-[60ch] text-sm leading-relaxed text-[var(--muted)]">
            {recipe.shortDescription}
          </p>
        </div>
        <Link href={`/my-recipes/${recipe.id}/edit`}>
          <Button>Edit recipe</Button>
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          {recipe.images.map((image: any) => (
            <img
              key={image.id}
              src={image.imageUrl}
              alt={recipe.title}
              className="panel aspect-[4/3] w-full object-cover"
            />
          ))}
        </div>
        <CardSurface className="grid gap-6 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Ingredients
            </p>
            <ul className="mt-3 grid gap-2">
              {recipe.ingredients.map((ingredient: any) => (
                <li
                  key={ingredient.id}
                  className="flex justify-between border-b border-[var(--line)] pb-2 text-sm"
                >
                  <span>{ingredient.name}</span>
                  <span>
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              Method
            </p>
            <ol className="mt-3 grid gap-4">
              {recipe.steps.map((step: any) => (
                <li key={step.id} className="grid grid-cols-[32px_1fr] gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-strong)] text-sm text-white">
                    {step.stepNumber}
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    {step.instruction}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </CardSurface>
      </div>
    </main>
  );
}
