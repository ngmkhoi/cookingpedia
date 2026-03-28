import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("recipe drafts", () => {
  it("creates, updates, and blocks submit without a cover image", async () => {
    const agent = request.agent(app);
    const suffix = Date.now().toString(36);

    await agent.post("/api/auth/register").send({
      email: `linh-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Linh Vo",
      username: `linh-vo-${suffix}`
    });

    const createResponse = await agent.post("/api/recipes").send({
      title: "Caramel Fish Clay Pot",
      shortDescription: "Savory fish with caramel sauce",
      prepMinutes: 20,
      cookMinutes: 35,
      servings: 4,
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      images: [],
      ingredients: [{ name: "Catfish", quantity: 700, unit: "g", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Marinate the fish." }]
    });

    expect(createResponse.status).toBe(201);

    const updateResponse = await agent
      .patch(`/api/recipes/${createResponse.body.recipe.id}`)
      .send({
        ...createResponse.body.recipe,
        title: "Clay Pot Caramel Fish"
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.recipe.title).toBe("Clay Pot Caramel Fish");

    const submitResponse = await agent
      .post(`/api/recipes/${createResponse.body.recipe.id}/submit`)
      .send();
    expect(submitResponse.status).toBe(400);
  });
});
