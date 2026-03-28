"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProfileTabs } from "../../components/profile/profile-tabs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function ProfilePage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [saved, setSaved] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [recipesResponse, savedResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/recipes/me`, {
          credentials: "include"
        }),
        fetch(`${API_BASE_URL}/bookmarks/me`, {
          credentials: "include"
        })
      ]);

      const recipesData = recipesResponse.ok ? await recipesResponse.json() : { recipes: [] };
      const savedData = savedResponse.ok ? await savedResponse.json() : { recipes: [] };
      setRecipes(recipesData.recipes);
      setSaved(savedData.recipes);
    };

    void load();
  }, []);

  return (
    <main className="page-main">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Private profile
          </p>
          <h1 className="text-4xl tracking-tight">Your Cookpedia workspace</h1>
        </div>
        <Link
          href="/settings/profile"
          className="rounded-full border border-[var(--line)] px-4 py-2 text-sm"
        >
          Edit profile
        </Link>
      </div>
      <ProfileTabs recipes={recipes} saved={saved} />
    </main>
  );
}
