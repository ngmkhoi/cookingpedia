import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";

describe("auth flow", () => {
  it("registers, logs in, rotates refresh, and logs out", async () => {
    const agent = request.agent(app);
    const suffix = Date.now().toString(36);
    const email = `mina-${suffix}@cookpedia.test`;
    const username = `mina-${suffix}`;

    const registerResponse = await agent.post("/api/auth/register").send({
      email,
      password: "SecretPass123!",
      displayName: "Mina Ha",
      username
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.username).toBe(username);

    const initialLogoutResponse = await agent.post("/api/auth/logout").send();
    expect(initialLogoutResponse.status).toBe(200);

    const loginResponse = await agent.post("/api/auth/login").send({
      email,
      password: "SecretPass123!"
    });
    expect(loginResponse.status).toBe(200);

    const meResponse = await agent.get("/api/auth/me");
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(email);

    const refreshResponse = await agent.post("/api/auth/refresh").send();
    expect(refreshResponse.status).toBe(200);

    const logoutResponse = await agent.post("/api/auth/logout").send();
    expect(logoutResponse.status).toBe(200);

    const afterLogout = await agent.get("/api/auth/me");
    expect(afterLogout.status).toBe(401);
  });

  it("returns field-aware conflicts when the email or username is already registered", async () => {
    const agent = request.agent(app);
    const suffix = Date.now().toString(36);
    const email = `taken-${suffix}@cookpedia.test`;
    const username = `taken-${suffix}`;

    const firstRegisterResponse = await agent.post("/api/auth/register").send({
      email,
      password: "SecretPass123!",
      displayName: "Taken User",
      username
    });

    expect(firstRegisterResponse.status).toBe(201);

    const duplicateEmailResponse = await agent.post("/api/auth/register").send({
      email,
      password: "SecretPass123!",
      displayName: "Taken User",
      username: `${username}-other`
    });

    expect(duplicateEmailResponse.status).toBe(409);
    expect(duplicateEmailResponse.body.message).toBe("FIELD_CONFLICT");
    expect(duplicateEmailResponse.body.fieldErrors).toEqual({
      email: "This email is already in use"
    });

    const duplicateUsernameResponse = await agent.post("/api/auth/register").send({
      email: `other-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "Taken User",
      username
    });

    expect(duplicateUsernameResponse.status).toBe(409);
    expect(duplicateUsernameResponse.body.message).toBe("FIELD_CONFLICT");
    expect(duplicateUsernameResponse.body.fieldErrors).toEqual({
      username: "This username is already taken"
    });
  });

  it("reports debounced registration field availability", async () => {
    const agent = request.agent(app);
    const suffix = Date.now().toString(36);
    const email = `availability-${suffix}@cookpedia.test`;
    const username = `availability-${suffix}`;

    const registerResponse = await agent.post("/api/auth/register").send({
      email,
      password: "SecretPass123!",
      displayName: "Availability User",
      username
    });

    expect(registerResponse.status).toBe(201);

    const takenResponse = await request(app).get(
      `/api/auth/availability?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`
    );

    expect(takenResponse.status).toBe(200);
    expect(takenResponse.body.email).toEqual({ status: "taken" });
    expect(takenResponse.body.username).toEqual({ status: "taken" });

    const mixedResponse = await request(app).get(
      `/api/auth/availability?email=${encodeURIComponent(`fresh-${suffix}@cookpedia.test`)}`
    );

    expect(mixedResponse.status).toBe(200);
    expect(mixedResponse.body.email).toEqual({ status: "available" });
    expect(mixedResponse.body.username).toEqual({ status: "unchecked" });

    const invalidResponse = await request(app).get(
      "/api/auth/availability?email=bad-email&username=ab"
    );

    expect(invalidResponse.status).toBe(200);
    expect(invalidResponse.body.email).toEqual({ status: "invalid" });
    expect(invalidResponse.body.username).toEqual({ status: "invalid" });
  });
});
