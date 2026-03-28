export type DiscoverySort = "newest" | "mostSaved";
export type DiscoveryDifficulty = "" | "EASY" | "MEDIUM" | "HARD";

export type DiscoveryFilters = {
  q: string;
  category: string;
  sort: DiscoverySort;
  cuisine: string;
  difficulty: DiscoveryDifficulty;
  maxCookMinutes: string;
};

type RawSearchParam = string | string[] | undefined;

const firstParam = (value: RawSearchParam) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const trimParam = (value: RawSearchParam) => firstParam(value).trim();

export function normalizeDiscoveryFilters(
  searchParams: Record<string, RawSearchParam>
): DiscoveryFilters {
  const sortParam = trimParam(searchParams.sort);
  const difficultyParam = trimParam(searchParams.difficulty).toUpperCase();

  return {
    q: trimParam(searchParams.q),
    category: trimParam(searchParams.category),
    sort: sortParam === "mostSaved" ? "mostSaved" : "newest",
    cuisine: trimParam(searchParams.cuisine),
    difficulty:
      difficultyParam === "EASY" ||
      difficultyParam === "MEDIUM" ||
      difficultyParam === "HARD"
        ? difficultyParam
        : "",
    maxCookMinutes: trimParam(searchParams.maxCookMinutes)
  };
}

export function buildDiscoveryQueryString(filters: Partial<DiscoveryFilters>) {
  const params = new URLSearchParams();

  if (filters.q?.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.category?.trim()) {
    params.set("category", filters.category.trim());
  }

  if (filters.sort) {
    params.set("sort", filters.sort);
  }

  if (filters.cuisine?.trim()) {
    params.set("cuisine", filters.cuisine.trim());
  }

  if (filters.difficulty) {
    params.set("difficulty", filters.difficulty);
  }

  if (filters.maxCookMinutes?.trim()) {
    params.set("maxCookMinutes", filters.maxCookMinutes.trim());
  }

  return params.toString();
}

export function buildDiscoveryHref(filters: Partial<DiscoveryFilters>) {
  const query = buildDiscoveryQueryString(filters);
  return query ? `/search?${query}` : "/search";
}

export function getDiscoveryHeading(
  filters: DiscoveryFilters,
  options?: { explicitSort?: boolean }
) {
  if (filters.q) {
    return {
      eyebrow: "Search",
      title: `Results for "${filters.q}"`,
      description:
        "Refine the catalog with category, sort, or advanced controls without leaving the discovery shelf."
    };
  }

  if (filters.category && filters.sort === "mostSaved") {
    return {
      eyebrow: "Discovery",
      title: `${filters.category}, most saved`,
      description:
        "A focused slice of the catalog, ranked by what readers keep saving."
    };
  }

  if (filters.category) {
    return {
      eyebrow: "Discovery",
      title: `${filters.category} recipes`,
      description:
        "Browse one category at a time, then narrow the shelf with advanced filters when needed."
    };
  }

  if (filters.sort === "mostSaved") {
    return {
      eyebrow: "Discovery",
      title: "Most saved recipes",
      description:
        "Published recipes ranked by how often readers keep them in their collection."
    };
  }

  if (options?.explicitSort && filters.sort === "newest") {
    return {
      eyebrow: "Discovery",
      title: "Newest recipes",
      description:
        "The latest published additions, arranged in the order they landed on the shelf."
    };
  }

  return {
    eyebrow: "Discovery",
    title: "Browse published recipes",
    description:
      "Use the catalog like a table of contents: start broad, then narrow by category or advanced filters."
  };
}

export function hasActiveFilters(filters: DiscoveryFilters) {
  return Boolean(
    filters.q ||
      filters.category ||
      filters.cuisine ||
      filters.difficulty ||
      filters.maxCookMinutes ||
      filters.sort !== "newest"
  );
}
