import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

describe("moderation and public search", () => {
  it("keeps pending recipes private until an admin approves them", async () => {
    const author = request.agent(app);
    const admin = request.agent(app);
    const suffix = Date.now().toString(36);
    const adminEmail = `admin-${suffix}@cookpedia.test`;
    const searchToken = `egg-${suffix}`;

    await author.post("/api/auth/register").send({
      email: `dao-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Dao Vu",
      username: `dao-vu-${suffix}`
    });

    await admin.post("/api/auth/register").send({
      email: adminEmail,
      password: "SecretPass123!",
      displayName: "Cookpedia Admin",
      username: `cookpedia-admin-${suffix}`
    });

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" }
    });

    const recipeResponse = await author.post("/api/recipes").send({
      title: `Egg Coffee ${suffix}`,
      shortDescription: "Sweet robusta coffee with whipped egg cream",
      prepMinutes: 10,
      cookMinutes: 5,
      servings: 2,
      coverImageUrl: "https://example.com/egg-coffee.jpg",
      category: "Drinks",
      cuisine: "Vietnamese",
      difficulty: "EASY",
      images: [{ imageUrl: "https://example.com/egg-coffee.jpg", sortOrder: 1 }],
      ingredients: [
        { name: searchToken, quantity: 2, unit: "pcs", sortOrder: 1 },
        { name: "Coffee", quantity: 120, unit: "ml", sortOrder: 2 }
      ],
      steps: [{ stepNumber: 1, instruction: "Whip the egg yolks." }]
    });

    await author.post(`/api/recipes/${recipeResponse.body.recipe.id}/submit`).send();

    const searchBeforeApprove = await request(app).get(
      `/api/recipes/search?q=${searchToken}`
    );
    expect(searchBeforeApprove.body.recipes).toHaveLength(0);

    const approveResponse = await admin
      .post(`/api/admin/recipes/${recipeResponse.body.recipe.id}/approve`)
      .send();

    expect(approveResponse.status).toBe(200);

    const searchAfterApprove = await request(app).get(
      `/api/recipes/search?q=${searchToken}`
    );
    expect(searchAfterApprove.status).toBe(200);
    expect(searchAfterApprove.body.recipes).toHaveLength(1);
  });

  it("supports discovery browse state and filter presets for published recipes", async () => {
    const author = request.agent(app);
    const suffix = Date.now().toString(36);
    const category = `Category-${suffix}`;
    const otherCategory = `Other-${suffix}`;
    const cuisine = `Cuisine-${suffix}`;

    await author.post("/api/auth/register").send({
      email: `browse-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Browse Author",
      username: `browse-author-${suffix}`
    });

    const olderRecipeResponse = await author.post("/api/recipes").send({
      title: `Older Recipe ${suffix}`,
      shortDescription: "A published recipe used for browse coverage.",
      prepMinutes: 12,
      cookMinutes: 18,
      servings: 2,
      coverImageUrl: "https://example.com/older.jpg",
      category,
      cuisine,
      difficulty: "EASY",
      locale: "vi",
      images: [{ imageUrl: "https://example.com/older.jpg", sortOrder: 1 }],
      ingredients: [{ name: `rice-${suffix}`, quantity: 1, unit: "cup", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Steam and serve." }]
    });

    const newestRecipeResponse = await author.post("/api/recipes").send({
      title: `Newest Recipe ${suffix}`,
      shortDescription: "The newest published recipe for sort coverage.",
      prepMinutes: 15,
      cookMinutes: 20,
      servings: 3,
      coverImageUrl: "https://example.com/newest.jpg",
      category,
      cuisine,
      difficulty: "MEDIUM",
      locale: "vi",
      images: [{ imageUrl: "https://example.com/newest.jpg", sortOrder: 1 }],
      ingredients: [{ name: `egg-${suffix}`, quantity: 3, unit: "pcs", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Whisk and finish gently." }]
    });

    const otherRecipeResponse = await author.post("/api/recipes").send({
      title: `Other Recipe ${suffix}`,
      shortDescription: "A published recipe in another category for filter coverage.",
      prepMinutes: 8,
      cookMinutes: 35,
      servings: 4,
      coverImageUrl: "https://example.com/other.jpg",
      category: otherCategory,
      cuisine: `OtherCuisine-${suffix}`,
      difficulty: "HARD",
      locale: "en",
      images: [{ imageUrl: "https://example.com/other.jpg", sortOrder: 1 }],
      ingredients: [{ name: `pepper-${suffix}`, quantity: 2, unit: "tbsp", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Reduce and glaze." }]
    });

    await prisma.recipe.update({
      where: { id: olderRecipeResponse.body.recipe.id },
      data: {
        status: "PUBLISHED",
        bookmarkCount: 4,
        createdAt: new Date("2026-01-01T00:00:00.000Z")
      }
    });

    await prisma.recipe.update({
      where: { id: newestRecipeResponse.body.recipe.id },
      data: {
        status: "PUBLISHED",
        bookmarkCount: 9,
        createdAt: new Date("2026-02-01T00:00:00.000Z")
      }
    });

    await prisma.recipe.update({
      where: { id: otherRecipeResponse.body.recipe.id },
      data: {
        status: "PUBLISHED",
        bookmarkCount: 1,
        createdAt: new Date("2026-01-15T00:00:00.000Z")
      }
    });

    const browseResponse = await request(app).get("/api/recipes/search");

    expect(browseResponse.status).toBe(200);
    expect(
      browseResponse.body.recipes.some(
        (recipe: { id: string }) => recipe.id === olderRecipeResponse.body.recipe.id
      )
    ).toBe(true);
    expect(
      browseResponse.body.recipes.some(
        (recipe: { id: string }) => recipe.id === newestRecipeResponse.body.recipe.id
      )
    ).toBe(true);

    const newestResponse = await request(app).get(
      `/api/recipes/search?sort=newest&category=${encodeURIComponent(category)}`
    );

    expect(newestResponse.status).toBe(200);
    expect(newestResponse.body.recipes[0].id).toBe(newestRecipeResponse.body.recipe.id);

    const categoryResponse = await request(app).get(
      `/api/recipes/search?category=${encodeURIComponent(category)}`
    );

    expect(categoryResponse.status).toBe(200);
    expect(categoryResponse.body.recipes.length).toBeGreaterThan(0);
    expect(
      categoryResponse.body.recipes.every(
        (recipe: { category: string }) => recipe.category === category
      )
    ).toBe(true);

    const cuisineResponse = await request(app).get(
      `/api/recipes/search?cuisine=${encodeURIComponent(cuisine)}`
    );

    expect(cuisineResponse.status).toBe(200);
    expect(
      cuisineResponse.body.recipes.every(
        (recipe: { cuisine: string }) => recipe.cuisine === cuisine
      )
    ).toBe(true);

    const difficultyResponse = await request(app).get(
      "/api/recipes/search?difficulty=MEDIUM"
    );

    expect(difficultyResponse.status).toBe(200);
    expect(
      difficultyResponse.body.recipes.some(
        (recipe: { id: string }) => recipe.id === newestRecipeResponse.body.recipe.id
      )
    ).toBe(true);
    expect(
      difficultyResponse.body.recipes.some(
        (recipe: { id: string }) => recipe.id === olderRecipeResponse.body.recipe.id
      )
    ).toBe(false);

    const cookTimeResponse = await request(app).get(
      "/api/recipes/search?maxCookMinutes=20"
    );

    expect(cookTimeResponse.status).toBe(200);
    expect(
      cookTimeResponse.body.recipes.some(
        (recipe: { id: string }) => recipe.id === newestRecipeResponse.body.recipe.id
      )
    ).toBe(true);
    expect(
      cookTimeResponse.body.recipes.some(
        (recipe: { id: string }) => recipe.id === otherRecipeResponse.body.recipe.id
      )
    ).toBe(false);
  });
});
