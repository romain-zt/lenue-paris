import type { Page, PagesResponse } from "@/types/page";

export async function getPage(slug: string, locale = "fr"): Promise<Page | null> {
  const cmsUrl = process.env.CMS_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(
      `${cmsUrl}/api/pages?where[slug][equals]=${encodeURIComponent(slug)}&locale=${encodeURIComponent(locale)}&depth=1`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as PagesResponse;
    return data.docs?.[0] ?? null;
  } catch {
    return null;
  }
}
