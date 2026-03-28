import { apiGet } from "@/lib/api";

type RecipeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RecipeDetailPage({
  params
}: RecipeDetailPageProps) {
  const { slug } = await params;
  const { recipe } = await apiGet<{ recipe: any }>(`/recipes/slug/${slug}`);

  return (
    <main className="page-shell py-10">
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
        <aside className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
              {recipe.author.displayName}
            </p>
            <h1 className="mt-2 text-5xl tracking-tighter">{recipe.title}</h1>
            <p className="mt-4 max-w-[55ch] leading-relaxed text-[var(--muted)]">
              {recipe.shortDescription}
            </p>
          </div>
          <div className="panel grid gap-4 p-6">
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
          </div>
        </aside>
      </div>
    </main>
  );
}
