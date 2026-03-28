import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CardSurface } from "@/components/ui/card-surface";
import { buttonVariants } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-animations";
import { cn } from "@/lib/utils";

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

export function NewestGrid({ recipes }: { recipes: HomepageRecipe[] }) {
  const previewRecipes = recipes.slice(0, 7);

  if (previewRecipes.length === 0) {
    return null;
  }

  const [featured, ...remaining] = previewRecipes;

  return (
    <section className="page-shell section-block">
      <ScrollReveal>
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="section-label">Latest from the shelf</p>
            <h2 className="display-title text-[clamp(2.2rem,4.5vw,3.6rem)]">
              Newest recipes
            </h2>
          </div>
          <Link
            href="/search?sort=newest"
            className={cn(
              buttonVariants({ variant: "secondary", size: "sm" }),
              "gap-2 self-start rounded-full"
            )}
          >
            See all newest
            <ArrowRight data-icon="inline-end" weight="bold" />
          </Link>
        </div>
      </ScrollReveal>

      {/* Featured — horizontal layout */}
      {featured && (
        <ScrollReveal className="mb-6">
          <div data-testid="newest-featured-card">
            <CardSurface className="panel-hover overflow-hidden">
              <Link
                href={`/recipes/${featured.slug}`}
                className="group grid gap-0 md:grid-cols-[1.2fr_0.8fr]"
              >
                <div className="img-zoom aspect-[16/10] md:aspect-auto md:min-h-[340px]">
                  <div
                    aria-label={featured.title}
                    className="h-full w-full bg-[linear-gradient(155deg,#d5d0c7,#ebe7de)] bg-cover bg-center"
                    style={
                      featured.coverImageUrl
                        ? {
                            backgroundImage: `linear-gradient(rgba(22, 32, 25, 0.03), rgba(22, 32, 25, 0.08)), url(${featured.coverImageUrl})`
                          }
                        : undefined
                    }
                  />
                </div>
                <div className="flex flex-col justify-center gap-4 p-8 md:p-10">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted-warm)]">
                    {featured.author.displayName}
                  </p>
                  <h3 className="display-title max-w-[14ch] text-[clamp(1.8rem,3vw,2.8rem)]">
                    {featured.title}
                  </h3>
                  <p className="max-w-[30ch] text-sm leading-relaxed text-[var(--muted)]">
                    {featured.shortDescription}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[var(--muted-warm)]">
                    <span>
                      {featured.prepMinutes + featured.cookMinutes} min
                    </span>
                    <span className="h-1 w-1 rounded-full bg-[var(--line)]" />
                    <span>{featured.ratingAverage.toFixed(1)} / 5</span>
                  </div>
                </div>
              </Link>
            </CardSurface>
          </div>
        </ScrollReveal>
      )}

      {/* Remaining — grid with variable sizes */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {remaining.map((recipe, index) => (
          <ScrollReveal
            key={recipe.id}
            delay={index + 1}
            className={cn(index >= 3 ? "hidden md:block" : "")}
          >
            <div data-testid="newest-preview-card">
              <CardSurface className="panel-hover overflow-hidden">
                <Link
                  href={`/recipes/${recipe.slug}`}
                  className="group block"
                >
                  <div className="img-zoom aspect-[4/3]">
                    <div
                      aria-label={recipe.title}
                      className="h-full w-full bg-[linear-gradient(155deg,#d7d2c8,#ece8df)] bg-cover bg-center"
                      style={
                        recipe.coverImageUrl
                          ? {
                              backgroundImage: `linear-gradient(rgba(22, 32, 25, 0.05), rgba(22, 32, 25, 0.10)), url(${recipe.coverImageUrl})`
                            }
                          : undefined
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-3 p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-warm)]">
                      {recipe.author.displayName}
                    </p>
                    <h3 className="text-xl tracking-tight">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-[var(--muted-warm)]">
                      <span>
                        {recipe.prepMinutes + recipe.cookMinutes} min
                      </span>
                      <span>{recipe.ratingAverage.toFixed(1)} / 5</span>
                    </div>
                  </div>
                </Link>
              </CardSurface>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
