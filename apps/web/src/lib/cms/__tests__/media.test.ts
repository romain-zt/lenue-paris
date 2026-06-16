import { describe, expect, it } from "vitest";
import {
  HERO_PUBLIC_FALLBACK,
  resolveHeroImageUrl,
  resolveMediaUrl,
  rewritePayloadMediaUrl,
} from "@/lib/cms/media";

describe("rewritePayloadMediaUrl", () => {
  it("rewrites Payload API media paths to public/images", () => {
    expect(rewritePayloadMediaUrl("/api/media/file/hero.jpg")).toBe("/images/hero.jpg");
    expect(rewritePayloadMediaUrl("/images/hero.jpg")).toBe("/images/hero.jpg");
  });

  it("rewrites video API paths to public/videos", () => {
    expect(rewritePayloadMediaUrl("/api/media/file/hero-loop.mp4")).toBe("/videos/hero-loop.mp4");
  });
});

describe("resolveMediaUrl", () => {
  it("prefers public path when Payload url is /api/media/file/*", () => {
    expect(
      resolveMediaUrl({
        id: 1,
        alt: "Hero",
        url: "/api/media/file/hero.jpg",
        updatedAt: "",
        createdAt: "",
      }),
    ).toBe("/images/hero.jpg");
  });

  it("uses filename when url is missing", () => {
    expect(
      resolveMediaUrl({
        id: 1,
        alt: "Hero",
        filename: "hero.jpg",
        updatedAt: "",
        createdAt: "",
      }),
    ).toBe("/images/hero.jpg");
  });
});

describe("resolveHeroImageUrl", () => {
  it("falls back to public hero when media is missing", () => {
    expect(resolveHeroImageUrl(null)).toBe(HERO_PUBLIC_FALLBACK);
    expect(resolveHeroImageUrl(undefined)).toBe(HERO_PUBLIC_FALLBACK);
  });
});
