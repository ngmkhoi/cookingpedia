import { MyRecipesWorkspace } from "@/components/recipes/my-recipes-workspace";


export default function MyRecipesPage() {
  return (
    <main className="page-main">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl tracking-tight">My Recipes</h1>
          <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-[var(--muted)]">
            Manage drafts, review status, and move recipes back into editing when needed.
          </p>
        </div>
      </div>
      <MyRecipesWorkspace />
    </main>
  );
}
