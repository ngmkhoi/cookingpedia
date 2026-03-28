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
  const trendingHeading = page.locator("#trending").getByText("Trending now");
  const categoryHeading = page.getByText("Browse by category").first();

  await trendingHeading.scrollIntoViewIfNeeded();
  await expect(trendingHeading).toBeVisible();
  await categoryHeading.scrollIntoViewIfNeeded();
  await expect(categoryHeading).toBeVisible();
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Privacy" })).toBeVisible();
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Terms" })).toBeVisible();
  await page.getByRole("button", { name: "Share a recipe" }).click();
  await expect(page.getByText("Sign in to continue")).toBeVisible();
});
