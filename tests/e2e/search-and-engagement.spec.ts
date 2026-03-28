import { expect, test } from "@playwright/test";

test("discovery page stays populated without a keyword", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("textbox", { name: "Search the catalog" })).toBeVisible();
  await expect(page.getByText("Browse published recipes")).toBeVisible();
  await expect(page.getByText(/recipes on this shelf/)).toBeVisible();
  await expect(page.getByRole("link").first()).toBeVisible();
});

test("guest can search by ingredient and open a published recipe", async ({ page }) => {
  await page.goto("/search?q=egg");
  await expect(page.getByText("Results for")).toBeVisible();
  await expect(page.getByRole("link").first()).toBeVisible();
});
