import { expect, test } from "@playwright/test";

async function registerUser(page: Parameters<typeof test>[0]["page"], suffix: string) {
  await page.goto("/register");
  await page.getByPlaceholder("Display name").fill("Bao Huynh");
  await page.getByPlaceholder("Username").fill(`bao-huynh-${suffix}`);
  await page.getByPlaceholder("Email").fill(`bao-${suffix}@cookpedia.test`);
  await page.getByPlaceholder("Password").fill("SecretPass123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/my-recipes");
}

test("register form shows inline validation and debounced availability states", async ({
  page
}) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const availabilityRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/auth/availability")) {
      availabilityRequests.push(url);
    }
  });

  await registerUser(page, suffix);

  await page.goto("/register");
  availabilityRequests.length = 0;
  await page.getByPlaceholder("Display name").click();
  await page.getByPlaceholder("Password").click();

  await expect(page.getByText("Display name is required")).toBeVisible();

  await page.getByPlaceholder("Email").fill("bad-email");
  await page.getByPlaceholder("Username").click();
  await expect(page.getByText("Enter a valid email address")).toBeVisible();

  await page.getByPlaceholder("Password").fill("123");
  await page.getByPlaceholder("Display name").click();
  await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();

  await page.getByPlaceholder("Username").fill(`bao-huynh-${suffix}`);
  await page.getByPlaceholder("Email").fill(`bao-${suffix}@cookpedia.test`);

  await expect.poll(() => availabilityRequests.length).toBeGreaterThan(0);
  await expect(page.getByText("This username is already taken")).toBeVisible();
  await expect(page.getByText("This email is already in use")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeDisabled();

  await page.waitForTimeout(1000);

  const duplicateUsernameRequests = availabilityRequests.filter((url) =>
    url.includes(`username=${encodeURIComponent(`bao-huynh-${suffix}`)}`)
  );
  const duplicateEmailRequests = availabilityRequests.filter((url) =>
    url.includes(`email=${encodeURIComponent(`bao-${suffix}@cookpedia.test`)}`)
  );

  expect(duplicateUsernameRequests.length).toBeLessThanOrEqual(2);
  expect(duplicateEmailRequests.length).toBeLessThanOrEqual(2);
});

test("login keeps server auth failures generic", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await registerUser(page, suffix);

  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(`bao-${suffix}@cookpedia.test`);
  await page.getByPlaceholder("Password").fill("WrongPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByText("Email or password is incorrect")).toBeVisible();
  await expect(page.getByText("This email is already in use")).toHaveCount(0);
});

test("recipe studio shows inline field errors before submit", async ({ page }) => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await registerUser(page, suffix);

  await page.goto("/my-recipes/new");
  await page.getByPlaceholder("Recipe title").fill("Hi");
  await page.getByPlaceholder("Short description").fill("short");
  await page.getByPlaceholder("Cover image URL").fill("bad-url");
  await page.getByPlaceholder("Ingredient").click();
  await page.getByPlaceholder("Qty").click();
  await page.getByPlaceholder("Step 1").fill("bad");
  await page.getByPlaceholder("Recipe title").click();

  await expect(page.getByText("Recipe title must be at least 3 characters")).toBeVisible();
  await expect(page.getByText("Short description must be at least 10 characters")).toBeVisible();
  await expect(page.getByText("Enter a valid image URL")).toBeVisible();
  await expect(page.getByText("Ingredient name is required")).toBeVisible();
  await expect(page.getByText("Step instruction must be at least 5 characters")).toBeVisible();
  await expect(page.getByRole("button", { name: "Save draft" })).toBeDisabled();
});
