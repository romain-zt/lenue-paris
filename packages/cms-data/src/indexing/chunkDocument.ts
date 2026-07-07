import type { SearchableSource } from "../read/extractSearchableText";

export interface DocumentChunk {
  fieldPath: string;
  chunkIndex: number;
  text: string;
}

const PAGE_BLOCK_TEXT_FIELDS: Record<string, readonly string[]> = {
  hero: ["season", "tagline", "ctaLabel", "ctaLink"],
  editorialStrip: ["label", "headline", "subline", "body", "ctaLabel", "ctaLink"],
  featuredProducts: ["title", "viewCollectionLabel"],
  productGrid: ["title"],
};

const MAX_CHUNK_CHARS = 800;
const CHUNK_OVERLAP = 100;

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function splitLongText(fieldPath: string, text: string): DocumentChunk[] {
  if (text.length <= MAX_CHUNK_CHARS) {
    return [{ fieldPath, chunkIndex: 0, text }];
  }

  const chunks: DocumentChunk[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < text.length) {
    const end = Math.min(start + MAX_CHUNK_CHARS, text.length);
    chunks.push({
      fieldPath,
      chunkIndex,
      text: text.slice(start, end),
    });
    if (end >= text.length) break;
    start = Math.max(start + 1, end - CHUNK_OVERLAP);
    chunkIndex += 1;
  }

  return chunks;
}

function pushFieldChunks(
  chunks: DocumentChunk[],
  fieldPath: string,
  value: unknown,
): void {
  const text = asNonEmptyString(value);
  if (!text) return;
  chunks.push(...splitLongText(fieldPath, text));
}

function extractPageChunks(doc: Record<string, unknown>): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  pushFieldChunks(chunks, "title", doc.title);
  pushFieldChunks(chunks, "slug", doc.slug);
  pushFieldChunks(chunks, "body", doc.body);

  const blocks = doc.blocks;
  if (!Array.isArray(blocks)) return chunks;

  for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
    const block = blocks[blockIndex];
    if (!block || typeof block !== "object") continue;

    const record = block as Record<string, unknown>;
    const blockType =
      typeof record.blockType === "string" ? record.blockType : "unknown";
    const fields = PAGE_BLOCK_TEXT_FIELDS[blockType] ?? [];

    for (const fieldName of fields) {
      pushFieldChunks(
        chunks,
        `blocks.${blockIndex}.${blockType}.${fieldName}`,
        record[fieldName],
      );
    }
  }

  return chunks;
}

function extractProductChunks(doc: Record<string, unknown>): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  pushFieldChunks(chunks, "title", doc.title);
  pushFieldChunks(chunks, "slug", doc.slug);
  pushFieldChunks(chunks, "description", doc.description);
  pushFieldChunks(chunks, "category", doc.category);

  if (typeof doc.price === "number") {
    pushFieldChunks(chunks, "price", String(doc.price));
  }
  if (doc.inStock === true) {
    pushFieldChunks(chunks, "inStock", "en stock");
  } else if (doc.inStock === false) {
    pushFieldChunks(chunks, "inStock", "rupture de stock");
  }

  return chunks;
}

function extractCollectionChunks(doc: Record<string, unknown>): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  pushFieldChunks(chunks, "title", doc.title);
  pushFieldChunks(chunks, "slug", doc.slug);
  return chunks;
}

function extractMediaChunks(doc: Record<string, unknown>): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  pushFieldChunks(chunks, "alt", doc.alt);
  pushFieldChunks(chunks, "filename", doc.filename);
  return chunks;
}

function extractSiteSettingsChunks(doc: Record<string, unknown>): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  for (const field of [
    "brandName",
    "brandWordmarkPrimary",
    "brandWordmarkSecondary",
    "instagramUrl",
    "whatsappPhone",
  ] as const) {
    pushFieldChunks(chunks, field, doc[field]);
  }
  return chunks;
}

function extractDesignTokensChunks(doc: Record<string, unknown>): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  for (const field of [
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
  ] as const) {
    const value = asNonEmptyString(doc[field]);
    if (value) {
      pushFieldChunks(chunks, field, `${field}: ${value}`);
    }
  }
  return chunks;
}

export function extractDocumentChunks(
  collection: SearchableSource,
  doc: Record<string, unknown>,
): DocumentChunk[] {
  switch (collection) {
    case "pages":
      return extractPageChunks(doc);
    case "products":
      return extractProductChunks(doc);
    case "collections":
      return extractCollectionChunks(doc);
    case "media":
      return extractMediaChunks(doc);
    case "site-settings":
      return extractSiteSettingsChunks(doc);
    case "design-tokens":
      return extractDesignTokensChunks(doc);
    default: {
      const _exhaustive: never = collection;
      return _exhaustive;
    }
  }
}
