import Link from "next/link";
import { CardSurface } from "@/components/ui/card-surface";
import { ScrollReveal } from "@/components/ui/scroll-animations";

type HomepageRecipe = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  coverImageUrl?: string;
  bookmarkCount: number;
  ratingAverage: number;
  prepMinutes: number;
  cookMinutes: number;
  author: {
    displayName: string;
  };
};

export function TrendingShowcase({ recipes }: { recipes: HomepageRecipe[] }) {
  const [lead, ...rest] = recipes;

  if (!lead) {
    return null;
  }

  return (
    <section id="trending" className="page-shell section-block">
      <ScrollReveal>
        <div className="mb-10 space-y-3">
          <p className="section-label">Trending now</p>
          <h2 className="display-title max-w-[12ch] text-[clamp(2.4rem,5vw,4rem)]">
            What people keep saving this week
          </h2>
        </div>
      </ScrollReveal>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <ScrollReveal>
          <CardSurface className="panel-hover overflow-hidden">
            <Link href={`/recipes/${lead.slug}`} className="group flex flex-col">
              <div className="img-zoom aspect-[16/10]">
                <div
                  aria-label={lead.title}
                  className="h-full w-full bg-[linear-gradient(155deg,#d5d0c7,#ebe7de)] bg-cover bg-center"
                  style={
                    lead.coverImageUrl
                      ? {
                          backgroundImage: `linear-gradient(rgba(22, 32, 25, 0.04), rgba(22, 32, 25, 0.10)), url(${lead.coverImageUrl})`
                        }
                      : undefined
                  }
                />
              </div>
              <div className="flex flex-col gap-4 p-8">
                <div className="space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted-warm)]">
                    {lead.author.displayName}
                  </p>
                  <h3 className="display-title max-w-[12ch] text-[clamp(2rem,3.5vw,3rem)]">
                    {lead.title}
                  </h3>
                  <p className="max-w-[30ch] text-sm leading-relaxed text-[var(--muted)]">
                    {lead.shortDescription}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--muted-warm)]">
                  <span>{lead.bookmarkCount} saves</span>
                  <span className="h-1 w-1 rounded-full bg-[var(--line)]" />
                  <span>{lead.ratingAverage.toFixed(1)} / 5</span>
                  <span className="h-1 w-1 rounded-full bg-[var(--line)]" />
                  <span>
                    {lead.prepMinutes + lead.cookMinutes} min total
                  </span>
                </div>
              </div>
            </Link>
          </CardSurface>
        </ScrollReveal>

        <div className="grid gap-6">
          {rest.map((recipe, index) => (
            <ScrollReveal key={recipe.id} delay={index + 1}>
              <CardSurface className="panel-hover overflow-hidden">
                <Link
                  href={`/recipes/${recipe.slug}`}
                  className="group block"
                >
                  <div className="img-zoom aspect-[16/10]">
                    <div
                      aria-label={recipe.title}
                      className="h-full w-full bg-[linear-gradient(155deg,#d7d2c8,#ece8df)] bg-cover bg-center"
                      style={
                        recipe.coverImageUrl
                          ? {
                              backgroundImage: `linear-gradient(rgba(22, 32, 25, 0.04), rgba(22, 32, 25, 0.10)), url(${recipe.coverImageUrl})`
                            }
                          : undefined
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2 p-5">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-warm)]">
                      {recipe.author.displayName}
                    </p>
                    <h3 className="text-lg leading-tight tracking-tight">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-[var(--muted-warm)]">
                      <span>{recipe.bookmarkCount} saves</span>
                      <span className="h-1 w-1 rounded-full bg-[var(--line)]" />
                      <span>{recipe.ratingAverage.toFixed(1)} / 5</span>
                    </div>
                  </div>
                </Link>
              </CardSurface>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
