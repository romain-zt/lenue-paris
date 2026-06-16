import { describe, expect, it } from "vitest";
import { mapHomePageBlocks, findHeroTagline } from "@/lib/cms/blocks";
import type { Page as PayloadPage } from "@/payload-types";

const heroMedia = {
  id: 1,
  alt: "Hero — Lénue Paris",
  url: "/images/hero.jpg",
  updatedAt: "",
  createdAt: "",
};

const editorialMedia = {
  id: 2,
  alt: "Editorial — Lénue Paris",
  url: "/images/cafe-de-flore.jpg",
  updatedAt: "",
  createdAt: "",
};

const sampleProduct = {
  id: 10,
  title: "Robe Camille",
  slug: "robe-camille",
  category: "dresses" as const,
  price: 290,
  inStock: true,
  mainImage: {
    id: 3,
    alt: "Robe Camille",
    url: "/images/dress-camille.jpg",
    updatedAt: "",
    createdAt: "",
  },
  updatedAt: "",
  createdAt: "",
  _status: "published" as const,
};

describe("mapHomePageBlocks", () => {
  it("maps hero, featured, and editorial blocks from Payload shape", () => {
    const blocks: PayloadPage["blocks"] = [
      {
        blockType: "hero",
        season: "Printemps · Été 2026",
        tagline: "Pour les moments que vous voulez garder.",
        ctaLabel: "Découvrir",
        ctaLink: "/catalogue",
        heroImage: heroMedia,
      },
      {
        blockType: "featuredProducts",
        title: "Notre sélection",
        sourceType: "manual",
        viewCollectionLabel: "Voir la collection →",
        products: [sampleProduct],
      },
      {
        blockType: "editorialStrip",
        label: "L'esprit Lénue",
        headline: "Lénue, ce n'est pas s'habiller.",
        subline: "C'est se sentir soi-même.",
        body: "Chaque pièce est sélectionnée pour sa matière.",
        ctaLabel: "Explorer",
        ctaLink: "/catalogue",
        image: editorialMedia,
      },
    ];

    const mapped = mapHomePageBlocks(blocks);
    expect(mapped).toHaveLength(3);
    expect(mapped[0]?.blockType).toBe("hero");
    expect(mapped[1]?.blockType).toBe("featuredProducts");
    if (mapped[1]?.blockType === "featuredProducts") {
      expect(mapped[1].props.products).toHaveLength(1);
      expect(mapped[1].props.products[0]?.slug).toBe("robe-camille");
    }
    expect(mapped[2]?.blockType).toBe("editorialStrip");
  });

  it("returns empty array when blocks are missing or unresolvable", () => {
    expect(mapHomePageBlocks(null)).toEqual([]);
    expect(mapHomePageBlocks([])).toEqual([]);
    expect(
      mapHomePageBlocks([
        {
          blockType: "hero",
          season: "Test",
          tagline: "Test",
          ctaLabel: "Test",
          ctaLink: "/catalogue",
          heroImage: 99,
        },
      ]),
    ).toEqual([]);
  });

  it("extracts hero tagline for metadata", () => {
    const mapped = mapHomePageBlocks([
      {
        blockType: "hero",
        season: "Saison",
        tagline: "Tagline CMS",
        ctaLabel: "CTA",
        ctaLink: "/catalogue",
        heroImage: heroMedia,
      },
    ]);
    expect(findHeroTagline(mapped)).toBe("Tagline CMS");
  });
});
