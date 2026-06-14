import type { SupportedLocale } from "./types";
import { SUPPORTED_LOCALES } from "./types";

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** Invalid or missing locale falls back to `fr` per spec contract errors. */
export function normalizeLocale(value: string | undefined): SupportedLocale {
  if (value === undefined || value === "") {
    return "fr";
  }
  return isSupportedLocale(value) ? value : "fr";
}
