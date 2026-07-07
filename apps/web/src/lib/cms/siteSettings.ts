import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import type { SiteSetting as SiteSettings } from "@/payload-types";

function envBrandName(): string {
  return process.env.NEXT_PUBLIC_BRAND_NAME ?? "";
}

function envWordmarkPrimary(): string {
  return process.env.NEXT_PUBLIC_BRAND_WORDMARK_PRIMARY ?? "";
}

function envWordmarkSecondary(): string {
  return process.env.NEXT_PUBLIC_BRAND_WORDMARK_SECONDARY ?? "";
}

const FALLBACK: SiteSettings = {
  id: 0,
  brandName: envBrandName(),
  brandWordmarkPrimary: envWordmarkPrimary(),
  brandWordmarkSecondary: envWordmarkSecondary(),
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
  whatsappPhone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
};

export function resolveBrandName(settings: SiteSettings): string {
  return settings.brandName || envBrandName();
}

export function resolveWordmarkPrimary(settings: SiteSettings): string {
  return settings.brandWordmarkPrimary || envWordmarkPrimary() || resolveBrandName(settings);
}

export function resolveWordmarkSecondary(settings: SiteSettings): string {
  return settings.brandWordmarkSecondary || envWordmarkSecondary();
}

/** Deduplicated per request via React cache(). */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const payload = await getPayload({ config });
    const settings = await payload.findGlobal({ slug: "site-settings" });
    return settings as SiteSettings;
  } catch {
    return FALLBACK;
  }
});
