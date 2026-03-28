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
});
