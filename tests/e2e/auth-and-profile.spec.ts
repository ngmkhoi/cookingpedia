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
  const title = page.getByRole("heading", { name: "Your Cookpedia workspace" });
  const header = page.locator("header");
  const headerHomeLink = header.getByRole("link", { name: "Cookpedia" });

  await expect(title).toBeVisible();
  await expect(header).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(headerHomeLink).not.toHaveCSS("color", "rgb(255, 255, 255)");

  const headerBox = await header.boundingBox();
  const titleBox = await title.boundingBox();

  expect(headerBox).not.toBeNull();
  expect(titleBox).not.toBeNull();
  expect(titleBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height - 1);

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileTrigger = header.getByRole("button", { name: /bao huynh|profile/i });
  await expect(mobileTrigger).toBeVisible();
  await mobileTrigger.click();

  const menu = page.getByRole("menu");
  await expect(menu.getByRole("link", { name: "Search" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Trending" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Profile" })).toBeVisible();
});
