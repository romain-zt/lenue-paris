import { describe, it, expect } from "vitest";
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
    expect(getProductGalleryUrls("robe-margot")).toHaveLength(3);
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
});
