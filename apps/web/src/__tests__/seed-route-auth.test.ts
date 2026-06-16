import { describe, expect, it, afterEach } from "vitest";
import { seedAuthFailure } from "../lib/seed-api-auth";

describe("seedAuthFailure", () => {
  const originalSecret = process.env.SEED_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.SEED_SECRET;
    } else {
      process.env.SEED_SECRET = originalSecret;
    }
  });

  it("returns 503 when SEED_SECRET is unset", () => {
    delete process.env.SEED_SECRET;
    const res = seedAuthFailure(new Request("http://localhost/api/seed"));
    expect(res?.status).toBe(503);
  });

  it("returns 401 without Bearer token", () => {
    process.env.SEED_SECRET = "test-secret";
    const res = seedAuthFailure(new Request("http://localhost/api/seed"));
    expect(res?.status).toBe(401);
  });

  it("returns 401 with wrong token", () => {
    process.env.SEED_SECRET = "test-secret";
    const res = seedAuthFailure(
      new Request("http://localhost/api/seed", {
        headers: { Authorization: "Bearer wrong" },
      }),
    );
    expect(res?.status).toBe(401);
  });

  it("returns null when authorized", () => {
    process.env.SEED_SECRET = "test-secret";
    const res = seedAuthFailure(
      new Request("http://localhost/api/seed", {
        headers: { Authorization: "Bearer test-secret" },
      }),
    );
    expect(res).toBeNull();
  });
});
