import { expect, test } from "@playwright/test";

test("author submits a recipe and admin can approve it", async ({
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

  const registerResponse = await request.post(`${apiBase}/auth/register`, {
    ...writeOptions,
    data: {
      email: `lan-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Lan Tran",
      username: `lan-tran-${suffix}`
    }
  });
  expect(registerResponse.ok()).toBeTruthy();

  const createResponse = await request.post(`${apiBase}/recipes`, {
    ...writeOptions,
    data: {
      title: `Lemongrass Chicken ${suffix}`,
      shortDescription: "A bright, savory grilled chicken.",
      prepMinutes: 10,
      cookMinutes: 20,
      servings: 2,
      coverImageUrl: "https://example.com/lemongrass-chicken.jpg",
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      locale: "vi",
      images: [
        {
          imageUrl: "https://example.com/lemongrass-chicken.jpg",
          sortOrder: 1
        }
      ],
      ingredients: [
        { name: "Chicken thigh", quantity: 1, unit: "g", sortOrder: 1 }
      ],
      steps: [
        {
          stepNumber: 1,
          instruction: "Marinate, roast, and rest the chicken."
        }
      ]
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

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill("admin@cookpedia.local");
  await page.getByPlaceholder("Password").fill("AdminPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin/recipes/pending", { timeout: 10000 });
  await expect(page.getByText(`Lemongrass Chicken ${suffix}`)).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: /cookpedia admin|profile/i }).click();
  await expect(
    page.getByRole("menu").getByRole("link", { name: "Moderation queue" })
  ).toBeVisible();
});
