import { expect, test } from "@playwright/test";

test("guest can search by ingredient and open a published recipe", async ({ page }) => {
  await page.goto("/search?q=egg");
  await expect(page.getByText("Results for")).toBeVisible();
  await expect(page.getByRole("link").first()).toBeVisible();
});
