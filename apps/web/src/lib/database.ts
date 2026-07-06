import { resolveDatabaseUrl } from "@repo/cms-data/db/resolveDatabaseUrl";

function getDatabaseUrl(): string {
  return resolveDatabaseUrl();
}

function isLocalDatabase(connectionString: string): boolean {
  return /(?:@|\/\/)(?:localhost|127\.0\.0\.1)(?::|\/|$)/.test(connectionString);
}

function ensureSslMode(connectionString: string): string {
  if (!connectionString || isLocalDatabase(connectionString)) {
    return connectionString;
  }

  if (/[?&]sslmode=/.test(connectionString)) {
    return connectionString;
  }

  const separator = connectionString.includes("?") ? "&" : "?";
  return `${connectionString}${separator}sslmode=verify-full`;
}

export function getPostgresPoolConfig() {
  const connectionString = ensureSslMode(getDatabaseUrl());

  if (!connectionString || isLocalDatabase(connectionString)) {
    return { connectionString };
  }

  return {
    connectionString,
    ssl: { rejectUnauthorized: false },
  };
}
