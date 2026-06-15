function getDatabaseUrl(): string {
  return (
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URI ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  );
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
  return `${connectionString}${separator}sslmode=require`;
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
