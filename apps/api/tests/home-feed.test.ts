import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

describe("homepage feed", () => {
  it("returns trending, newest, and featured categories from published recipes only", async () => {
    const author = request.agent(app);
    const suffix = Date.now().toString(36);
    const dinnerCategory = `Dinner-${suffix}`;
    const lunchCategory = `Lunch-${suffix}`;
    const dessertCategory = `Dessert-${suffix}`;

    await author.post("/api/auth/register").send({
      email: `home-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Home Author",
      username: `home-author-${suffix}`
    });

    const trendingRecipe = await author.post("/api/recipes").send({
      title: `Trending Recipe ${suffix}`,
      shortDescription: "Bold and savory bowl for a busy evening.",
      prepMinutes: 10,
      cookMinutes: 20,
      servings: 2,
      coverImageUrl: "https://example.com/trending.jpg",
      category: dinnerCategory,
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      locale: "vi",
      images: [{ imageUrl: "https://example.com/trending.jpg", sortOrder: 1 }],
      ingredients: [{ name: `fish-${suffix}`, quantity: 1, unit: "kg", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Cook slowly and finish glossy." }]
    });

    const newestRecipe = await author.post("/api/recipes").send({
      title: `Newest Recipe ${suffix}`,
      shortDescription: "Fresh and bright plate for a late lunch service.",
      prepMinutes: 8,
      cookMinutes: 12,
      servings: 2,
      coverImageUrl: "https://example.com/newest.jpg",
      category: lunchCategory,
      cuisine: "Vietnamese",
      difficulty: "EASY",
      locale: "vi",
      images: [{ imageUrl: "https://example.com/newest.jpg", sortOrder: 1 }],
      ingredients: [{ name: `herb-${suffix}`, quantity: 1, unit: "bunch", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Assemble and serve immediately." }]
    });

    const categoryLeadRecipe = await author.post("/api/recipes").send({
      title: `Category Lead ${suffix}`,
      shortDescription: "A second dinner recipe to strengthen category ranking.",
      prepMinutes: 15,
      cookMinutes: 18,
      servings: 3,
      coverImageUrl: "https://example.com/category.jpg",
      category: dinnerCategory,
      cuisine: "Vietnamese",
      difficulty: "EASY",
      locale: "vi",
      images: [{ imageUrl: "https://example.com/category.jpg", sortOrder: 1 }],
      ingredients: [{ name: `sauce-${suffix}`, quantity: 1, unit: "cup", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Reduce gently until glossy." }]
    });

    const draftRecipe = await author.post("/api/recipes").send({
      title: `Draft Recipe ${suffix}`,
      shortDescription: "This draft should never appear on the homepage payload.",
      prepMinutes: 5,
      cookMinutes: 9,
      servings: 1,
      coverImageUrl: "https://example.com/draft.jpg",
      category: dessertCategory,
      cuisine: "Vietnamese",
      difficulty: "EASY",
      locale: "vi",
      images: [{ imageUrl: "https://example.com/draft.jpg", sortOrder: 1 }],
      ingredients: [{ name: `draft-${suffix}`, quantity: 1, unit: "pc", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Leave this unpublished." }]
    });

    await prisma.recipe.update({
      where: { id: trendingRecipe.body.recipe.id },
      // Use an outsized score so this ranking assertion stays stable
      // even when the local development database already has published recipes.
      data: { status: "PUBLISHED", bookmarkCount: 1000000, ratingAverage: 5 }
    });

    await prisma.recipe.update({
      where: { id: newestRecipe.body.recipe.id },
      data: { status: "PUBLISHED", bookmarkCount: 2, ratingAverage: 4.5 }
    });

    await prisma.recipe.update({
      where: { id: categoryLeadRecipe.body.recipe.id },
      data: { status: "PUBLISHED", bookmarkCount: 1, ratingAverage: 4.1 }
    });

    const response = await request(app).get("/api/recipes/home");

    expect(response.status).toBe(200);
    expect(response.body.trending[0].id).toBe(trendingRecipe.body.recipe.id);
    expect(
      response.body.newest.map((recipe: { id: string }) => recipe.id)
    ).toContain(categoryLeadRecipe.body.recipe.id);
    expect(response.body.categories.length).toBeLessThanOrEqual(6);
    expect(response.body.categories[0]).toEqual({
      name: expect.any(String),
      recipeCount: expect.any(Number)
    });
    expect(
      response.body.categories.every(
        (category: { recipeCount: number }, index: number, list: Array<{ recipeCount: number }>) =>
          index === 0 || list[index - 1].recipeCount >= category.recipeCount
      )
    ).toBe(true);
    expect(
      response.body.trending.some(
        (recipe: { id: string }) => recipe.id === draftRecipe.body.recipe.id
      )
    ).toBe(false);
  });
});
