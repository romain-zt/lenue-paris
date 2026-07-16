import { getCmsClient } from "../client";
import type { ContentLocale } from "../types";
import { extractPageText } from "./extractSearchableText";

const HOME_SLUGS = ["home", "homepage", "accueil", "index"] as const;

const HOME_QUERY_PATTERNS: RegExp[] = [
  /\bpage\s+d['']accueil\b/i,
  /\bpage\s+daccueil\b/i,
  /^accueil$/i,
  /^home(page)?$/i,
  /^homepage$/i,
  /\baccueil\b/i,
];

export function isHomePageQuery(query: string | undefined): boolean {
  const normalized = query?.trim()
  if (!normalized) return false
  return HOME_QUERY_PATTERNS.some(pattern => pattern.test(normalized))
}

export type HomePageResult =
  | {
      found: true
      id: number
      slug: string
      title: string | null
      status: string | null
      locale: ContentLocale
      searchableText: string
      heroBlockIndex: number | null
      /** What visitors actually see on / — NOT the same as pages.title */
      visibleOnStorefront: {
        heroWordmark: {
          global: "site-settings"
          fields: ["brandWordmarkPrimary", "brandWordmarkSecondary"]
          /** Line 1 on the hero — large serif text */
          primary: string | null
          /** Line 2 under primary — hidden when empty */
          secondary: string | null
          /** Rendered as two lines when secondary is non-empty */
          renderedAs: string
        }
        heroTagline: string | null
        heroSeason: string | null
        adminOnlyTitle: string | null
        /** How to patch the wordmark without leaving a stale second line */
        wordmarkPatchRules: {
          singleLineTitle: string
          twoLineTitle: string
        }
      }
    }
  | { found: false; reason: string }

export async function findHomePage(
  locale: ContentLocale = "fr",
  options?: { includeDraft?: boolean },
): Promise<HomePageResult> {
  const payload = await getCmsClient()
  const draft = options?.includeDraft ?? false

  for (const slug of HOME_SLUGS) {
    const response = await payload.find({
      collection: "pages",
      locale,
      fallbackLocale: "fr",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
      draft,
    })

    const doc = response.docs[0] as Record<string, unknown> | undefined
    if (!doc?.id) continue

    const siteSettings = await payload.findGlobal({
      slug: "site-settings",
      locale,
      fallbackLocale: "fr",
      overrideAccess: true,
      depth: 0,
    })

    return mapHomePageResult(doc, slug, locale, siteSettings as unknown as Record<string, unknown>)
  }

  const fallback = await payload.find({
    collection: "pages",
    locale,
    fallbackLocale: "fr",
    limit: 1,
    depth: 1,
    overrideAccess: true,
    draft,
    sort: "createdAt",
  })

  const doc = fallback.docs[0] as Record<string, unknown> | undefined
  if (doc?.id) {
    const siteSettings = await payload.findGlobal({
      slug: "site-settings",
      locale,
      fallbackLocale: "fr",
      overrideAccess: true,
      depth: 0,
    })

    return mapHomePageResult(
      doc,
      (doc.slug as string | null) ?? "unknown",
      locale,
      siteSettings as unknown as Record<string, unknown>,
    )
  }

  return {
    found: false,
    reason: "Aucune page trouvée — lancez pnpm seed pour créer la page d'accueil (slug home).",
  }
}

function formatWordmarkRendered(primary: string | null, secondary: string | null): string {
  const line1 = primary?.trim() ?? ""
  const line2 = secondary?.trim() ?? ""
  if (!line1 && !line2) return "(vide)"
  if (!line2) return line1
  return `${line1}\n${line2}`
}

function mapHomePageResult(
  doc: Record<string, unknown>,
  slug: string,
  locale: ContentLocale,
  siteSettings: Record<string, unknown>,
): Extract<HomePageResult, { found: true }> {
  const blocks = Array.isArray(doc.blocks) ? doc.blocks : []
  let heroBlockIndex: number | null = null
  let heroTagline: string | null = null
  let heroSeason: string | null = null

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i] as Record<string, unknown> | undefined
    if (!block || block.blockType !== "hero") continue
    heroBlockIndex = i
    heroTagline = typeof block.tagline === "string" ? block.tagline : null
    heroSeason = typeof block.season === "string" ? block.season : null
    break
  }

  return {
    found: true,
    id: doc.id as number,
    slug: (doc.slug as string | null) ?? slug,
    title: (doc.title as string | null) ?? null,
    status: (doc._status as string | null) ?? null,
    locale,
    searchableText: extractPageText(doc),
    heroBlockIndex,
    visibleOnStorefront: {
      heroWordmark: {
        global: "site-settings",
        fields: ["brandWordmarkPrimary", "brandWordmarkSecondary"],
        primary: (siteSettings.brandWordmarkPrimary as string | null) ?? null,
        secondary: (siteSettings.brandWordmarkSecondary as string | null) ?? null,
        renderedAs: formatWordmarkRendered(
          (siteSettings.brandWordmarkPrimary as string | null) ?? null,
          (siteSettings.brandWordmarkSecondary as string | null) ?? null,
        ),
      },
      heroTagline,
      heroSeason,
      adminOnlyTitle: (doc.title as string | null) ?? null,
      wordmarkPatchRules: {
        singleLineTitle:
          'Un seul titre demandé (ex. "Test") → patch_field site-settings isGlobal:true data={brandWordmarkPrimary:"Test",brandWordmarkSecondary:""} — sinon l\'ancienne ligne 2 (ex. PARIS) reste visible',
        twoLineTitle:
          'Deux lignes explicites (ex. "LÉNUE PARIS") → brandWordmarkPrimary + brandWordmarkSecondary',
      },
    },
  }
}
