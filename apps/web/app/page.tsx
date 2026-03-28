import Link from "next/link";
import { CategoryStrip } from "@/components/home/category-strip";
import { HeroActions } from "@/components/home/hero-actions";
import { TrendingShowcase } from "@/components/home/trending-showcase";
import { NewestGrid } from "@/components/home/newest-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/lib/api";

type HomepageRecipe = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImageUrl?: string;
  cookMinutes: number;
  prepMinutes: number;
  ratingAverage: number;
  bookmarkCount: number;
  author: {
    username: string;
    displayName: string;
  };
};

type HomeCategory = {
  name: string;
  recipeCount: number;
};

export default async function HomePage() {
  const data = await apiGet<{
    trending: HomepageRecipe[];
    newest: HomepageRecipe[];
    categories: HomeCategory[];
  }>("/recipes/home");

  const heroRecipe = data.trending[0] ?? data.newest[0];
  const trendingRecipes = data.trending.length > 1
    ? data.trending.slice(1)
    : data.newest.slice(0, 3);

  const heroBackdrop = heroRecipe?.coverImageUrl
    ? `linear-gradient(170deg, rgba(22, 32, 25, 0.62) 0%, rgba(50, 65, 50, 0.38) 50%, rgba(242, 239, 231, 0.95) 100%), url(${heroRecipe.coverImageUrl})`
    : "linear-gradient(170deg, rgba(22, 32, 25, 0.55) 0%, rgba(50, 65, 50, 0.25) 50%, rgba(242, 239, 231, 0.95) 100%)";

  return (
    <main className="min-h-[100dvh]">
      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage: heroBackdrop,
          backgroundSize: "cover",
          backgroundPosition: "center 30%"
        }}
      >
        {/* Gradient overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--canvas)]" />

        <div className="page-shell relative z-10 pb-28 pt-28 md:pb-36 md:pt-32 lg:pb-44 lg:pt-36">
          <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            {/* Left — editorial headline */}
            <div className="space-y-6">
              <h1 className="display-title max-w-[10ch] text-[clamp(3rem,7.5vw,6rem)] text-white drop-shadow-[0_2px_30px_rgba(22,32,25,0.3)]">
                Recipes with real structure
              </h1>
              <p className="max-w-[38ch] text-base leading-8 text-white/78">
                Ingredient-led discovery and structured cooking steps for people
                who actually cook from what they save.
              </p>

              <form
                action="/search"
                className="flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Input
                  name="q"
                  placeholder="Find recipes or ingredients"
                  className="flex-1 border-white/20 bg-white/90 text-[var(--ink)] placeholder:text-[var(--muted)] backdrop-blur-sm focus:border-white/40"
                />
                <Button type="submit">Search</Button>
              </form>

              <HeroActions />
            </div>

            {/* Right — floating featured recipe card */}
            {heroRecipe ? (
              <Link
                href={`/recipes/${heroRecipe.slug}`}
                className="group relative block overflow-hidden rounded-[2rem] border border-white/15 bg-white/12 p-1 backdrop-blur-md transition-all duration-500 hover:border-white/25 hover:bg-white/18"
                style={{ boxShadow: "var(--shadow-hero)" }}
              >
                <div
                  className="aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-[linear-gradient(155deg,#d5d0c7,#ebe7de)] bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
                  style={
                    heroRecipe.coverImageUrl
                      ? {
                          backgroundImage: `url(${heroRecipe.coverImageUrl})`
                        }
                      : undefined
                  }
                />
                <div className="p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                    Featured recipe
                  </p>
                  <h2 className="mt-2 max-w-[18ch] text-2xl leading-tight tracking-tight text-white">
                    {heroRecipe.title}
                  </h2>
                  <p className="mt-2 max-w-[28ch] text-sm leading-relaxed text-white/70">
                    {heroRecipe.shortDescription}
                  </p>
                  <div className="mt-4 flex items-center gap-5 text-xs text-white/55">
                    <span>{heroRecipe.bookmarkCount} saves</span>
                    <span>{heroRecipe.ratingAverage.toFixed(1)} / 5</span>
                    <span>
                      {heroRecipe.prepMinutes + heroRecipe.cookMinutes} min
                    </span>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2">
          <div className="h-10 w-[1px] animate-pulse bg-gradient-to-b from-transparent via-[var(--accent)] to-transparent opacity-40" />
        </div>
      </section>

      {/* ─── Trending ─── */}
      <TrendingShowcase recipes={trendingRecipes} />

      {/* ─── Categories ─── */}
      <CategoryStrip categories={data.categories} />

      {/* ─── Newest ─── */}
      <NewestGrid recipes={data.newest} />
    </main>
  );
}
