import { afterEach, describe, expect, it, vi } from "vitest";
import { getPostgresPoolConfig } from "../database";

describe("getPostgresPoolConfig", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps local connections without SSL", () => {
    vi.stubEnv("POSTGRES_URL", "");
    vi.stubEnv("DATABASE_URL", "postgres://app:app@localhost:5432/app");
    vi.stubEnv("USE_NATIVE_POSTGRES", "true");

    expect(getPostgresPoolConfig()).toEqual({
      connectionString: "postgres://app:app@localhost:5432/app",
    });
  });

  it("adds sslmode=verify-full and ssl options for remote Neon URLs", () => {
    vi.stubEnv("POSTGRES_URL", "postgres://user:pass@ep-example.neon.tech/neondb");

    expect(getPostgresPoolConfig()).toEqual({
      connectionString: "postgres://user:pass@ep-example.neon.tech/neondb?sslmode=verify-full",
      ssl: { rejectUnauthorized: false },
    });
  });

  it("does not duplicate sslmode when already present", () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgres://user:pass@ep-example.neon.tech/neondb?sslmode=verify-full",
    );

    expect(getPostgresPoolConfig()).toEqual({
      connectionString: "postgres://user:pass@ep-example.neon.tech/neondb?sslmode=verify-full",
      ssl: { rejectUnauthorized: false },
    });
  });
});
