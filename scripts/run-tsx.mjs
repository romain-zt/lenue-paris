/**
 * Run tsx with optional monorepo-root .env loading.
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
const requireFromApp = createRequire(join(appDir, "package.json"));
const tsxBin = requireFromApp.resolve("tsx/cli");
const args = process.argv.slice(2);

const result = spawnSync(process.execPath, [tsxBin, ...args], {
  stdio: "inherit",
  env: process.env,
  cwd: appDir,
});

process.exit(result.status ?? 1);
