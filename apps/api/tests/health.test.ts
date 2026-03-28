import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/firebase", () => ({
  bucket: {
    name: "cookpedia-test-bucket",
    file: () => ({
      save: async () => undefined
    })
  }
}));

import { app } from "../src/app";

describe("GET /api/health", () => {
  it("returns an ok payload", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
