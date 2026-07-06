/** Collections / globals whose text can be flattened for search and RAG context. */
export type SearchableSource =
  | "pages"
  | "products"
  | "collections"
  | "media"
  | "site-settings"
  | "design-tokens";

const PAGE_BLOCK_TEXT_FIELDS: Record<string, readonly string[]> = {
  hero: ["season", "tagline", "ctaLabel", "ctaLink"],
  editorialStrip: ["label", "headline", "subline", "body", "ctaLabel", "ctaLink"],
  featuredProducts: ["title", "viewCollectionLabel"],
  productGrid: ["title"],
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function collectFields(
  obj: Record<string, unknown>,
  fieldNames: readonly string[],
): string[] {
  return fieldNames.flatMap((name) => {
    const value = asNonEmptyString(obj[name]);
    return value ? [value] : [];
  });
}

function extractBlockText(block: Record<string, unknown>): string[] {
  const blockType = typeof block.blockType === "string" ? block.blockType : null;
  if (!blockType) return [];
  const fields = PAGE_BLOCK_TEXT_FIELDS[blockType];
  if (!fields) return [];
  return collectFields(block, fields);
}

export function extractPageText(doc: Record<string, unknown>): string {
  const parts = collectFields(doc, ["title", "slug", "body"]);

  const blocks = doc.blocks;
  if (Array.isArray(blocks)) {
    for (const block of blocks) {
      if (block && typeof block === "object") {
        parts.push(...extractBlockText(block as Record<string, unknown>));
      }
    }
  }

  return parts.join("\n");
}

export function extractProductText(doc: Record<string, unknown>): string {
  const parts = collectFields(doc, ["title", "slug", "description", "category"]);
  if (typeof doc.price === "number") {
    parts.push(String(doc.price));
  }
  if (doc.inStock === true) parts.push("en stock");
  if (doc.inStock === false) parts.push("rupture de stock");
  return parts.join("\n");
}

export function extractCollectionText(doc: Record<string, unknown>): string {
  return collectFields(doc, ["title", "slug"]).join("\n");
}

export function extractMediaText(doc: Record<string, unknown>): string {
  return collectFields(doc, ["alt", "filename"]).join("\n");
}

export function extractSiteSettingsText(doc: Record<string, unknown>): string {
  return collectFields(doc, [
    "brandName",
    "brandWordmarkPrimary",
    "brandWordmarkSecondary",
    "instagramUrl",
    "whatsappPhone",
  ]).join("\n");
}

export function extractDesignTokensText(doc: Record<string, unknown>): string {
  const colorFields = [
    "colorPrimary",
    "colorSecondary",
    "colorMuted",
    "colorSubtle",
    "colorPageBg",
    "colorSurface",
    "colorEditorial",
    "colorSection",
    "colorSkeleton",
    "colorAccent",
    "colorAccentHover",
    "colorAccentText",
    "colorBorder",
  ] as const;

  return colorFields
    .flatMap((name) => {
      const value = asNonEmptyString(doc[name]);
      return value ? [`${name}: ${value}`] : [];
    })
    .join("\n");
}

export function extractDocumentText(
  collection: SearchableSource,
  doc: Record<string, unknown>,
): string {
  switch (collection) {
    case "pages":
      return extractPageText(doc);
    case "products":
      return extractProductText(doc);
    case "collections":
      return extractCollectionText(doc);
    case "media":
      return extractMediaText(doc);
    case "site-settings":
      return extractSiteSettingsText(doc);
    case "design-tokens":
      return extractDesignTokensText(doc);
    default: {
      const _exhaustive: never = collection;
      return _exhaustive;
    }
  }
}

export function textMatchesQuery(text: string, query: string): boolean {
  const q = query.trim();
  if (!q) return true;
  return text.toLocaleLowerCase().includes(q.toLocaleLowerCase());
}

export function buildTextSnippet(
  text: string,
  query: string,
  maxLen = 160,
): string | null {
  const normalizedText = text.replace(/\s+/g, " ").trim();
  if (!normalizedText) return null;

  const q = query.trim();
  if (!q) return normalizedText.slice(0, maxLen);

  const idx = normalizedText.toLocaleLowerCase().indexOf(q.toLocaleLowerCase());
  if (idx === -1) return normalizedText.slice(0, maxLen);

  const start = Math.max(0, idx - 40);
  const end = Math.min(normalizedText.length, idx + q.length + 80);
  const snippet = normalizedText.slice(start, end);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < normalizedText.length ? "…" : "";
  return `${prefix}${snippet}${suffix}`;
}

/** Appends flattened page/block text to an existing document snapshot. */
export function appendSearchableTextToSnapshot(
  snapshot: string,
  collection: SearchableSource,
  doc: Record<string, unknown>,
  maxChars = 2000,
): string {
  const text = extractDocumentText(collection, doc);
  if (!text) return snapshot;
  const truncated =
    text.length > maxChars ? `${text.slice(0, maxChars)}…` : text;
  return `${snapshot}\n\nContenu textuel indexable (blocs inclus) :\n${truncated}`;
}
