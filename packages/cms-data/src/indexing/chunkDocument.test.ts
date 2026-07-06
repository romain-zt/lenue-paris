import { describe, expect, it } from "vitest";
import { extractDocumentChunks } from "./chunkDocument";

describe("extractDocumentChunks", () => {
  it("creates one chunk per page block field", () => {
    const chunks = extractDocumentChunks("pages", {
      title: "Accueil",
      blocks: [
        {
          blockType: "editorialStrip",
          headline: "Soie italienne",
          body: "Un long texte sur le savoir-faire artisanal.",
        },
      ],
    });

    const paths = chunks.map((chunk) => chunk.fieldPath);
    expect(paths).toContain("title");
    expect(paths).toContain("blocks.0.editorialStrip.headline");
    expect(paths).toContain("blocks.0.editorialStrip.body");
  });

  it("splits very long body text into multiple chunks", () => {
    const longBody = "a".repeat(1200);
    const chunks = extractDocumentChunks("pages", { body: longBody });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.chunkIndex).toBe(0);
    expect(chunks[1]?.chunkIndex).toBe(1);
  });
});
