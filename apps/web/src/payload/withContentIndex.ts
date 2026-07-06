import type { CollectionConfig, GlobalConfig } from "payload";
import {
  createCollectionDeleteHook,
  createCollectionIndexHook,
  createGlobalIndexHook,
} from "@repo/cms-data/indexing";

type IndexableCollection = "pages" | "products" | "collections" | "media";
type IndexableGlobal = "site-settings" | "design-tokens";

export function withCollectionContentIndex(
  base: CollectionConfig,
  collection: IndexableCollection,
): CollectionConfig {
  const afterChange = base.hooks?.afterChange ?? [];
  const afterDelete = base.hooks?.afterDelete ?? [];

  return {
    ...base,
    hooks: {
      ...base.hooks,
      afterChange: [...afterChange, createCollectionIndexHook(collection)],
      afterDelete: [...afterDelete, createCollectionDeleteHook(collection)],
    },
  };
}

export function withGlobalContentIndex(
  base: GlobalConfig,
  slug: IndexableGlobal,
): GlobalConfig {
  const afterChange = base.hooks?.afterChange ?? [];

  return {
    ...base,
    hooks: {
      ...base.hooks,
      afterChange: [...afterChange, createGlobalIndexHook(slug)],
    },
  };
}
