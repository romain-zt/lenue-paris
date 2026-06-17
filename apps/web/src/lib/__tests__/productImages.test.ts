import { describe, it, expect } from "vitest";
import { PUBLIC_DRESS_SLUGS } from "../catalogue/storefrontCatalogue";
import {
  getProductMainImageUrl,
  getProductGalleryUrls,
  PRODUCT_IMAGES,
} from "../productImages";

describe("productImages", () => {
  it("maps known slugs to static /images paths", () => {
    expect(getProductMainImageUrl("robe-camille")).toBe("/images/dress-camille.jpg");
    expect(getProductMainImageUrl("foulard-diane")).toBe("/images/PHOTO-2026-06-12-23-29-2.jpg");
    expect(getProductMainImageUrl("sac-celeste")).toBe("/images/PHOTO-2026-06-12-23-17-32.jpg");
  });

  it("falls back to CMS url for unmapped slugs", () => {
    expect(getProductMainImageUrl("unknown", "/api/media/file/x.jpg")).toBe("/api/media/file/x.jpg");
  });

  it("returns gallery urls from mapping", () => {
    expect(getProductGalleryUrls("robe-louise")).toEqual([
      "/images/PHOTO-2026-06-12-17-30-56.jpg",
      "/images/PHOTO-2026-06-12-18-07-47.jpg",
      "/images/PHOTO-2026-06-13-08-45-41.jpg",
    ]);
    expect(getProductGalleryUrls("robe-camille")).toHaveLength(3);
    expect(getProductGalleryUrls("robe-margot")).toHaveLength(2);
  });

  it("covers all seeded product slugs", () => {
    const slugs = [
      "robe-camille",
      "robe-louise",
      "robe-margot",
      "robe-heloise",
      "sac-juliette",
      "sac-amelie",
      "sac-celeste",
      "sac-victoire",
      "foulard-diane",
      "foulard-aurore",
      "foulard-claire",
      "foulard-iris",
      "look-elise-edition-limitee",
    ];
    for (const slug of slugs) {
      expect(PRODUCT_IMAGES[slug]?.main).toBeTruthy();
      expect(getProductMainImageUrl(slug)).toMatch(/^\/images\//);
    }
  });

  it("signature dresses each have 2-3 unique PHOTO-* gallery entries (slice AC)", () => {
    for (const slug of PUBLIC_DRESS_SLUGS) {
      const gallery = PRODUCT_IMAGES[slug]?.gallery ?? [];
      expect(gallery.length, `${slug} gallery length`).toBeGreaterThanOrEqual(2);
      expect(gallery.length, `${slug} gallery length`).toBeLessThanOrEqual(3);
      for (const filename of gallery) {
        expect(filename, `${slug} gallery entry should be a PHOTO-* file`).toMatch(/^PHOTO-/);
      }
    }
  });

  it("signature dresses do not share PHOTO-* gallery images", () => {
    const photoUsage = new Map<string, string[]>();

    for (const slug of PUBLIC_DRESS_SLUGS) {
      const gallery = PRODUCT_IMAGES[slug]?.gallery ?? [];
      for (const filename of gallery) {
        if (!filename.startsWith("PHOTO-")) continue;
        const dresses = photoUsage.get(filename) ?? [];
        dresses.push(slug);
        photoUsage.set(filename, dresses);
      }
    }

    const collisions = [...photoUsage.entries()].filter(([, dresses]) => dresses.length > 1);
    expect(collisions, "PHOTO-* gallery images must be unique per signature dress").toEqual([]);
  });
});
