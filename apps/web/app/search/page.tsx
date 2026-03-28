import { RecipeCard } from "@/components/recipes/recipe-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { apiGet } from "@/lib/api";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const data = query
    ? await apiGet<{ recipes: any[] }>(
        `/recipes/search?q=${encodeURIComponent(query)}`
      )
    : { recipes: [] };

  return (
    <main className="page-shell py-10">
      <div className="mb-8">
        <SectionHeading
          eyebrow="Search"
          title={`Results for "${query || "all recipes"}"`}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {data.recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </main>
  );
}
