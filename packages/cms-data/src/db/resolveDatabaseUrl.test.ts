import { describe, expect, it, afterEach } from "vitest";
import {
  LOCAL_DOCKER_DATABASE_URL,
  resolveDatabaseUrl,
} from "./resolveDatabaseUrl";

describe("resolveDatabaseUrl", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("redirects localhost:5433 to Docker port 5434", () => {
    process.env.DATABASE_URL =
      "postgres://lenueparis:lenueparis@localhost:5433/lenueparis";
    delete process.env.USE_NATIVE_POSTGRES;

    expect(resolveDatabaseUrl()).toBe(LOCAL_DOCKER_DATABASE_URL);
  });

  it("keeps 5433 when USE_NATIVE_POSTGRES=true", () => {
    process.env.DATABASE_URL =
      "postgres://lenueparis:lenueparis@localhost:5433/lenueparis";
    process.env.USE_NATIVE_POSTGRES = "true";

    expect(resolveDatabaseUrl()).toBe(process.env.DATABASE_URL);
  });

  it("does not alter port 5434", () => {
    const url = "postgres://lenueparis:lenueparis@localhost:5434/lenueparis";
    process.env.DATABASE_URL = url;

    expect(resolveDatabaseUrl()).toBe(url);
  });
});
