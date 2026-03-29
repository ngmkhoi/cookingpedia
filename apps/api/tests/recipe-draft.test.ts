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

  it("round-trips editable recipes with images back through patch", async () => {
    const agent = request.agent(app);
    const suffix = Date.now().toString(36);

    await agent.post("/api/auth/register").send({
      email: `roundtrip-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Round Trip User",
      username: `roundtrip-${suffix}`
    });

    const createResponse = await agent.post("/api/recipes").send({
      title: "Round Trip Fish Sauce Wings",
      shortDescription: "Sticky wings with a glossy fish sauce caramel glaze",
      prepMinutes: 15,
      cookMinutes: 30,
      servings: 4,
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      coverImageUrl: "https://example.com/wings.jpg",
      images: [{ imageUrl: "https://example.com/wings.jpg", sortOrder: 1 }],
      ingredients: [{ name: "Chicken wings", quantity: 800, unit: "g", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Roast until the skin turns deeply golden." }]
    });

    expect(createResponse.status).toBe(201);

    const editableResponse = await agent.get(
      `/api/recipes/${createResponse.body.recipe.id}/edit`
    );

    expect(editableResponse.status).toBe(200);

    const updateResponse = await agent
      .patch(`/api/recipes/${createResponse.body.recipe.id}`)
      .send({
        ...editableResponse.body.recipe,
        title: "Round Trip Fish Sauce Wings Updated"
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.recipe.title).toBe(
      "Round Trip Fish Sauce Wings Updated"
    );
  });

  it("deletes draft and rejected recipes but not pending recipes", async () => {
    const agent = request.agent(app);
    const suffix = `draft-${Date.now().toString(36)}`;

    await agent.post("/api/auth/register").send({
      email: `${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Recipe Owner",
      username: suffix
    });

    const createDraftResponse = await agent.post("/api/recipes").send({
      title: "Braised Tofu Bowl",
      shortDescription: "Savory tofu bowl with ginger and soy",
      prepMinutes: 10,
      cookMinutes: 18,
      servings: 2,
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "EASY",
      coverImageUrl: "https://example.com/tofu-bowl.jpg",
      images: [{ imageUrl: "https://example.com/tofu-bowl.jpg", sortOrder: 1 }],
      ingredients: [{ name: "Tofu", quantity: 300, unit: "g", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Braised tofu until glossy." }]
    });

    expect(createDraftResponse.status).toBe(201);

    const deleteDraftResponse = await agent.delete(
      `/api/recipes/${createDraftResponse.body.recipe.id}`
    );
    expect(deleteDraftResponse.status).toBe(200);

    const deletedEditResponse = await agent.get(
      `/api/recipes/${createDraftResponse.body.recipe.id}/edit`
    );
    expect(deletedEditResponse.status).toBe(404);

    const createPendingResponse = await agent.post("/api/recipes").send({
      title: "Sticky Chicken Rice",
      shortDescription: "Glossy chicken with quick cucumber rice",
      prepMinutes: 12,
      cookMinutes: 22,
      servings: 3,
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      coverImageUrl: "https://example.com/sticky-chicken.jpg",
      images: [{ imageUrl: "https://example.com/sticky-chicken.jpg", sortOrder: 1 }],
      ingredients: [{ name: "Chicken thigh", quantity: 500, unit: "g", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Cook until sticky and caramelized." }]
    });

    expect(createPendingResponse.status).toBe(201);

    const submitPendingResponse = await agent
      .post(`/api/recipes/${createPendingResponse.body.recipe.id}/submit`)
      .send();
    expect(submitPendingResponse.status).toBe(200);

    const deletePendingResponse = await agent.delete(
      `/api/recipes/${createPendingResponse.body.recipe.id}`
    );
    expect(deletePendingResponse.status).toBe(404);
  });

  it("moves a pending recipe back to draft so it can be edited again", async () => {
    const agent = request.agent(app);
    const suffix = `pending-${Date.now().toString(36)}`;

    await agent.post("/api/auth/register").send({
      email: `${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Pending Owner",
      username: suffix
    });

    const createResponse = await agent.post("/api/recipes").send({
      title: "Coconut Chicken Curry",
      shortDescription: "Fragrant chicken curry with coconut and herbs",
      prepMinutes: 14,
      cookMinutes: 28,
      servings: 4,
      category: "Dinner",
      cuisine: "Vietnamese",
      difficulty: "MEDIUM",
      coverImageUrl: "https://example.com/curry.jpg",
      images: [{ imageUrl: "https://example.com/curry.jpg", sortOrder: 1 }],
      ingredients: [{ name: "Chicken thigh", quantity: 600, unit: "g", sortOrder: 1 }],
      steps: [{ stepNumber: 1, instruction: "Simmer gently until rich and fragrant." }]
    });

    expect(createResponse.status).toBe(201);

    const submitResponse = await agent
      .post(`/api/recipes/${createResponse.body.recipe.id}/submit`)
      .send();
    expect(submitResponse.status).toBe(200);

    const moveBackResponse = await agent
      .post(`/api/recipes/${createResponse.body.recipe.id}/move-to-draft`)
      .send();
    expect(moveBackResponse.status).toBe(200);
    expect(moveBackResponse.body.recipe.status).toBe("DRAFT");

    const updateResponse = await agent
      .patch(`/api/recipes/${createResponse.body.recipe.id}`)
      .send({
        title: "Weeknight Coconut Chicken Curry",
        shortDescription: "Fragrant chicken curry with coconut and herbs",
        prepMinutes: 14,
        cookMinutes: 28,
        servings: 4,
        category: "Dinner",
        cuisine: "Vietnamese",
        difficulty: "MEDIUM",
        locale: "vi",
        coverImageUrl: "https://example.com/curry.jpg",
        images: [{ imageUrl: "https://example.com/curry.jpg", sortOrder: 1 }],
        ingredients: [{ name: "Chicken thigh", quantity: 600, unit: "g", sortOrder: 1 }],
        steps: [{ stepNumber: 1, instruction: "Simmer gently until rich and fragrant." }]
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.recipe.title).toBe("Weeknight Coconut Chicken Curry");
  });
});
