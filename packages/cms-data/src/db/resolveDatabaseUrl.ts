/** Docker Compose maps Postgres to host port 5434 (5432/5433 are often taken on Windows). */
export const LOCAL_DOCKER_DATABASE_URL =
  "postgres://lenueparis:lenueparis@127.0.0.1:5434/lenueparis";

function parseLocalPort(connectionString: string): number | null {
  const match = connectionString.match(
    /(?:@|\/\/)(?:localhost|127\.0\.0\.1):(\d+)(?:\/|$)/,
  );
  if (!match?.[1]) return null;
  return Number.parseInt(match[1], 10);
}

function pickDatabaseUrlFromEnv(): string {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URI ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

/**
 * Resolves the Postgres URL from env vars.
 * Auto-corrects localhost:5433 → 5434 (stale local .env after docker-compose port change).
 * Set USE_NATIVE_POSTGRES=true to disable the redirect.
 */
export function resolveDatabaseUrl(): string {
  const fromEnv = pickDatabaseUrlFromEnv();
  if (!fromEnv) return "";

  const port = parseLocalPort(fromEnv);
  if (
    port === 5433 &&
    process.env.USE_NATIVE_POSTGRES !== "true"
  ) {
    console.warn(
      "[db] DATABASE_URL points to localhost:5433 but Docker Postgres uses port 5434 — redirecting. " +
        "Update .env or set USE_NATIVE_POSTGRES=true to keep 5433.",
    );
    return LOCAL_DOCKER_DATABASE_URL;
  }

  return fromEnv;
}
