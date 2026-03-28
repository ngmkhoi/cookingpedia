export const RECIPE_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED"
} as const;

export const RECIPE_DIFFICULTY = {
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD"
} as const;

export const RECIPE_SORT = {
  newest: "newest",
  mostSaved: "mostSaved"
} as const;
