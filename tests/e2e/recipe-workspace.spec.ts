import { expect, test } from "@playwright/test";

test("author can manage draft and pending recipes from my recipes", async ({
  page
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const recipeTitle = `Weeknight Lemongrass Chicken ${suffix}`;

  await page.goto("/register");
  await page.getByPlaceholder("Display name").fill("Minh Pham");
  await page.getByPlaceholder("Username").fill(`minh-pham-${suffix}`);
  await page.getByPlaceholder("Email").fill(`minh-${suffix}@cookpedia.test`);
  await page.getByPlaceholder("Password").fill("SecretPass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/my-recipes");

  await page.goto("/my-recipes/new");

  await page.getByPlaceholder("Recipe title").fill(recipeTitle);
  await page
    .getByPlaceholder("Short description")
    .fill("Bright grilled chicken with herbs and a glossy pan finish.");
  await page.getByPlaceholder("Cover image URL").fill("https://example.com/lemongrass-chicken.jpg");
  await page.getByPlaceholder("Ingredient").fill("Chicken thigh");
  await page.getByPlaceholder("Step 1").fill("Grill until charred and lacquered.");
  await page.getByRole("button", { name: "Save draft" }).click();

  await expect(page).toHaveURL("/my-recipes");
  expect(
    consoleErrors.some((message) =>
      message.includes("hydrated but some attributes of the server rendered HTML didn't match")
    )
  ).toBe(false);
  await expect(page.getByText(recipeTitle)).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit for review" })).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/my-recipes\/.+\/edit/);
  expect(
    consoleErrors.some((message) =>
      message.includes("hydrated but some attributes of the server rendered HTML didn't match")
    )
  ).toBe(false);
  await page.goto("/my-recipes");

  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Pending")).toBeVisible();
  await expect(page.getByRole("button", { name: "Move back to draft" })).toBeVisible();

  await page.getByRole("button", { name: "Move back to draft" }).click();
  await expect(page.getByText("Draft", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();

  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(recipeTitle)).toHaveCount(0);
});

test("user can manage saved recipes from the saved lane", async ({
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
      email: `author-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Recipe Author",
      username: `recipe-author-${suffix}`
    }
  });
  expect(authorRegisterResponse.ok()).toBeTruthy();

  const createResponse = await request.post(`${apiBase}/recipes`, {
    ...writeOptions,
    data: {
      title: `Five Spice Duck ${suffix}`,
      shortDescription: "Slow roasted duck with warm spice and crisp skin.",
      prepMinutes: 20,
      cookMinutes: 60,
      servings: 4,
      coverImageUrl: "https://example.com/five-spice-duck.jpg",
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      locale: "vi",
      images: [
        {
          imageUrl: "https://example.com/five-spice-duck.jpg",
          sortOrder: 1
        }
      ],
      ingredients: [{ name: "Duck", quantity: 1, unit: "bird", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Roast until fragrant and crisp." }]
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
  await page.getByPlaceholder("Display name").fill("Saved User");
  await page.getByPlaceholder("Username").fill(`saved-user-${suffix}`);
  await page.getByPlaceholder("Email").fill(`saved-${suffix}@cookpedia.test`);
  await page.getByPlaceholder("Password").fill("SecretPass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/my-recipes");

  await page.evaluate(async (recipeId) => {
    await fetch(`http://localhost:4000/api/bookmarks/${recipeId}`, {
      method: "POST",
      credentials: "include"
    });
  }, createData.recipe.id);

  await page.goto("/saved");
  await expect(page.getByText(`Five Spice Duck ${suffix}`)).toBeVisible();

  await page.getByRole("button", { name: "Unsave" }).click();
  await expect(page.getByText(`Five Spice Duck ${suffix}`)).toHaveCount(0);
});
