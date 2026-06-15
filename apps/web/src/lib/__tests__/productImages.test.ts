import { describe, it, expect } from "vitest";
import {
  getProductMainImageUrl,
  getProductGalleryUrls,
  PRODUCT_IMAGES,
} from "../productImages";

describe("productImages", () => {
  it("maps known slugs to static /images paths", () => {
    expect(getProductMainImageUrl("robe-camille")).toBe("/images/dress-camille.jpg");
    expect(getProductMainImageUrl("foulard-diane")).toBe("/images/lenue-foulard-floral.jpg");
    expect(getProductMainImageUrl("sac-celeste")).toBe("/images/lenue-sac-champagne.jpg");
  });

  it("falls back to CMS url for unmapped slugs", () => {
    expect(getProductMainImageUrl("unknown", "/api/media/file/x.jpg")).toBe("/api/media/file/x.jpg");
  });

  it("returns gallery urls from mapping", () => {
    expect(getProductGalleryUrls("robe-louise")).toEqual(["/images/PHOTO-2026-06-12-17-30-56.jpg"]);
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
    ];
    for (const slug of slugs) {
      expect(PRODUCT_IMAGES[slug]?.main).toBeTruthy();
      expect(getProductMainImageUrl(slug)).toMatch(/^\/images\//);
    }
  });
});
