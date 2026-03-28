import { expect, test } from "@playwright/test";

test("guest header exposes account entry and auth routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /login|register/i }).click();
  await expect(page.getByRole("menu").getByRole("link", { name: "Login" })).toBeVisible();
  await expect(
    page.getByRole("menu").getByRole("link", { name: "Register" })
  ).toBeVisible();
});

test("homepage surfaces discovery sections and guest auth gate", async ({
  page
}) => {
  await page.goto("/");
  const heroSection = page.locator("main > section").first();
  const trendingHeading = page.locator("#trending").getByText("Trending now");
  const categoryHeading = page.getByText("Browse by category").first();

  await expect(heroSection).not.toHaveCSS("background-image", /url\(/);
  await trendingHeading.scrollIntoViewIfNeeded();
  await expect(trendingHeading).toBeVisible();
  await categoryHeading.scrollIntoViewIfNeeded();
  await expect(categoryHeading).toBeVisible();
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Privacy" })).toBeVisible();
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Terms" })).toBeVisible();
  await page.getByRole("button", { name: "Share a recipe" }).click();
  await expect(page.getByText("Sign in to continue")).toBeVisible();
});

test("homepage discovery entry points deep-link into the unified search page", async ({
  page
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: "See all newest" }).click();
  await expect(page).toHaveURL(/\/search\?sort=newest/);
  await expect(page.getByText("Newest recipes")).toBeVisible();

  await page.goto("/");
  const categorySection = page.locator("section").filter({
    has: page.getByText("Browse by category").first()
  });
  const categoryLink = categorySection.getByRole("link").first();
  const href = await categoryLink.getAttribute("href");
  const category = href
    ? new URL(`http://localhost:3000${href}`).searchParams.get("category")
    : null;
  await categoryLink.scrollIntoViewIfNeeded();
  await categoryLink.click();
  expect(category).toBeTruthy();
  await expect(page).toHaveURL(new RegExp(`/search\\?category=${category}(&|$)`));
  await expect(page.getByText(`${category} recipes`)).toBeVisible();
});
