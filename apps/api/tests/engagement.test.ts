import request from "supertest";
import { describe, expect, it } from "vitest";
import { prisma } from "../src/lib/prisma";
import { app } from "../src/app";

describe("ratings and bookmarks", () => {
  it("lets another user rate and bookmark a published recipe", async () => {
    const author = request.agent(app);
    const reader = request.agent(app);
    const suffix = Date.now().toString(36);

    await author.post("/api/auth/register").send({
      email: `thu-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Thu Le",
      username: `thu-le-${suffix}`
    });

    await reader.post("/api/auth/register").send({
      email: `reader-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Khanh Bui",
      username: `khanh-bui-${suffix}`
    });

    const create = await author.post("/api/recipes").send({
      title: "Tomato Egg Stir Fry",
      shortDescription: "Soft eggs in a quick tomato sauce",
      prepMinutes: 10,
      cookMinutes: 12,
      servings: 2,
      coverImageUrl: "https://example.com/tomato-egg.jpg",
      category: "Lunch",
      cuisine: "Chinese",
      difficulty: "EASY",
      images: [{ imageUrl: "https://example.com/tomato-egg.jpg", sortOrder: 1 }],
      ingredients: [
        { name: "Egg", quantity: 3, unit: "pcs", sortOrder: 1 },
        { name: "Tomato", quantity: 2, unit: "pcs", sortOrder: 2 }
      ],
      steps: [{ stepNumber: 1, instruction: "Scramble the eggs gently." }]
    });

    expect(create.status).toBe(201);

    await prisma.recipe.update({
      where: { id: create.body.recipe.id },
      data: { status: "PUBLISHED" }
    });

    const rate = await reader.post(`/api/ratings/${create.body.recipe.id}`).send({
      score: 5,
      comment: "Fast, balanced, and weeknight-friendly."
    });

    expect(rate.status).toBe(200);
    expect(rate.body.rating.score).toBe(5);
    expect(rate.body.summary.ratingCount).toBe(1);
    expect(rate.body.summary.ratingAverage).toBe(5);

    const currentRating = await reader.get(`/api/ratings/${create.body.recipe.id}/me`);
    expect(currentRating.status).toBe(200);
    expect(currentRating.body.rating.score).toBe(5);

    const bookmark = await reader.post(`/api/bookmarks/${create.body.recipe.id}`).send();
    expect(bookmark.status).toBe(200);

    const selfRate = await author.post(`/api/ratings/${create.body.recipe.id}`).send({
      score: 5,
      comment: "I made this."
    });

    expect(selfRate.status).toBe(400);
  });
});
