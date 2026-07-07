/**
 * Run Payload CLI with optional monorepo-root .env loading.
 * In CI, env vars are injected directly — missing .env is fine.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Readable } from "node:stream";
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

function createYesInput() {
  return new Readable({
    read() {
      this.push("y\n");
    },
  });
}

function runMigrateWithAutoYes() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [payloadBin, ...args], {
      ...spawnOptions,
      stdio: [createYesInput(), "inherit", "inherit"],
    });

    child.on("close", (code) => resolve(code ?? 1));
    child.on("error", reject);
  });
}

if (args[0] === "migrate") {
  const code = await runMigrateWithAutoYes();
  process.exit(code);
}

const result = spawnSync(process.execPath, [payloadBin, ...args], {
  ...spawnOptions,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
