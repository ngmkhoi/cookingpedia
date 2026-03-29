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
  await page.goto("/profile");
  const mobileTrigger = header.getByRole("button", { name: "Open navigation menu" });
  await expect(mobileTrigger).toBeVisible();
  await mobileTrigger.click();

  const menu = page.getByRole("menu");
  await expect(menu.getByRole("link", { name: "Search" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Trending" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Profile" })).toBeVisible();
});

test("user can save a recipe draft without providing a cover image URL", async ({
  page
}) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const recipeTitle = `Clay Pot Fish ${suffix}`;

  await page.goto("/register");
  await page.getByPlaceholder("Display name").fill("Bao Huynh");
  await page.getByPlaceholder("Username").fill(`bao-huynh-${suffix}`);
  await page.getByPlaceholder("Email").fill(`bao-${suffix}@cookpedia.test`);
  await page.getByPlaceholder("Password").fill("SecretPass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/profile");

  await page.goto("/profile/recipes/new");
  await page.getByPlaceholder("Recipe title").fill(recipeTitle);
  await page
    .getByPlaceholder("Short description")
    .fill("Savory clay pot fish for a quick family dinner.");
  await page.getByPlaceholder("Ingredient").fill("Fish");
  await page.getByPlaceholder("Step 1").fill("Cook gently until glossy.");

  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page).toHaveURL("/profile");
  await expect(page.getByText(recipeTitle)).toBeVisible();
});
