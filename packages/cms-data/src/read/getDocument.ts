import type { Where } from "payload";
import { assertReadableTarget } from "../allowlists";
import { getCmsClient } from "../client";
import type { ContentLocale } from "../types";
import {
  appendSearchableTextToSnapshot,
  type SearchableSource,
} from "./extractSearchableText";

type GetDocumentParams = {
  collection: string;
  id?: string;
  locale?: ContentLocale;
  isGlobal?: boolean;
  depth?: number;
};

export async function getDocument({
  collection,
  id,
  locale = "fr",
  isGlobal = false,
  depth = 1,
}: GetDocumentParams): Promise<Record<string, unknown> | { error: string }> {
  const access = assertReadableTarget(collection, isGlobal);
  if (!access.ok) return { error: access.error };

  try {
    const payload = await getCmsClient();

    if (isGlobal) {
      const doc = await payload.findGlobal({
        slug: collection as Parameters<typeof payload.findGlobal>[0]["slug"],
        locale,
        overrideAccess: true,
        depth,
      });
      return doc as unknown as Record<string, unknown>;
    }

    if (!id) {
      return { error: "id requis pour les collections" };
    }

    const doc = await payload.findByID({
      collection: collection as Parameters<typeof payload.findByID>[0]["collection"],
      id: parseInt(id, 10),
      locale,
      depth,
      overrideAccess: true,
    });
    return doc as unknown as Record<string, unknown>;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur de lecture" };
  }
}

export async function getDocumentFieldNames(
  params: GetDocumentParams,
): Promise<string[]> {
  const doc = await getDocument({ ...params, depth: 0 });
  if ("error" in doc) return [];
  return Object.keys(doc).filter(
    (k) => !["id", "createdAt", "updatedAt", "globalType"].includes(k),
  );
}

export function buildDocumentSnapshot(
  doc: Record<string, unknown>,
  collectionLabel: string,
  collection?: SearchableSource,
): string {
  const fields = Object.keys(doc).filter(
    (k) => !["id", "createdAt", "updatedAt", "globalType"].includes(k),
  );
  const fieldLines = fields
    .map(
      (f) =>
        `- ${f}: ${JSON.stringify(doc[f])?.slice(0, 120) ?? "null"}`,
    )
    .join("\n");

  const base = `\n\nChamps disponibles sur ${collectionLabel} (utilisez exactement ces noms) :\n${fieldLines}`;

  if (collection) {
    return appendSearchableTextToSnapshot(base, collection, doc);
  }

  return base;
}

export function buildWhereClause(
  query: string | undefined,
  textFields: string[],
  filters?: {
    category?: string;
    inStock?: boolean;
    status?: "published" | "draft";
  },
): Where {
  const clauses: Where[] = [];

  if (query?.trim()) {
    const q = query.trim();
    clauses.push({
      or: textFields.map((field) => ({
        [field]: { contains: q },
      })),
    });
  }

  if (filters?.category) {
    clauses.push({ category: { equals: filters.category } });
  }

  if (filters?.inStock !== undefined) {
    clauses.push({ inStock: { equals: filters.inStock } });
  }

  if (filters?.status === "published") {
    clauses.push({ _status: { equals: "published" } });
  } else if (filters?.status === "draft") {
    clauses.push({ _status: { equals: "draft" } });
  }

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0]!;
  return { and: clauses };
}
