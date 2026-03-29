import Link from "next/link";
import { MyRecipesWorkspace } from "@/components/recipes/my-recipes-workspace";
import { Button } from "@/components/ui/button";

export default function MyRecipesPage() {
  return (
    <main className="page-main">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Private lane
          </p>
          <h1 className="text-4xl tracking-tight">My Recipes</h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-[var(--muted)]">
            Manage drafts, review status, and move recipes back into editing when needed.
          </p>
        </div>
        <Link href="/my-recipes/new">
          <Button>Create recipe</Button>
        </Link>
      </div>
      <MyRecipesWorkspace />
    </main>
  );
}
