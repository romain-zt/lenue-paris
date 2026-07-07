/** Docker Compose maps Postgres to host port 5433 (see docker-compose.yml). */
export const DOCKER_HOST_PORT = 5433;

export const LOCAL_DOCKER_DATABASE_URL =
  `postgres://lenueparis:lenueparis@127.0.0.1:${DOCKER_HOST_PORT}/lenueparis`;

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
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
}

/**
 * Resolves the Postgres URL from env vars.
 * Redirects legacy/wrong local ports (5432, 5434, …) to Docker host port 5433.
 * Set USE_NATIVE_POSTGRES=true to disable the redirect.
 * In CI (CI=true), the URL is used as-is — GitHub Actions Postgres listens on 5432.
 */
export function resolveDatabaseUrl(): string {
  const fromEnv = pickDatabaseUrlFromEnv();
  if (!fromEnv) return "";

  if (process.env.CI === "true" || process.env.USE_NATIVE_POSTGRES === "true") {
    return fromEnv;
  }

  const port = parseLocalPort(fromEnv);
  if (port !== null && port !== DOCKER_HOST_PORT) {
    console.warn(
      `[db] DATABASE_URL points to localhost:${port} but Docker Postgres uses port ${DOCKER_HOST_PORT} — redirecting. ` +
        `Update .env or set USE_NATIVE_POSTGRES=true to keep ${port}.`,
    );
    return LOCAL_DOCKER_DATABASE_URL;
  }

  return fromEnv;
}
