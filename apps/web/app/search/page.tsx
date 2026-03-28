import { DiscoveryActiveFilters } from "@/components/discovery/discovery-active-filters";
import { DiscoveryCategoryChips } from "@/components/discovery/discovery-category-chips";
import { DiscoveryControls } from "@/components/discovery/discovery-controls";
import { DiscoveryEmptyState } from "@/components/discovery/discovery-empty-state";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { apiGet } from "@/lib/api";
import {
  buildDiscoveryQueryString,
  getDiscoveryHeading,
  normalizeDiscoveryFilters
} from "@/lib/discovery";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    cuisine?: string;
    difficulty?: string;
    maxCookMinutes?: string;
  }>;
};

type DiscoveryRecipe = {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string | null;
  cookMinutes: number;
  prepMinutes: number;
  ratingAverage: number;
  author: {
    username: string;
    displayName: string;
  };
};

type HomeCategory = {
  name: string;
  recipeCount: number;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = normalizeDiscoveryFilters(resolvedSearchParams);
  const queryString = buildDiscoveryQueryString(filters);
  const { eyebrow, title, description } = getDiscoveryHeading(filters, {
    explicitSort: Boolean(resolvedSearchParams.sort)
  });

  const [searchData, homeData] = await Promise.all([
    apiGet<{ recipes: DiscoveryRecipe[] }>(
      `/recipes/search${queryString ? `?${queryString}` : ""}`
    ),
    apiGet<{
      categories: HomeCategory[];
    }>("/recipes/home")
  ]);

  return (
    <main className="page-main">
      <div className="grid gap-10 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)] xl:items-start">
        <aside className="grid gap-8 xl:sticky xl:top-28">
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
          />
          <DiscoveryControls filters={filters} />
          <DiscoveryCategoryChips
            categories={homeData.categories}
            filters={filters}
          />
        </aside>

        <section className="grid gap-8">
          <DiscoveryActiveFilters
            filters={filters}
            resultCount={searchData.recipes.length}
          />

          {searchData.recipes.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
              {searchData.recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : (
            <DiscoveryEmptyState />
          )}
        </section>
      </div>
    </main>
  );
}
