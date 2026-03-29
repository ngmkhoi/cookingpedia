# Recipe Workspace Lanes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split private user navigation into focused `My Recipes`, `Saved`, and `Settings` lanes, and add the minimum backend actions needed to manage private recipes.

**Architecture:** Reuse the existing recipe and bookmark APIs where possible, adding only `DELETE /api/recipes/:id` and `POST /api/recipes/:id/move-to-draft`. On the web side, introduce `/my-recipes` and `/saved` as focused private pages, redirect the old `/profile/recipes/*` routes for compatibility, and retarget private navigation away from `/profile`.

**Tech Stack:** Express, Prisma, Next.js App Router, React, Playwright, Vitest

---

### Task 1: Lock backend recipe-management behavior with failing tests

**Files:**
- Modify: `apps/api/tests/recipe-draft.test.ts`

- [ ] **Step 1: Add failing tests for delete and move-to-draft**
- [ ] **Step 2: Run `pnpm --filter @cookpedia/api test -- recipe-draft.test.ts` and confirm failure**

### Task 2: Implement backend delete and move-to-draft actions

**Files:**
- Modify: `apps/api/src/modules/recipes/recipes.service.ts`
- Modify: `apps/api/src/modules/recipes/recipes.controller.ts`
- Modify: `apps/api/src/modules/recipes/recipes.routes.ts`

- [ ] **Step 1: Add `deleteOwned` service logic for `DRAFT` and `REJECTED`**
- [ ] **Step 2: Add `moveToDraft` service logic for `PENDING`**
- [ ] **Step 3: Expose controller and route handlers**
- [ ] **Step 4: Re-run `pnpm --filter @cookpedia/api test -- recipe-draft.test.ts` and confirm pass**

### Task 3: Add private lane pages and compatibility redirects

**Files:**
- Create: `apps/web/app/my-recipes/page.tsx`
- Create: `apps/web/app/my-recipes/new/page.tsx`
- Create: `apps/web/app/my-recipes/[id]/edit/page.tsx`
- Create: `apps/web/app/saved/page.tsx`
- Modify: `apps/web/app/profile/page.tsx`
- Modify: `apps/web/app/profile/recipes/new/page.tsx`
- Modify: `apps/web/app/profile/recipes/[id]/edit/page.tsx`

- [ ] **Step 1: Create focused `My Recipes` page shell**
- [ ] **Step 2: Create focused `Saved` page shell**
- [ ] **Step 3: Create new recipe create/edit lane pages under `/my-recipes/*`**
- [ ] **Step 4: Redirect old `/profile/recipes/*` routes to new `/my-recipes/*` routes**
- [ ] **Step 5: Repurpose `/profile` away from workspace behavior**

### Task 4: Implement private workspace UI actions

**Files:**
- Create: `apps/web/components/recipes/my-recipes-workspace.tsx`
- Create: `apps/web/components/bookmarks/saved-workspace.tsx`
- Modify: `apps/web/components/profile/profile-tabs.tsx` or remove usage from `/profile`

- [ ] **Step 1: Render owned recipe rows with status-aware actions**
- [ ] **Step 2: Wire delete, submit, and move-to-draft actions**
- [ ] **Step 3: Render saved recipe rows with unsave action**
- [ ] **Step 4: Add empty states and primary CTAs**

### Task 5: Retarget private navigation and create-entry links

**Files:**
- Modify: `apps/web/components/layout/site-header.tsx`
- Modify: `apps/web/components/layout/site-footer.tsx`
- Modify: `apps/web/components/home/hero-actions.tsx`
- Modify: `apps/web/components/auth/auth-dialog.tsx`
- Modify: `apps/web/components/auth/auth-form.tsx`
- Modify: `apps/web/app/settings/profile/page.tsx`

- [ ] **Step 1: Update authenticated menu links to `My Recipes`, `Saved`, `Settings`**
- [ ] **Step 2: Update footer account links**
- [ ] **Step 3: Retarget recipe creation entry to `/my-recipes/new`**
- [ ] **Step 4: Update post-auth redirects for non-admin users**
- [ ] **Step 5: Keep profile editing on `/settings/profile`**

### Task 6: Add focused end-to-end coverage

**Files:**
- Create: `tests/e2e/recipe-workspace.spec.ts`
- Modify: `tests/e2e/auth-and-profile.spec.ts`

- [ ] **Step 1: Add failing E2E coverage for `/my-recipes` and `/saved`**
- [ ] **Step 2: Update any old assertions that still expect `/profile` as the private workspace landing page**
- [ ] **Step 3: Run `pnpm --filter @cookpedia/web test -- recipe-workspace.spec.ts auth-and-profile.spec.ts` and confirm pass**

### Task 7: Final verification

**Files:**
- Verify only

- [ ] **Step 1: Run `pnpm --filter @cookpedia/api test -- recipe-draft.test.ts`**
- [ ] **Step 2: Run `pnpm --filter @cookpedia/web typecheck`**
- [ ] **Step 3: Run `pnpm --filter @cookpedia/web test -- recipe-workspace.spec.ts auth-and-profile.spec.ts`**
- [ ] **Step 4: Run `git diff --stat` and confirm scope matches the lane split only**
