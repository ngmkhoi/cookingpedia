import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { type DiscoveryFilters, hasActiveFilters } from "@/lib/discovery";
import { cn } from "@/lib/utils";

function toActiveLabels(filters: DiscoveryFilters) {
  const labels: string[] = [];

  if (filters.sort === "mostSaved") {
    labels.push("Most saved");
  }

  if (filters.category) {
    labels.push(filters.category);
  }

  if (filters.q) {
    labels.push(`Keyword: ${filters.q}`);
  }

  if (filters.cuisine) {
    labels.push(`Cuisine: ${filters.cuisine}`);
  }

  if (filters.difficulty) {
    labels.push(`Difficulty: ${filters.difficulty}`);
  }

  if (filters.maxCookMinutes) {
    labels.push(`Cook <= ${filters.maxCookMinutes} min`);
  }

  return labels;
}

export function DiscoveryActiveFilters({
  filters,
  resultCount
}: {
  filters: DiscoveryFilters;
  resultCount: number;
}) {
  const labels = toActiveLabels(filters);

  return (
    <div className="flex flex-col gap-4 border-t border-[var(--line-subtle)] pt-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[var(--muted)]">
          {resultCount} {resultCount === 1 ? "recipe" : "recipes"} on this shelf
        </p>
        {labels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <Badge key={label} variant="outline" className="rounded-full">
                {label}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      {hasActiveFilters(filters) ? (
        <Link
          href="/search"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "rounded-full")}
        >
          Clear filters
        </Link>
      ) : null}
    </div>
  );
}
