import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

const originalNodeEnv = process.env.NODE_ENV;

describe.sequential("auth cookie transport", () => {
  afterEach(() => {
    vi.resetModules();

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
      return;
    }

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("does not mark auth cookies as secure when the configured web origin is plain http", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();

    const { app } = await import("../src/app");
    const agent = request.agent(app);
    const suffix = Date.now().toString(36);

    const registerResponse = await agent.post("/api/auth/register").set("Origin", "http://localhost:3000").send({
      email: `http-cookie-${suffix}@cookpedia.test`,
      password: "SecretPass123!",
      displayName: "HTTP Cookie User",
      username: `http-cookie-${suffix}`
    });

    expect(registerResponse.status).toBe(201);
    const setCookieHeader = registerResponse.headers["set-cookie"];
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];

    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.some((cookie) => cookie.includes("Secure"))).toBe(false);
  });
});
