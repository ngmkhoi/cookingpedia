import { RecipeStudioForm } from "../../../../components/recipes/recipe-studio-form";

export default function NewRecipePage() {
  return (
    <main className="page-main">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Recipe studio
        </p>
        <h1 className="text-4xl tracking-tight">Create a new recipe</h1>
      </div>
      <RecipeStudioForm />
    </main>
  );
}
