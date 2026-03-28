"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ModerationActionPanel } from "@/components/admin/moderation-action-panel";
import { CardSurface } from "@/components/ui/card-surface";

type AdminRecipeDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function AdminRecipeDetailPage({
  params
}: AdminRecipeDetailPageProps) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<any | null>(null);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/admin/recipes/${id}`,
      {
        credentials: "include"
      }
    )
      .then((response) => response.json())
      .then((data) => setRecipe(data.recipe));
  }, [id]);

  if (!recipe) {
    return <main className="page-shell py-10">Loading moderation detail...</main>;
  }

  return (
    <main className="page-shell py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Moderation detail
          </p>
          <h1 className="text-4xl tracking-tight">{recipe.title}</h1>
        </div>
        <Link
          href="/admin/recipes/pending"
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)]"
        >
          Back to queue
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <CardSurface className="grid gap-4 p-6">
          <p className="text-sm text-[var(--muted)]">{recipe.shortDescription}</p>
          {recipe.ingredients.map((ingredient: any) => (
            <div
              key={ingredient.id}
              className="flex justify-between border-b border-[var(--line)] pb-2 text-sm"
            >
              <span>{ingredient.name}</span>
              <span>
                {ingredient.quantity} {ingredient.unit}
              </span>
            </div>
          ))}
        </CardSurface>
        <ModerationActionPanel recipeId={id} />
      </div>
    </main>
  );
}
