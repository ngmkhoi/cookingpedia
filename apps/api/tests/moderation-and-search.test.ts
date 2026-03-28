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
});
