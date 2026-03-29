# Homepage Hero Fixed Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove recipe-image-driven hero section backgrounds and replace them with a fixed brand-controlled hero backdrop while preserving the featured recipe image card.

**Architecture:** Keep the homepage hero layout intact. Change only the hero section background source so the section always renders a fixed Cookpedia gradient, and keep recipe imagery confined to the featured card on the right.

**Tech Stack:** Next.js App Router, Tailwind v3, Playwright, existing Cookpedia design tokens

---

### Task 1: Add a failing regression test for the hero background

**Files:**
- Modify: `tests/e2e/homepage-nav.spec.ts`
- Reference: `apps/web/app/page.tsx`

- [ ] **Step 1: Add a focused homepage hero background assertion**

Extend the homepage coverage with one assertion that the hero section background no longer contains a recipe image URL.

```ts
const heroSection = page.locator("main > section").first();
await expect(heroSection).not.toHaveCSS("background-image", /url\(/);
```

Keep the assertion inside the existing homepage coverage rather than introducing a separate file.

- [ ] **Step 2: Run the web E2E suite to verify RED**

Run: `pnpm --filter @cookpedia/web test`
Expected: FAIL because the hero section currently uses `heroRecipe.coverImageUrl` inside its section background.

### Task 2: Replace the hero background with a fixed branded backdrop

**Files:**
- Modify: `apps/web/app/page.tsx`

- [ ] **Step 1: Remove recipe image coupling from the hero section**

Delete the current logic that builds:

```ts
const heroBackdrop = heroRecipe?.coverImageUrl
  ? `... url(${heroRecipe.coverImageUrl})`
  : `...`;
```

Replace it with a single fixed background value that never depends on recipe data.

- [ ] **Step 2: Use a fixed Cookpedia backdrop**

Implement this exact palette-controlled background:

```ts
const heroBackdrop =
  "radial-gradient(ellipse 120% 90% at 15% 5%, rgba(122, 111, 87, 0.18), transparent 48%), radial-gradient(ellipse 90% 70% at 85% 0%, rgba(81, 96, 68, 0.26), transparent 55%), linear-gradient(180deg, #2d3a2f 0%, #435246 42%, #d8d1c2 100%)";
```

Keep the visual mood warm, editorial, and stable. Do not introduce a flat single-color background.

- [ ] **Step 3: Preserve the featured recipe card image**

Do not remove the card-level image usage:

```ts
heroRecipe.coverImageUrl
```

The card remains dynamic; only the section background becomes fixed.

- [ ] **Step 4: Keep homepage header contrast intact**

The fixed backdrop must still support the transparent homepage header state before scroll, without washing out the white navigation text.

### Task 3: Verify and ship

**Files:**
- No new files

- [ ] **Step 1: Run the web E2E suite to verify GREEN**

Run: `pnpm --filter @cookpedia/web test`
Expected: PASS

- [ ] **Step 2: Run the full workspace test command**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/page.tsx tests/e2e/homepage-nav.spec.ts
git commit -m "fix(web): use fixed homepage hero backdrop"
```
