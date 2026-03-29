# Mobile Header Hamburger Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current mobile account-led header trigger with a hamburger icon that opens a unified dropdown containing navigation and account actions, while leaving desktop and tablet behavior unchanged.

**Architecture:** Keep one `SiteHeader` component. Below the mobile breakpoint, hide inline nav links and swap the trigger to a hamburger icon button. Reuse the existing dropdown container and menu content model, but insert `Search` and `Trending` into the menu for both anonymous and authenticated users.

**Tech Stack:** Next.js App Router, React client component state, Tailwind v3, Phosphor icons, Playwright

---

### Task 1: Update E2E expectations first

**Files:**
- Modify: `tests/e2e/homepage-nav.spec.ts`
- Modify: `tests/e2e/auth-and-profile.spec.ts`
- Reference: `apps/web/components/layout/site-header.tsx`

- [ ] **Step 1: Rewrite the anonymous mobile header test**

Replace the current account-led mobile expectation with a hamburger-driven expectation.

Use this exact shape:

```ts
test("mobile header collapses nav into a hamburger dropdown for anonymous users", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const header = page.locator("header");
  await expect(header.getByRole("link", { name: "Search" })).toHaveCount(0);
  await expect(header.getByRole("link", { name: "Trending" })).toHaveCount(0);

  const trigger = header.getByRole("button", { name: "Open navigation menu" });
  await expect(trigger).toBeVisible();
  await trigger.click();

  const menu = page.getByRole("menu");
  await expect(menu.getByRole("link", { name: "Search" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Trending" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Register" })).toBeVisible();
});
```

- [ ] **Step 2: Rewrite the authenticated mobile header check**

Update `tests/e2e/auth-and-profile.spec.ts` so the mobile state expects the same hamburger trigger, then verifies:

- `Search`
- `Trending`
- `Profile`

inside the menu after login.

Use:

```ts
const mobileTrigger = header.getByRole("button", { name: "Open navigation menu" });
await expect(mobileTrigger).toBeVisible();
await mobileTrigger.click();
const menu = page.getByRole("menu");
await expect(menu.getByRole("link", { name: "Search" })).toBeVisible();
await expect(menu.getByRole("link", { name: "Trending" })).toBeVisible();
await expect(menu.getByRole("link", { name: "Profile" })).toBeVisible();
```

- [ ] **Step 3: Run the web suite to verify RED**

Run: `pnpm --filter @cookpedia/web test`
Expected: FAIL because the current mobile trigger is still account-led and does not expose the hamburger semantics.

### Task 2: Implement mobile-only hamburger trigger

**Files:**
- Modify: `apps/web/components/layout/site-header.tsx`

- [ ] **Step 1: Import and use a hamburger icon**

Use an existing Phosphor icon such as `List` or `ListBullets` from `@phosphor-icons/react`.

Do not add any new icon package.

- [ ] **Step 2: Keep desktop and tablet unchanged**

Desktop/tablet must continue to render:

- inline `Search`
- inline `Trending`
- account trigger button on the right

Do not rewrite or restyle the desktop/tablet header behavior.

- [ ] **Step 3: Add a mobile-only hamburger trigger**

Render a separate mobile-only trigger button with:

```tsx
aria-label="Open navigation menu"
```

and hide the existing account-led trigger below `md`.

At `md` and above, keep the existing account trigger visible.

- [ ] **Step 4: Reuse the existing dropdown container**

Do not introduce:

- a drawer
- a sheet
- a separate mobile overlay system

Keep the same dropdown panel pattern already used by the header, opening from the right.

- [ ] **Step 5: Put shared nav items at the top of the menu**

In the dropdown menu, insert this mobile-only explore group first:

- `Search`
- `Trending`

Then add a separator before account actions.

These links must close the menu on click and use the existing `MAIN_NAV` destinations.

- [ ] **Step 6: Preserve account behavior by auth state**

Anonymous mobile menu:

- `Search`
- `Trending`
- separator
- `Login`
- `Register`

Authenticated mobile menu:

- `Search`
- `Trending`
- separator
- `Moderation queue` for admins only
- `Profile`
- `My Recipes`
- `Saved`
- `Settings`
- `Logout`

- [ ] **Step 7: Keep the dropdown width mobile-safe**

Set the dropdown width explicitly to the current mobile-safe clamp:

```tsx
className="panel absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-[240px] w-[min(280px,calc(100vw-2rem))] rounded-[1.5rem] p-2"
```

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
git add apps/web/components/layout/site-header.tsx tests/e2e/homepage-nav.spec.ts tests/e2e/auth-and-profile.spec.ts
git commit -m "fix(web): use hamburger dropdown on mobile header"
```
