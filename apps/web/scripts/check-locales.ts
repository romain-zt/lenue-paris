#!/usr/bin/env tsx
/**
 * Validates that every content locale has a next-intl messages file.
 * Optionally scaffolds missing files from the storefront default locale.
 *
 * Run: pnpm --filter web check:locales
 * Scaffold: pnpm --filter web check:locales -- --scaffold
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  CONTENT_LOCALES,
  STOREFRONT_DEFAULT_LOCALE,
} from "@repo/payload-schema/i18n/content-locales";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.resolve(__dirname, "../messages");
const scaffold = process.argv.includes("--scaffold");

let failed = false;

for (const locale of CONTENT_LOCALES) {
  const filePath = path.join(messagesDir, `${locale}.json`);
  if (fs.existsSync(filePath)) continue;

  if (scaffold && locale !== STOREFRONT_DEFAULT_LOCALE) {
    const basePath = path.join(messagesDir, `${STOREFRONT_DEFAULT_LOCALE}.json`);
    fs.copyFileSync(basePath, filePath);
    console.log(`Scaffolded messages/${locale}.json from ${STOREFRONT_DEFAULT_LOCALE}.json`);
    continue;
  }

  console.error(`Missing messages/${locale}.json for locale "${locale}" in CONTENT_LOCALES`);
  failed = true;
}

if (failed) {
  console.error(
    "\nAdd the missing file(s) or run: pnpm --filter web check:locales -- --scaffold",
  );
  process.exit(1);
}

console.log(`Locale check passed (${CONTENT_LOCALES.join(", ")})`);
