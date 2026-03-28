"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function PendingRecipesPage() {
  const [recipes, setRecipes] = useState<any[]>([]);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/admin/recipes/pending`,
      {
        credentials: "include"
      }
    )
      .then((response) => response.json())
      .then((data) => setRecipes(data.recipes));
  }, []);

  return (
    <main className="page-main">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Admin workflow</p>
          <h1 className="text-4xl tracking-tight">Pending moderation</h1>
        </div>
        <Link
          href="/"
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm text-[var(--muted)]"
        >
          Back to homepage
        </Link>
      </div>
      <div className="grid gap-4">
        {recipes.map((recipe) => (
          <Link
            key={recipe.id}
            href={`/admin/recipes/${recipe.id}`}
            className="panel flex items-center justify-between p-4"
          >
            <div>
              <p className="text-lg">{recipe.title}</p>
              <p className="text-sm text-[var(--muted)]">
                {recipe.author.displayName}
              </p>
            </div>
            <span className="text-sm text-[var(--muted)]">Review</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
