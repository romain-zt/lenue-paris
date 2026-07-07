/**
 * Run Payload CLI with optional monorepo-root .env loading.
 * In CI, env vars are injected directly — missing .env is fine.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(repoRoot, ".env");

if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (key.length === 0 || key in process.env) continue;
    process.env[key] = trimmed.slice(eq + 1).trim();
  }
}

const appDir = process.cwd();
const payloadBin = resolve(appDir, "node_modules/payload/bin.js");
const args = process.argv.slice(2);
const spawnOptions = { env: process.env, cwd: appDir };

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.TEST_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    ""
  );
}

async function loadPgClient() {
  const requireFromApp = createRequire(join(appDir, "package.json"));
  const pgModule = requireFromApp("pg");
  return pgModule.default ?? pgModule;
}

async function clearDevMigrationMarker(connectionString) {
  try {
    const pg = await loadPgClient();
    const client = new pg.Client({ connectionString });
    await client.connect();
    await client.query("DELETE FROM payload_migrations WHERE batch = -1");
    await client.end();
  } catch {
    // payload_migrations may not exist yet on a fresh database.
  }
}

async function assertUsersTableExists(connectionString) {
  const pg = await loadPgClient();
  const client = new pg.Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'users'
    ) AS exists;
  `);
  await client.end();

  if (!result.rows[0]?.exists) {
    console.error(
      "[migrate] La table public.users est absente après migrate — les migrations n'ont probablement pas été appliquées.",
    );
    process.exit(1);
  }
}

async function runMigrate() {
  const connectionString = getDatabaseUrl();
  if (connectionString) {
    await clearDevMigrationMarker(connectionString);
  }

  const result = spawnSync(process.execPath, [payloadBin, ...args], {
    ...spawnOptions,
    stdio: "inherit",
  });

  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  if (connectionString) {
    await assertUsersTableExists(connectionString);
  }

  process.exit(0);
}

if (args[0] === "migrate") {
  await runMigrate();
}

const result = spawnSync(process.execPath, [payloadBin, ...args], {
  ...spawnOptions,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
