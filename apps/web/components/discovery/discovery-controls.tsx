"use client";

import { FadersHorizontal, MagnifyingGlass } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";
import {
  type DiscoveryFilters,
  buildDiscoveryHref
} from "@/lib/discovery";
import { cn } from "@/lib/utils";

export function DiscoveryControls({
  filters
}: {
  filters: DiscoveryFilters;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(filters.q);
  const [sort, setSort] = useState(filters.sort);
  const [cuisine, setCuisine] = useState(filters.cuisine);
  const [difficulty, setDifficulty] = useState(filters.difficulty);
  const [maxCookMinutes, setMaxCookMinutes] = useState(filters.maxCookMinutes);
  const [advancedOpen, setAdvancedOpen] = useState(
    Boolean(filters.cuisine || filters.difficulty || filters.maxCookMinutes)
  );

  const pushFilters = (nextFilters: Partial<DiscoveryFilters>) => {
    router.push(
      buildDiscoveryHref({
        ...filters,
        q: query,
        sort,
        cuisine,
        difficulty,
        maxCookMinutes,
        ...nextFilters
      })
    );
  };

  return (
    <div className="panel grid gap-5 rounded-[2rem] border border-[var(--line-subtle)] bg-[rgba(251,250,246,0.9)] p-5 shadow-[0_18px_45px_-22px_rgba(22,32,25,0.16)] backdrop-blur-xl md:p-6">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          pushFilters({ q: query });
        }}
      >
        <label
          htmlFor="discovery-search"
          className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]"
        >
          Search the catalog
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            id="discovery-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by recipe or ingredient"
            className="h-12 border-[var(--line)] bg-[var(--panel)]"
          />
          <Button type="submit" className="gap-2">
            <MagnifyingGlass data-icon="inline-start" weight="duotone" />
            Search
          </Button>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
          Sort
        </p>
        <ToggleGroup
          type="single"
          value={sort}
          onValueChange={(value) => {
            if (!value) {
              return;
            }

            setSort(value as DiscoveryFilters["sort"]);
            pushFilters({ sort: value as DiscoveryFilters["sort"] });
          }}
          className="justify-start"
        >
          <ToggleGroupItem value="newest" variant="outline" className="rounded-full px-4">
            Newest
          </ToggleGroupItem>
          <ToggleGroupItem
            value="mostSaved"
            variant="outline"
            className="rounded-full px-4"
          >
            Most saved
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Advanced filters
          </p>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "gap-2 self-start rounded-full px-3"
              )}
            >
              <FadersHorizontal data-icon="inline-start" weight="duotone" />
              {advancedOpen ? "Hide" : "Show"}
            </button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="mt-4 grid gap-4 border-t border-[var(--line-subtle)] pt-4">
          <div className="grid gap-2">
            <label
              htmlFor="cuisine-filter"
              className="text-sm text-[var(--muted)]"
            >
              Cuisine
            </label>
            <Input
              id="cuisine-filter"
              value={cuisine}
              onChange={(event) => setCuisine(event.target.value)}
              placeholder="Vietnamese, Chinese, French-Vietnamese"
              className="h-11 border-[var(--line)] bg-[var(--panel)]"
            />
          </div>

          <div className="grid gap-2">
            <span className="text-sm text-[var(--muted)]">Difficulty</span>
            <ToggleGroup
              type="single"
              value={difficulty}
              onValueChange={(value) =>
                setDifficulty((value as DiscoveryFilters["difficulty"]) || "")
              }
              className="justify-start"
            >
              <ToggleGroupItem value="EASY" variant="outline" className="rounded-full px-4">
                Easy
              </ToggleGroupItem>
              <ToggleGroupItem
                value="MEDIUM"
                variant="outline"
                className="rounded-full px-4"
              >
                Medium
              </ToggleGroupItem>
              <ToggleGroupItem value="HARD" variant="outline" className="rounded-full px-4">
                Hard
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid gap-2">
            <label
              htmlFor="cook-time-filter"
              className="text-sm text-[var(--muted)]"
            >
              Max cook time
            </label>
            <Input
              id="cook-time-filter"
              value={maxCookMinutes}
              onChange={(event) => setMaxCookMinutes(event.target.value)}
              type="number"
              min="1"
              placeholder="20"
              className="h-11 border-[var(--line)] bg-[var(--panel)]"
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="button"
              className="gap-2"
              onClick={() =>
                pushFilters({
                  q: query,
                  sort,
                  cuisine,
                  difficulty,
                  maxCookMinutes
                })
              }
            >
              Apply filters
            </Button>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "secondary", size: "sm" }),
                "rounded-full"
              )}
              onClick={() => {
                setCuisine("");
                setDifficulty("");
                setMaxCookMinutes("");
                pushFilters({
                  cuisine: "",
                  difficulty: "",
                  maxCookMinutes: ""
                });
              }}
            >
              Clear advanced
            </button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
