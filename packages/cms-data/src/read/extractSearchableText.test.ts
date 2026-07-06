import { describe, expect, it } from "vitest";
import {
  buildTextSnippet,
  extractDocumentText,
  extractPageText,
  textMatchesQuery,
} from "./extractSearchableText";

describe("extractPageText", () => {
  it("extracts title, body and block fields", () => {
    const text = extractPageText({
      title: "Accueil",
      slug: "home",
      blocks: [
        {
          blockType: "hero",
          season: "Été 2026",
          tagline: "L'élégance parisienne",
          ctaLabel: "Découvrir",
          ctaLink: "/catalogue",
        },
        {
          blockType: "editorialStrip",
          label: "Savoir-faire",
          headline: "Soie italienne",
          subline: "Tissée à la main",
          body: "Chaque pièce est unique.",
          ctaLabel: "En savoir plus",
          ctaLink: "/a-propos",
        },
      ],
    });

    expect(text).toContain("Accueil");
    expect(text).toContain("L'élégance parisienne");
    expect(text).toContain("Soie italienne");
    expect(text).toContain("Chaque pièce est unique.");
  });

  it("ignores empty or unknown blocks", () => {
    const text = extractPageText({
      title: "Contact",
      blocks: [{ blockType: "unknown", foo: "bar" }],
    });
    expect(text).toBe("Contact");
  });
});

describe("extractDocumentText", () => {
  it("extracts product fields including stock hint", () => {
    const text = extractDocumentText("products", {
      title: "Robe Soie",
      slug: "robe-soie",
      description: "Robe longue en soie",
      category: "dresses",
      price: 890,
      inStock: false,
    });
    expect(text).toContain("Robe Soie");
    expect(text).toContain("890");
    expect(text).toContain("rupture de stock");
  });
});

describe("textMatchesQuery", () => {
  it("matches case-insensitively", () => {
    expect(textMatchesQuery("Soie italienne", "soie")).toBe(true);
    expect(textMatchesQuery("Coton", "soie")).toBe(false);
  });
});

describe("buildTextSnippet", () => {
  it("centers snippet around the query match", () => {
    const snippet = buildTextSnippet(
      "Un long texte sur la livraison internationale et les délais",
      "internationale",
    );
    expect(snippet).toContain("internationale");
  });
});
