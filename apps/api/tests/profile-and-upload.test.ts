import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app";
import { uploadsService } from "../src/modules/uploads/uploads.service";

afterEach(() => {
  vi.restoreAllMocks();
});

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

  it("returns a field-aware conflict when updating to a taken username", async () => {
    const takenAgent = request.agent(app);
    const editingAgent = request.agent(app);
    const suffix = (Date.now() + 10).toString(36);
    const takenUsername = `taken-profile-${suffix}`;

    await takenAgent.post("/api/auth/register").send({
      email: `taken-profile-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Taken Profile",
      username: takenUsername
    });

    await editingAgent.post("/api/auth/register").send({
      email: `editing-profile-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Editing Profile",
      username: `editing-profile-${suffix}`
    });

    const updateResponse = await editingAgent.patch("/api/users/me").send({
      username: takenUsername
    });

    expect(updateResponse.status).toBe(409);
    expect(updateResponse.body.message).toBe("FIELD_CONFLICT");
    expect(updateResponse.body.fieldErrors).toEqual({
      username: "This username is already taken"
    });
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

  it("uploads a valid image and returns imageUrl", async () => {
    const agent = request.agent(app);
    const suffix = (Date.now() + 2).toString(36);
    const imageUrl = `https://storage.googleapis.com/cookpedia-test/recipe-images/${suffix}.png`;

    vi.spyOn(uploadsService, "saveRecipeImage").mockResolvedValue(imageUrl);

    await agent.post("/api/auth/register").send({
      email: `upload-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Upload User",
      username: `upload-user-${suffix}`
    });

    const uploadResponse = await agent
      .post("/api/uploads/recipe-images")
      .attach("file", Buffer.from("fake-png-data"), {
        filename: "cover.png",
        contentType: "image/png"
      });

    expect(uploadResponse.status).toBe(201);
    expect(uploadResponse.body.imageUrl).toBe(imageUrl);
    expect(uploadsService.saveRecipeImage).toHaveBeenCalledTimes(1);
  });

  it("returns a stable error when storage upload fails", async () => {
    const agent = request.agent(app);
    const suffix = (Date.now() + 3).toString(36);

    vi.spyOn(uploadsService, "saveRecipeImage").mockRejectedValue(
      new Error("storage unavailable")
    );

    await agent.post("/api/auth/register").send({
      email: `upload-fail-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Upload Fail User",
      username: `upload-fail-user-${suffix}`
    });

    const uploadResponse = await agent
      .post("/api/uploads/recipe-images")
      .attach("file", Buffer.from("fake-png-data"), {
        filename: "cover.png",
        contentType: "image/png"
      });

    expect(uploadResponse.status).toBe(500);
    expect(uploadResponse.body.message).toBe("UPLOAD_FAILED");
  });
});
