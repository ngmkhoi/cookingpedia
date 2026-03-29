# Homepage Newest Preview Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the homepage `Newest recipes` preview to show 1 featured card plus 6 smaller cards on desktop/tablet, while limiting mobile to 1 featured card plus 3 smaller cards.

**Architecture:** Keep the existing `NewestGrid` structure and CTA behavior. Expand the preview slice to seven recipes total, add explicit test hooks for newest cards, and use responsive visibility classes so the same rendered dataset can collapse from 6 smaller cards to 3 smaller cards on mobile.

**Tech Stack:** Next.js App Router, Tailwind v3, existing homepage components, Playwright

---

### Task 1: Add failing regression coverage for the newest preview

**Files:**
- Modify: `tests/e2e/homepage-nav.spec.ts`
- Reference: `apps/web/components/home/newest-grid.tsx`

- [ ] **Step 1: Add a desktop assertion for seven newest cards total**

In the homepage test file, add a regression that loads `/`, scopes to the `Newest recipes` section, and asserts:

- exactly `1` featured newest card
- exactly `6` visible smaller newest cards on desktop

Use explicit test hooks such as:

```ts
await expect(page.getByTestId("newest-featured-card")).toHaveCount(1);
await expect(page.getByTestId("newest-preview-card")).toHaveCount(6);
```

- [ ] **Step 2: Add a mobile assertion for only three visible smaller cards**

Add a second test that sets a mobile viewport before navigation and asserts:

- `1` featured newest card remains visible
- only `3` smaller newest cards are visible

Use `locator(":visible")` if hidden desktop-only cards remain in the DOM.

- [ ] **Step 3: Run the web suite to verify RED**

Run: `pnpm --filter @cookpedia/web test`
Expected: FAIL because the section currently slices to 6 total recipes and has no responsive limit for smaller cards.

### Task 2: Implement the preview count change

**Files:**
- Modify: `apps/web/components/home/newest-grid.tsx`
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Increase the homepage slice to seven recipes**

Update the homepage handoff so `NewestGrid` receives up to `7` recipes:

```ts
<NewestGrid recipes={data.newest.slice(0, 7)} />
```

- [ ] **Step 2: Preserve one featured card and map six smaller cards**

Inside `NewestGrid`, keep the current featured-card split:

```ts
const previewRecipes = recipes.slice(0, 7);
const [featured, ...remaining] = previewRecipes;
```

- [ ] **Step 3: Add explicit test hooks**

Add:

```tsx
data-testid="newest-featured-card"
data-testid="newest-preview-card"
```

to the correct card wrappers so E2E coverage is deterministic.

- [ ] **Step 4: Make the last three small cards desktop/tablet only**

Keep all 6 smaller cards visible from `md` upward, but hide indices `3`, `4`, and `5` on mobile with explicit responsive classes, for example:

```tsx
className={cn(index >= 3 ? "hidden md:block" : "")}
```

This ensures:

- mobile => 3 smaller cards
- tablet/desktop => 6 smaller cards

- [ ] **Step 5: Preserve visual balance**

Do not change:

- the featured card layout
- the CTA placement
- the overall editorial spacing rhythm

Only change card counts and responsive visibility.

### Task 3: Verify and ship

**Files:**
- No new files

- [ ] **Step 1: Run the web E2E suite**

Run: `pnpm --filter @cookpedia/web test`
Expected: PASS

- [ ] **Step 2: Run the full workspace suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx apps/web/components/home/newest-grid.tsx tests/e2e/homepage-nav.spec.ts
git commit -m "fix(web): rebalance newest recipe preview"
```
