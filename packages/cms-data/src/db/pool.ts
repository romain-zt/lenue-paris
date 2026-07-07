import pg from "pg";

import { resolveDatabaseUrl } from "./resolveDatabaseUrl";

let pool: pg.Pool | undefined;

function isLocalDatabase(connectionString: string): boolean {
  return /(?:@|\/\/)(?:localhost|127\.0\.0\.1)(?::|\/|$)/.test(connectionString);
}

export function getPgPool(): pg.Pool {
  if (pool) return pool;

  const connectionString = resolveDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "@repo/cms-data: DATABASE_URL is required for vector search",
    );
  }

  pool = new pg.Pool({
    connectionString,
    max: 5,
    ssl: !isLocalDatabase(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
  });

  return pool;
}

export async function closePgPool(): Promise<void> {
  if (!pool) return;
  const active = pool;
  pool = undefined;
  await active.end();
}

/** @internal test helper */
export function resetPgPoolForTests(): void {
  pool = undefined;
}
