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

test("authenticated user can save from discovery and rate on the recipe detail page", async ({
  page,
  request
}) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const apiBase = "http://localhost:4000/api";
  const writeOptions = {
    headers: {
      Origin: "http://localhost:3000"
    }
  };

  const authorRegisterResponse = await request.post(`${apiBase}/auth/register`, {
    ...writeOptions,
    data: {
      email: `engage-author-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Engagement Author",
      username: `engage-author-${suffix}`
    }
  });
  expect(authorRegisterResponse.ok()).toBeTruthy();

  const createResponse = await request.post(`${apiBase}/recipes`, {
    ...writeOptions,
    data: {
      title: `Ginger Beef Noodles ${suffix}`,
      shortDescription: "Rich beef noodles with quick ginger heat and herbs.",
      prepMinutes: 20,
      cookMinutes: 25,
      servings: 3,
      coverImageUrl: "https://example.com/ginger-beef-noodles.jpg",
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      locale: "vi",
      images: [
        {
          imageUrl: "https://example.com/ginger-beef-noodles.jpg",
          sortOrder: 1
        }
      ],
      ingredients: [{ name: "Beef", quantity: 500, unit: "g", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Cook the noodles and finish with ginger." }]
    }
  });
  expect(createResponse.ok()).toBeTruthy();
  const createData = await createResponse.json();

  const submitResponse = await request.post(
    `${apiBase}/recipes/${createData.recipe.id}/submit`,
    {
      ...writeOptions,
      data: {}
    }
  );
  expect(submitResponse.ok()).toBeTruthy();

  const adminLoginResponse = await request.post(`${apiBase}/auth/login`, {
    ...writeOptions,
    data: {
      email: "admin@cookpedia.com",
      password: "CookpediaAdmin2026!"
    }
  });
  expect(adminLoginResponse.ok()).toBeTruthy();

  const approveResponse = await request.post(
    `${apiBase}/admin/recipes/${createData.recipe.id}/approve`,
    {
      ...writeOptions,
      data: {}
    }
  );
  expect(approveResponse.ok()).toBeTruthy();

  await page.goto("/register");
  await page.getByPlaceholder("Display name").fill("Engagement Reader");
  await page.getByPlaceholder("Username").fill(`engagement-reader-${suffix}`);
  await page.getByPlaceholder("Email").fill(`engagement-reader-${suffix}@cookpedia.test`);
  await page.getByPlaceholder("Password").fill("SecretPass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/my-recipes");

  await page.goto(`/search?q=${encodeURIComponent(`Ginger Beef Noodles ${suffix}`)}`);
  await expect(
    page.getByRole("link", { name: `Ginger Beef Noodles ${suffix}` })
  ).toBeVisible();

  await page.getByRole("button", { name: "Save recipe" }).click();
  await expect(page.getByRole("button", { name: "Unsave recipe" })).toBeVisible();

  await page.getByRole("link", { name: /Ginger Beef Noodles/ }).click();
  await expect(page).toHaveURL(/\/recipes\//);
  await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

  await page.getByRole("radio", { name: "Rate 5 out of 5" }).click();
  await expect(page.getByText("5.0 / 5")).toBeVisible();
  await expect(page.getByText("1 ratings")).toBeVisible();
});
