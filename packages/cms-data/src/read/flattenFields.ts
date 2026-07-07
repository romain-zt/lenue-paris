import type { Field } from "payload";
import type { FieldManifest } from "../types";

function flattenFields(fields: Field[]): FieldManifest[] {
  const result: FieldManifest[] = [];

  for (const field of fields) {
    if (field.type === "tabs" && "tabs" in field) {
      for (const tab of field.tabs) {
        if ("fields" in tab && tab.fields) {
          result.push(...flattenFields(tab.fields));
        }
      }
      continue;
    }

    if (field.type === "collapsible" && "fields" in field) {
      result.push(...flattenFields(field.fields));
      continue;
    }

    if (field.type === "row" && "fields" in field) {
      result.push(...flattenFields(field.fields));
      continue;
    }

    if (!("name" in field) || !field.name) continue;

    const entry: FieldManifest = {
      name: field.name,
      type: field.type,
      localized: "localized" in field ? Boolean(field.localized) : undefined,
      required: "required" in field ? Boolean(field.required) : undefined,
    };

    if (
      (field.type === "group" || field.type === "array") &&
      "fields" in field &&
      field.fields
    ) {
      entry.fields = flattenFields(field.fields);
    }

    if (field.type === "blocks" && "blocks" in field && field.blocks) {
      entry.fields = field.blocks.map((block) => ({
        name: block.slug,
        type: "block",
        fields: flattenFields(block.fields),
      }));
    }

    result.push(entry);
  }

  return result;
}

export { flattenFields };
