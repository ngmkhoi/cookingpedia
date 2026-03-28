import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("profile and uploads", () => {
  it("updates the signed-in profile and exposes the public author page", async () => {
    const agent = request.agent(app);
    const suffix = Date.now().toString(36);
    const username = `ly-tran-${suffix}`;

    await agent.post("/api/auth/register").send({
      email: `ly-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Ly Tran",
      username
    });

    const updateResponse = await agent.patch("/api/users/me").send({
      displayName: "Ly Tran Studio",
      bio: "Vietnamese home cook"
    });

    expect(updateResponse.status).toBe(200);

    const publicResponse = await request(app).get(`/api/users/authors/${username}`);
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.author.username).toBe(username);
  });

  it("rejects non-image uploads", async () => {
    const agent = request.agent(app);
    const suffix = (Date.now() + 1).toString(36);

    await agent.post("/api/auth/register").send({
      email: `tam-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Tam Ngo",
      username: `tam-ngo-${suffix}`
    });

    const uploadResponse = await agent
      .post("/api/uploads/recipe-images")
      .attach("file", Buffer.from("not-an-image"), "notes.txt");

    expect(uploadResponse.status).toBe(400);
  });
});
