import {
  Collections,
  Media,
  Orders,
  Pages,
  Products,
  Users,
} from "@repo/payload-schema/collections";
import { DesignTokens, SiteSettings } from "@repo/payload-schema/globals";
import type { SchemaManifest } from "../types";
import { flattenFields } from "./flattenFields";

const AI_READABLE_COLLECTIONS = [
  Pages,
  Products,
  Collections,
  Orders,
  Media,
  Users,
] as const;

const AI_GLOBALS = [SiteSettings, DesignTokens] as const;

export function getSchemaManifest(): SchemaManifest {
  return {
    collections: AI_READABLE_COLLECTIONS.map((collection) => ({
      slug: collection.slug,
      fields: flattenFields(collection.fields),
    })),
    globals: AI_GLOBALS.map((global) => ({
      slug: global.slug,
      fields: flattenFields(global.fields),
    })),
  };
}

export function formatSchemaManifest(manifest: SchemaManifest): string {
  const lines: string[] = ["## Collections"];

  for (const collection of manifest.collections) {
    lines.push(`\n### ${collection.slug}`);
    lines.push(...formatFields(collection.fields, 0));
  }

  lines.push("\n## Globals");
  for (const global of manifest.globals) {
    lines.push(`\n### ${global.slug}`);
    lines.push(...formatFields(global.fields, 0));
  }

  return lines.join("\n");
}

function formatFields(fields: SchemaManifest["collections"][0]["fields"], depth: number): string[] {
  const indent = "  ".repeat(depth);
  const lines: string[] = [];

  for (const field of fields) {
    const flags = [
      field.localized ? "localisé" : null,
      field.required ? "requis" : null,
    ]
      .filter(Boolean)
      .join(", ");
    const suffix = flags ? ` (${flags})` : "";
    lines.push(`${indent}- ${field.name}: ${field.type}${suffix}`);
    if (field.fields?.length) {
      lines.push(...formatFields(field.fields, depth + 1));
    }
  }

  return lines;
}
