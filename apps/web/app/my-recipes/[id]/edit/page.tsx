"use client";

import { use, useEffect, useState } from "react";
import { RecipeStudioForm } from "@/components/recipes/recipe-studio-form";

type EditRecipePageProps = {
  params: Promise<{ id: string }>;
};

export default function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = use(params);
  const [recipe, setRecipe] = useState<any | null>(null);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/recipes/${id}/edit`,
      {
        credentials: "include"
      }
    )
      .then((response) => response.json())
      .then((data) => setRecipe(data.recipe));
  }, [id]);

  if (!recipe) {
    return <main className="page-main">Loading recipe editor...</main>;
  }

  return (
    <main className="page-main">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          My Recipes
        </p>
        <h1 className="text-4xl tracking-tight">Edit your recipe</h1>
      </div>
      <RecipeStudioForm recipeId={id} initialValues={recipe} />
    </main>
  );
}
