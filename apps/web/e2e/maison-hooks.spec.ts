import { execSync, spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { test, expect } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(WEB_ROOT, "../..");
const SLICE_PATHS_FILE = path.join(
  REPO_ROOT,
  ".project/lenue-luxury/slice-paths.json",
);

const PORT = 3001;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const HOME_URL = `${BASE_URL}/fr`;

let serverProc: ChildProcess | undefined;

function requireDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URI ||
    process.env.POSTGRES_URL;

  if (!url) {
    throw new Error(
      [
        "test:maison-hooks requires DATABASE_URL (or DATABASE_URI / POSTGRES_URL).",
        "Use the same Postgres env as the CI quality job, for example:",
        "  DATABASE_URL=postgresql://ci:ci@localhost:5432/ci",
        "Local dev: copy .env.example to .env and ensure Postgres is reachable.",
      ].join("\n"),
    );
  }

  return url;
}

function loadRepoEnv(): void {
  loadDotenv({ path: path.join(REPO_ROOT, ".env") });
  loadDotenv({ path: path.join(WEB_ROOT, ".env"), override: false });
}

function assertSlicePathsExist(): void {
  const raw = fs.readFileSync(SLICE_PATHS_FILE, "utf8");
  const parsed = JSON.parse(raw) as {
    "storefront-shell--global-chrome": {
      paths: string[];
      preview_port: number;
    };
  };

  const slice = parsed["storefront-shell--global-chrome"];
  expect(slice.preview_port).toBe(PORT);

  for (const rel of slice.paths) {
    const abs = path.join(REPO_ROOT, rel);
    expect(fs.existsSync(abs), `slice-paths entry missing on disk: ${rel}`).toBe(true);
  }
}

async function waitForHttp(url: string, timeoutMs = 240_000): Promise<void> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (res.status < 500) {
        return;
      }
    } catch {
      // server still booting
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`Timed out waiting for ${url} (port ${PORT}, next start + payload migrate)`);
}

test.describe.configure({ mode: "serial", timeout: 300_000 });

test.describe("maison hooks on built storefront", () => {
  test.beforeAll(async () => {
    test.setTimeout(360_000);
    loadRepoEnv();
    requireDatabaseUrl();
    assertSlicePathsExist();

    const nextDir = path.join(WEB_ROOT, ".next");
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true });
    }

    execSync("pnpm run build", {
      cwd: WEB_ROOT,
      stdio: "inherit",
      env: process.env,
    });

    try {
      execSync("pnpm run seed", {
        cwd: WEB_ROOT,
        stdio: "inherit",
        env: process.env,
        timeout: 180_000,
      });
    } catch (error) {
      console.warn(
        "[maison-hooks] seed step failed — continuing; product route must exist or test will fail clearly",
      );
      console.warn(error);
    }

    serverProc = spawn("pnpm", ["run", "start"], {
      cwd: WEB_ROOT,
      env: process.env,
      stdio: "pipe",
      shell: true,
    });

    serverProc.stdout?.on("data", (chunk: Buffer) => process.stdout.write(chunk));
    serverProc.stderr?.on("data", (chunk: Buffer) => process.stderr.write(chunk));

    serverProc.on("error", (error) => {
      console.error("[maison-hooks] failed to spawn next start:", error);
    });

    await waitForHttp(HOME_URL);
  });

  test.afterAll(async () => {
    if (serverProc && !serverProc.killed) {
      serverProc.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      if (!serverProc.killed) {
        serverProc.kill("SIGKILL");
      }
    }
  });

  test("/fr exposes shell hooks after next start on port 3001", async ({ page }) => {
    await page.goto(HOME_URL, { waitUntil: "domcontentloaded" });

    await expect(page.locator('[data-maison="header"]')).toBeVisible();
    await expect(page.locator('[data-maison="wordmark"]')).toBeVisible();
    await expect(page.locator('[data-maison="nav"]')).toBeAttached();
    await expect(page.locator('[data-maison="hero"]')).toBeVisible();
    await expect(page.locator('[data-maison="hero-image"]')).toBeAttached();
    await expect(page.locator('[data-maison="hero"] img')).toBeVisible();
    await expect(page.locator('[data-maison="footer"]')).toBeVisible();
    await expect(page.locator('[data-maison="catalogue-grid"]')).toBeVisible();

    const wordmarkText = await page.locator('[data-maison="wordmark"]').innerText();
    expect(wordmarkText).toContain("LÉNUE");

    const heroWordmark = page.locator('[data-maison="hero"] h1');
    await expect(heroWordmark).toBeVisible();
    await expect(page.locator('[data-maison="wordmark"]')).not.toHaveAttribute(
      "id",
      await heroWordmark.getAttribute("id") ?? "",
    );
  });
});
