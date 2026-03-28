# Cookpedia Homepage and Auth Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the public Cookpedia shell so the homepage feels editorial and discovery-led, the header reflects real auth state, guests hit auth gates through a dialog instead of hard redirects, and admins redirect directly into moderation without public admin nav.

**Architecture:** Add one dedicated homepage API payload on the backend, keep `/auth/me` as the canonical auth-state read, bootstrap that auth state in the web provider layer, and then rebuild the header/homepage/footer around those contracts. Keep the redesign additive over the current phase-1 code instead of rewriting the whole app structure.

**Tech Stack:** Express, Prisma, Vitest, Supertest, Next.js App Router, Redux Toolkit, React Hook Form, Playwright, Tailwind CSS

---

## Repository Structure

Backend files:

- Modify: `apps/api/src/modules/recipes/recipes.service.ts` — add homepage payload queries and category aggregation
- Modify: `apps/api/src/modules/recipes/recipes.controller.ts` — expose `/recipes/home`
- Modify: `apps/api/src/modules/recipes/recipes.routes.ts` — route homepage endpoint
- Create: `apps/api/tests/home-feed.test.ts` — regression test for homepage data payload

Frontend files:

- Modify: `apps/web/app/layout.tsx` — add footer, auth-aware shell scaffolding, serif display font
- Modify: `apps/web/app/page.tsx` — rebuild homepage composition
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/web/app/register/page.tsx`
- Modify: `apps/web/components/layout/site-header.tsx` — auth-aware nav and account menus
- Modify: `apps/web/components/auth/auth-form.tsx` — redirect based on `/auth/me`
- Modify: `apps/web/lib/providers.tsx` — bootstrap auth state from `/auth/me`
- Modify: `apps/web/lib/constants/site.ts` — footer/nav/link definitions
- Modify: `apps/web/app/globals.css` — typography, surfaces, layout rhythm
- Modify: `apps/web/features/auth/auth-slice.ts` — support deterministic bootstrap state
- Create: `apps/web/components/auth/auth-dialog.tsx` — protected-action login dialog
- Create: `apps/web/components/layout/site-footer.tsx` — practical footer
- Create: `apps/web/components/home/trending-showcase.tsx`
- Create: `apps/web/components/home/category-strip.tsx`
- Create: `apps/web/components/home/hero-actions.tsx`
- Create: `apps/web/app/privacy/page.tsx`
- Create: `apps/web/app/terms/page.tsx`

Frontend tests:

- Create: `tests/e2e/homepage-nav.spec.ts` — guest account entry and homepage shell
- Modify: `tests/e2e/auth-and-profile.spec.ts` — keep user redirect verification
- Modify: `tests/e2e/moderation-flow.spec.ts` — ensure admin redirect to moderation queue

### Task 1: Add Dedicated Homepage Payload

**Files:**
- Create: `apps/api/tests/home-feed.test.ts`
- Modify: `apps/api/src/modules/recipes/recipes.service.ts`
- Modify: `apps/api/src/modules/recipes/recipes.controller.ts`
- Modify: `apps/api/src/modules/recipes/recipes.routes.ts`

- [ ] **Step 1: Write the failing homepage payload test**

```ts
import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

describe("homepage feed", () => {
  it("returns trending, newest, and featured categories from published recipes only", async () => {
    const author = request.agent(app);
    const suffix = Date.now().toString(36);

    await author.post("/api/auth/register").send({
      email: `home-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Home Author",
      username: `home-author-${suffix}`
    });

    const first = await author.post("/api/recipes").send({
      title: `Trending Recipe ${suffix}`,
      shortDescription: "Bold and savory bowl for a busy evening.",
      prepMinutes: 10,
      cookMinutes: 20,
      servings: 2,
      coverImageUrl: "https://example.com/trending.jpg",
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      locale: "vi",
      images: [{ imageUrl: "https://example.com/trending.jpg", sortOrder: 1 }],
      ingredients: [{ name: `fish-${suffix}`, quantity: 1, unit: "kg", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Cook slowly and finish glossy." }]
    });

    const second = await author.post("/api/recipes").send({
      title: `Newest Recipe ${suffix}`,
      shortDescription: "Fresh and bright plate for late lunch.",
      prepMinutes: 8,
      cookMinutes: 12,
      servings: 2,
      coverImageUrl: "https://example.com/newest.jpg",
      category: "Lunch",
      cuisine: "Vietnamese",
      difficulty: "EASY",
      locale: "vi",
      images: [{ imageUrl: "https://example.com/newest.jpg", sortOrder: 1 }],
      ingredients: [{ name: `herb-${suffix}`, quantity: 1, unit: "bunch", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Assemble and serve immediately." }]
    });

    await prisma.recipe.update({
      where: { id: first.body.recipe.id },
      data: { status: "PUBLISHED", bookmarkCount: 7, ratingAverage: 4.8 }
    });

    await prisma.recipe.update({
      where: { id: second.body.recipe.id },
      data: { status: "PUBLISHED", bookmarkCount: 2, ratingAverage: 4.5 }
    });

    const response = await request(app).get("/api/recipes/home");

    expect(response.status).toBe(200);
    expect(response.body.trending[0].id).toBe(first.body.recipe.id);
    expect(response.body.newest[0].id).toBe(second.body.recipe.id);
    expect(response.body.categories[0].name).toBe("Dinner");
  });
});
```

- [ ] **Step 2: Run the homepage feed test to verify RED**

Run: `pnpm --filter @cookpedia/api test -- home-feed.test.ts`
Expected: FAIL because `/api/recipes/home` does not exist.

- [ ] **Step 3: Implement minimal homepage queries**

```ts
async home() {
  const [trending, newest, categories] = await Promise.all([
    prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
      orderBy: [{ bookmarkCount: "desc" }, { ratingAverage: "desc" }, { createdAt: "desc" }],
      take: 4
    }),
    prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      include: { author: { select: { username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.recipe.groupBy({
      by: ["category"],
      where: { status: "PUBLISHED" },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
      take: 6
    })
  ]);

  return {
    trending,
    newest,
    categories: categories.map((item) => ({
      name: item.category,
      recipeCount: item._count._all
    }))
  };
}
```

- [ ] **Step 4: Wire controller and route**

```ts
recipesRouter.get("/home", asyncHandler(async (req, res) => {
  return recipesController.home(req, res);
}));
```

- [ ] **Step 5: Verify GREEN**

Run: `pnpm --filter @cookpedia/api test -- home-feed.test.ts`
Expected: PASS

### Task 2: Make the Shared Shell Auth-Aware

**Files:**
- Modify: `apps/web/lib/providers.tsx`
- Modify: `apps/web/features/auth/auth-slice.ts`
- Modify: `apps/web/components/layout/site-header.tsx`
- Modify: `apps/web/components/auth/auth-form.tsx`
- Create: `apps/web/components/auth/auth-dialog.tsx`
- Create: `tests/e2e/homepage-nav.spec.ts`

- [ ] **Step 1: Write the failing browser test for guest account entry**

```ts
import { expect, test } from "@playwright/test";

test("guest header exposes account entry and auth routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /login|register/i }).click();
  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" })).toBeVisible();
});
```

- [ ] **Step 2: Run the guest header test to verify RED**

Run: `pnpm --filter @cookpedia/web exec playwright test -c ../../playwright.config.ts homepage-nav.spec.ts`
Expected: FAIL because the current header is static and has no auth-aware account trigger.

- [ ] **Step 3: Bootstrap auth state from `/auth/me`**

```ts
useEffect(() => {
  let active = true;

  const load = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" });
      if (!active) return;
      if (!response.ok) {
        dispatch(clearAuthState());
        return;
      }

      const data = await response.json();
      dispatch(setAuthState({ status: "authenticated", user: data.user }));
    } catch {
      if (active) dispatch(clearAuthState());
    }
  };

  void load();
  return () => {
    active = false;
  };
}, [dispatch]);
```

- [ ] **Step 4: Make auth forms resolve destination from `/auth/me`**

```ts
const me = await apiGet<{ user: { role: "USER" | "ADMIN" } }>("/auth/me", true);
window.location.href = me.user.role === "ADMIN" ? "/admin/recipes/pending" : "/profile";
```

- [ ] **Step 5: Build header account menus and logout**

```tsx
{auth.status === "authenticated" ? (
  <details>
    <summary>Profile</summary>
    <Link href="/profile">Profile</Link>
    <Link href="/profile/recipes/new">My Recipes</Link>
    <Link href="/profile">Saved</Link>
    <Link href="/settings/profile">Settings</Link>
    <button onClick={handleLogout}>Logout</button>
  </details>
) : (
  <details>
    <summary>Login / Register</summary>
    <Link href="/login">Login</Link>
    <Link href="/register">Register</Link>
  </details>
)}
```

- [ ] **Step 6: Verify GREEN**

Run: `pnpm --filter @cookpedia/web exec playwright test -c ../../playwright.config.ts homepage-nav.spec.ts`
Expected: PASS

### Task 3: Redesign the Homepage and Footer

**Files:**
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/lib/constants/site.ts`
- Create: `apps/web/components/layout/site-footer.tsx`
- Create: `apps/web/components/home/trending-showcase.tsx`
- Create: `apps/web/components/home/category-strip.tsx`
- Create: `apps/web/components/home/hero-actions.tsx`
- Create: `apps/web/app/privacy/page.tsx`
- Create: `apps/web/app/terms/page.tsx`

- [ ] **Step 1: Replace the sparse homepage with a data-backed editorial composition**

```tsx
const data = await apiGet<HomePayload>("/recipes/home");

return (
  <main>
    <hero with search and two CTAs />
    <TrendingShowcase recipes={data.trending} />
    <CategoryStrip categories={data.categories} />
    <NewestGrid recipes={data.newest} />
    <SiteFooter />
  </main>
);
```

- [ ] **Step 2: Upgrade typography and surfaces**

```tsx
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });
```

```css
.display-title {
  font-family: var(--font-display), serif;
  letter-spacing: -0.04em;
  line-height: 0.94;
}
```

- [ ] **Step 3: Add protected hero CTA through auth dialog**

```tsx
<HeroActions authStatus={auth.status} />
```

```tsx
if (authStatus !== "authenticated") {
  setAuthDialogOpen(true);
  return;
}

router.push("/profile/recipes/new");
```

- [ ] **Step 4: Add footer links and simple legal pages**

```tsx
<footer>
  <Link href="/privacy">Privacy</Link>
  <Link href="/terms">Terms</Link>
</footer>
```

- [ ] **Step 5: Verify the web app compiles**

Run: `pnpm --filter @cookpedia/web typecheck`
Expected: PASS

Run: `pnpm --filter @cookpedia/web lint`
Expected: PASS

### Task 4: Tighten Browser Flows and Final Verification

**Files:**
- Modify: `tests/e2e/auth-and-profile.spec.ts`
- Modify: `tests/e2e/moderation-flow.spec.ts`
- Modify: `playwright.config.ts`

- [ ] **Step 1: Extend the auth/profile browser flow**

```ts
await page.goto("/");
await page.getByRole("button", { name: /login|register/i }).click();
await page.getByRole("link", { name: "Register" }).click();
```

- [ ] **Step 2: Make admin login assert redirect to moderation queue**

```ts
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/admin/recipes/pending");
```

- [ ] **Step 3: Run focused browser verification**

Run: `pnpm --filter @cookpedia/web test`
Expected: PASS

- [ ] **Step 4: Run full repo verification**

Run: `pnpm lint`
Expected: PASS

Run: `pnpm typecheck`
Expected: PASS

Run: `pnpm test`
Expected: PASS

## Self-Review Notes

Spec coverage:

- homepage editorial hierarchy is covered by Task 3
- auth-aware header and account menu behavior is covered by Task 2
- guest auth gate dialog is covered by Task 3
- admin redirect and hidden public admin nav are covered by Tasks 2 and 4
- dynamic trending/newest/categories are covered by Task 1
- practical footer is covered by Task 3

Placeholder scan:

- no `TODO`, `TBD`, or deferred implementation markers remain

Type consistency:

- canonical auth read is `/auth/me`
- homepage payload route is `/recipes/home`
- admin post-login destination is `/admin/recipes/pending`
