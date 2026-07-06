import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from "payload";
import type { SearchableSource } from "../read/extractSearchableText";
import {
  deleteDocumentIndex,
  indexDocument,
  indexGlobal,
} from "./indexContent";

function logIndexError(scope: string, err: unknown): void {
  console.error(`[content-index] ${scope}:`, err instanceof Error ? err.message : err);
}

export function createCollectionIndexHook(
  collection: "pages" | "products" | "collections" | "media",
): CollectionAfterChangeHook {
  return async ({ doc }) => {
    const docId = String((doc as { id: number }).id);
    try {
      await indexDocument({ collection, docId });
    } catch (err) {
      logIndexError(`${collection}/${docId}`, err);
    }
  };
}

export function createCollectionDeleteHook(
  collection: string,
): CollectionAfterDeleteHook {
  return async ({ doc }) => {
    const docId = String((doc as { id: number }).id);
    try {
      await deleteDocumentIndex(collection, docId);
    } catch (err) {
      logIndexError(`delete ${collection}/${docId}`, err);
    }
  };
}

export function createGlobalIndexHook(
  slug: "site-settings" | "design-tokens",
): GlobalAfterChangeHook {
  return async () => {
    try {
      await indexGlobal({ slug });
    } catch (err) {
      logIndexError(`global/${slug}`, err);
    }
  };
}

export type { SearchableSource };
