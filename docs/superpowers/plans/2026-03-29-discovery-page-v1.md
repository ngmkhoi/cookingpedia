# Discovery Page V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/search` into a unified discovery page with non-empty default browse state, homepage preview CTA links, category-driven entry points, and hidden advanced filters.

**Architecture:** Reuse the existing public recipes query path instead of creating a new route. Expand backend query support around `/api/recipes/search`, then rebuild the frontend `/search` page as a discovery-first RSC that reads URL params and composes shadcn controls plus the existing Cookpedia card system.

**Tech Stack:** Express, Prisma, Vitest, Next.js App Router, shadcn/ui, Tailwind v3, Phosphor icons, Playwright

---

### Task 1: Lock in backend discovery behavior with failing tests

**Files:**
- Modify: `apps/api/tests/moderation-and-search.test.ts`
- Reference: `apps/api/src/modules/recipes/recipes.controller.ts`
- Reference: `apps/api/src/modules/recipes/recipes.service.ts`

- [ ] **Step 1: Add a failing test for default browse state**

Extend the public search suite so `/api/recipes/search` without `q` no longer expects an empty list. Add a test that seeds at least two published recipes and asserts the endpoint returns published results even when no keyword is present.

```ts
it("returns published recipes for discovery when no query is provided", async () => {
  const response = await request(app).get("/api/recipes/search");

  expect(response.status).toBe(200);
  expect(response.body.recipes.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Add failing sort and category coverage**

In the same suite, add one test that proves `sort=newest` returns the newest published recipe first, and one test that proves `category=<name>` narrows the results correctly.

```ts
const newestResponse = await request(app).get("/api/recipes/search?sort=newest");
expect(newestResponse.body.recipes[0].id).toBe(newestRecipeId);

const categoryResponse = await request(app).get(`/api/recipes/search?category=${encodeURIComponent(category)}`);
expect(categoryResponse.body.recipes.every((recipe: { category: string }) => recipe.category === category)).toBe(true);
```

- [ ] **Step 3: Run the API suite to verify RED**

Run: `pnpm --filter @cookpedia/api test`
Expected: FAIL because the current controller returns `[]` when `q` is blank and ignores the new discovery query params.

- [ ] **Step 4: Keep the existing pending/private search coverage intact**

Do not remove the current moderation visibility assertions. The new discovery behavior must still exclude non-published content.

### Task 2: Implement backend discovery query support

**Files:**
- Modify: `apps/api/src/modules/recipes/recipes.controller.ts`
- Modify: `apps/api/src/modules/recipes/recipes.service.ts`

- [ ] **Step 1: Introduce a typed discovery query shape**

Add a small internal query model in the recipes service layer for:

```ts
type PublicRecipeDiscoveryQuery = {
  q?: string;
  category?: string;
  sort: "newest" | "mostSaved";
  cuisine?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  maxCookMinutes?: number;
};
```

- [ ] **Step 2: Replace “blank query returns empty” with discovery semantics**

Update `recipesController.search` so it always builds a normalized discovery query object and delegates to the service, even when `q` is blank.

```ts
const discoveryQuery = {
  q: normalizedQuery || undefined,
  category: normalizedCategory || undefined,
  sort,
  cuisine: normalizedCuisine || undefined,
  difficulty,
  maxCookMinutes
};
```

- [ ] **Step 3: Implement filtering in the public recipes service**

Refactor the current `search` method or replace it with a discovery-capable method that:

- always filters to `status: "PUBLISHED"`
- applies `title` and `ingredient` matching when `q` exists
- applies `category`, `cuisine`, `difficulty`, and `maxCookMinutes` when present
- supports `sort=newest` and `sort=mostSaved`

Keep the return shape compatible with the current frontend card usage.

- [ ] **Step 4: Verify GREEN on the API side**

Run: `pnpm --filter @cookpedia/api test`
Expected: PASS

### Task 3: Install and wire the discovery UI primitives

**Files:**
- Create/Modify: `apps/web/components/ui/*` via shadcn
- Modify: `apps/web/package.json` only if shadcn installation requires it

- [ ] **Step 1: Add the required shadcn components**

Run:

```bash
pnpm dlx shadcn@latest add toggle-group badge collapsible
```

Review the generated files and make sure imports and composition match the project’s alias and radix base.

- [ ] **Step 2: Confirm the project still uses the repo’s visual language**

Do not leave raw default shadcn visuals untouched where they clash with Cookpedia. The primitives should be used as structure, not as a generic final look.

- [ ] **Step 3: Re-read the generated components before usage**

Check for:

- import alias correctness
- supported props
- variant names
- whether `ToggleGroupItem` requires wrapping in `ToggleGroup`

### Task 4: Rebuild `/search` as a discovery page

**Files:**
- Modify: `apps/web/app/search/page.tsx`
- Create: `apps/web/components/discovery/discovery-controls.tsx`
- Create: `apps/web/components/discovery/discovery-category-chips.tsx`
- Create: `apps/web/components/discovery/discovery-active-filters.tsx`
- Create: `apps/web/components/discovery/discovery-empty-state.tsx`
- Reuse: `apps/web/components/recipes/recipe-card.tsx`
- Reuse: `apps/web/components/ui/section-heading.tsx`

- [ ] **Step 1: Keep the page as an RSC shell**

`app/search/page.tsx` should stay server-driven and read `searchParams` directly. Use it to:

- normalize URL params
- fetch recipes from `/recipes/search?...`
- fetch categories from `/recipes/home`
- pass data and normalized state into smaller presentation components

- [ ] **Step 2: Build the primary controls row**

Create a focused controls component using:

- `Input` for `q`
- `ToggleGroup` for sort
- `Button` for the advanced filter toggle

The visual treatment should feel editorial and premium, not like a generic admin toolbar.

- [ ] **Step 3: Build category chips as the table-of-contents layer**

Create a category chip row that:

- reads available categories from the `/recipes/home` payload
- links into `/search?category=...`
- visually distinguishes the active category from inactive ones

- [ ] **Step 4: Add a collapsible advanced filter area**

Create an inline advanced filter panel with:

- cuisine
- difficulty
- max cook time

Use the installed `Collapsible` shadcn component directly and keep the panel subordinate to the main browse experience.

- [ ] **Step 5: Add active filter summary and clear action**

Render:

- result count
- visible chips/text summary of active filters
- `Clear filters` link back to `/search`

- [ ] **Step 6: Add proper empty state**

When the filtered result set is empty, show a composed empty state instead of a blank page:

```tsx
<DiscoveryEmptyState
  title="No recipes match this combination yet."
  description="Try removing one filter or switching to a broader category."
/>
```

- [ ] **Step 7: Keep the page useful with no query**

The page header should describe discovery, not only keyword search.

Expected examples:

- default state: “Browse published recipes”
- filtered newest state: “Newest recipes”
- keyword state: `Results for "egg"`

### Task 5: Convert homepage `Newest recipes` into a preview with CTA

**Files:**
- Modify: `apps/web/components/home/newest-grid.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Limit homepage newest data to six recipes**

Update the homepage data flow so the section is explicitly preview-sized.

- [ ] **Step 2: Add a visible CTA in the heading zone**

In `NewestGrid`, add a right-aligned or offset CTA:

```tsx
<Button asChild variant="outline">
  <Link href="/search?sort=newest">See all newest</Link>
</Button>
```

Style it to feel integrated with the section heading rather than appended as an afterthought.

- [ ] **Step 3: Preserve the one-featured-five-grid composition**

Keep:

- 1 featured newest recipe
- 5 supporting recipes

This preserves the homepage editorial rhythm while clarifying that the section is only a preview.

### Task 6: Route homepage category navigation into discovery

**Files:**
- Modify: `apps/web/components/home/category-strip.tsx`

- [ ] **Step 1: Ensure category links target the discovery URL model**

Use links of the form:

```tsx
href={`/search?category=${encodeURIComponent(category.name)}`}
```

- [ ] **Step 2: Preserve the current premium homepage styling**

Do not flatten the category strip into generic pills. Only update destination behavior if the current visual treatment is already aligned with the new discovery architecture.

### Task 7: Add E2E coverage for discovery entry points

**Files:**
- Modify: `tests/e2e/search-and-engagement.spec.ts`
- Modify: `tests/e2e/homepage-nav.spec.ts`

- [ ] **Step 1: Add a failing test for default populated `/search`**

Add a test proving `/search` renders results and visible discovery controls even with no `q`.

```ts
await page.goto("/search");
await expect(page.getByRole("textbox", { name: /search/i })).toBeVisible();
await expect(page.getByText(/recipes/i)).toBeVisible();
await expect(page.getByRole("link").first()).toBeVisible();
```

- [ ] **Step 2: Add a failing test for `See all newest`**

From the homepage, click the CTA and assert the URL includes `sort=newest` and the discovery page is populated.

- [ ] **Step 3: Add a failing test for category entry**

Click a homepage category card and assert the destination URL includes `category=...` and the results page renders normally.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm --filter @cookpedia/web test`
Expected: PASS

### Task 8: Final verification

**Files:**
- No new files

- [ ] **Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

- [ ] **Step 2: Run the full workspace test command**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Manual smoke-check discovery flows**

Verify manually:

- `/search` shows populated browse content
- `/search?sort=newest` behaves as newest listing
- category links land on filtered discovery state
- advanced filters can be opened and cleared

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/recipes/recipes.controller.ts apps/api/src/modules/recipes/recipes.service.ts apps/api/tests/moderation-and-search.test.ts apps/web/app/page.tsx apps/web/app/search/page.tsx apps/web/components/home/newest-grid.tsx apps/web/components/home/category-strip.tsx apps/web/components/discovery apps/web/components/ui tests/e2e/homepage-nav.spec.ts tests/e2e/search-and-engagement.spec.ts apps/web/package.json package.json pnpm-lock.yaml
git commit -m "feat: add unified discovery page"
```
