import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ScrollReveal } from "@/components/ui/scroll-animations";

type FeaturedCategory = {
  name: string;
  recipeCount: number;
};

const CATEGORY_THEMES: Record<string, { gradient: string; accent: string }> = {
  Breakfast: { gradient: "from-amber-800/90 to-amber-900/70", accent: "text-amber-200" },
  Lunch: { gradient: "from-emerald-800/90 to-emerald-900/70", accent: "text-emerald-200" },
  Dinner: { gradient: "from-stone-700/90 to-stone-800/70", accent: "text-stone-200" },
  Dessert: { gradient: "from-rose-800/80 to-rose-900/60", accent: "text-rose-200" },
  Drinks: { gradient: "from-sky-800/80 to-sky-900/60", accent: "text-sky-200" }
};

const DEFAULT_THEME = { gradient: "from-[var(--accent-strong)] to-[#4f5f4f]", accent: "text-emerald-200" };

export function CategoryStrip({
  categories
}: {
  categories: FeaturedCategory[];
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="page-shell section-block">
      <ScrollReveal>
        <div className="mb-10 space-y-3">
          <p className="section-label">Browse by category</p>
          <h2 className="display-title max-w-[14ch] text-[clamp(2.2rem,4.5vw,3.6rem)]">
            The kinds of meals people keep publishing
          </h2>
        </div>
      </ScrollReveal>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category, index) => {
          const theme =
            CATEGORY_THEMES[category.name] ?? DEFAULT_THEME;
          const isLead = index === 0;

          return (
            <ScrollReveal key={category.name} delay={index + 1}>
              <Link
                href={`/search?q=${encodeURIComponent(category.name)}`}
                className={isLead ? "md:col-span-2 xl:col-span-1" : ""}
              >
                <div
                  className={`group relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 transition-all duration-500 hover:shadow-lg ${theme.gradient}`}
                >
                  {/* Ambient pattern */}
                  <div className="absolute inset-0 opacity-[0.06]">
                    <div
                      className="h-full w-full"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)"
                      }}
                    />
                  </div>

                  <div className="relative flex items-start justify-between gap-4">
                    <span
                      className={`text-sm font-medium ${theme.accent} opacity-70`}
                    >
                      {category.recipeCount}{" "}
                      {category.recipeCount === 1 ? "recipe" : "recipes"}
                    </span>
                    <ArrowRight
                      className={`text-lg transition-transform duration-400 group-hover:translate-x-2 ${theme.accent} opacity-60`}
                      weight="bold"
                    />
                  </div>

                  <div className="relative">
                    <h3 className="display-title text-[clamp(2rem,3vw,2.6rem)] text-white">
                      {category.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
