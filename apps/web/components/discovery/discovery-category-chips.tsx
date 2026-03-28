import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  type DiscoveryFilters,
  buildDiscoveryHref
} from "@/lib/discovery";
import { cn } from "@/lib/utils";

type DiscoveryCategory = {
  name: string;
  recipeCount: number;
};

export function DiscoveryCategoryChips({
  categories,
  filters
}: {
  categories: DiscoveryCategory[];
  filters: DiscoveryFilters;
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
        Browse by category
      </p>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const active = filters.category === category.name;
          const href = buildDiscoveryHref({
            ...filters,
            category: active ? "" : category.name
          });

          return (
            <Link
              key={category.name}
              href={href}
              className={cn(
                buttonVariants({
                  variant: active ? "default" : "secondary",
                  size: "sm"
                }),
                "h-auto min-h-11 gap-3 rounded-full px-4 py-2"
              )}
            >
              <span>{category.name}</span>
              <Badge
                variant={active ? "secondary" : "outline"}
                className="rounded-full border-white/15 bg-transparent"
              >
                {category.recipeCount}
              </Badge>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
