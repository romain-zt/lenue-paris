import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import type { SiteSettings } from "@/payload-types";

const FALLBACK: SiteSettings = {
  id: 0,
  brandName: "Lénue Paris",
  instagramUrl: "https://www.instagram.com/alisa.inwonderland.21",
  whatsappPhone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "79117126262",
};

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
