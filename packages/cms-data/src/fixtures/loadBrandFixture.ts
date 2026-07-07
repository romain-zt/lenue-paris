import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export type BrandFixture = {
  slug: string;
  brandName: string;
  brandWordmarkPrimary: string;
  brandWordmarkSecondary: string;
  instagramUrl: string;
  whatsappPhone: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
};

const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../fixtures/brands");

const cache = new Map<string, BrandFixture>();

/** Parse `--brand=slug` from CLI argv. Defaults to `lenue`. */
export function parseBrandArg(argv: string[] = process.argv): string {
  const flag = argv.find((arg) => arg.startsWith("--brand="));
  if (!flag) return "lenue";
  const slug = flag.slice("--brand=".length).trim();
  return slug || "lenue";
}

/** Load a brand fixture JSON by slug (e.g. `lenue`, `template`). */
export function loadBrandFixture(slug: string): BrandFixture {
  const key = slug.trim().toLowerCase();
  if (cache.has(key)) return cache.get(key)!;

  const filepath = join(FIXTURES_DIR, `${key}.json`);
  const raw = readFileSync(filepath, "utf8");
  const fixture = JSON.parse(raw) as BrandFixture;
  cache.set(key, fixture);
  return fixture;
}
