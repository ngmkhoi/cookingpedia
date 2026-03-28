import { expect, test } from "@playwright/test";

test("user can register and reach the private profile", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await page.goto("/register");
  await page.getByPlaceholder("Display name").fill("Bao Huynh");
  await page.getByPlaceholder("Username").fill(`bao-huynh-${suffix}`);
  await page.getByPlaceholder("Email").fill(`bao-${suffix}@cookpedia.test`);
  await page.getByPlaceholder("Password").fill("SecretPass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/profile");
  await expect(page.getByText("Your Cookpedia workspace")).toBeVisible();
});
