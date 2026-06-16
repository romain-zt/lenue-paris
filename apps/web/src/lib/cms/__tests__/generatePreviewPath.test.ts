import { describe, expect, it, vi } from "vitest";
import { generatePreviewPath, getPreviewSiteUrl } from "@/lib/cms/generatePreviewPath";

describe("generatePreviewPath", () => {
  it("uses port 3001 locally when NEXT_PUBLIC_SITE_URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL", "");
    expect(getPreviewSiteUrl()).toBe("http://localhost:3001");
    vi.unstubAllEnvs();
  });

  it("builds home preview for default locale fr", () => {
    vi.stubEnv("PREVIEW_SECRET", "test-secret");
    const url = generatePreviewPath({
      collection: "pages",
      slug: "home",
      req: { locale: "fr" } as never,
    });
    expect(url).toContain("http://localhost:3001/next/preview?");
    expect(url).toContain("path=%2F");
    expect(url).toContain("previewSecret=test-secret");
    expect(url).toContain("collection=pages");
    vi.unstubAllEnvs();
  });

  it("builds product preview with locale and produits segment", () => {
    vi.stubEnv("PREVIEW_SECRET", "test-secret");
    const url = generatePreviewPath({
      collection: "products",
      slug: "robe-camille",
      req: { locale: "ru" } as never,
    });
    expect(url).toContain("collection=products");
    expect(url).toContain("path=%2Fru%2Fproduits%2Frobe-camille");
    vi.unstubAllEnvs();
  });

  it("returns null when slug is empty", () => {
    const url = generatePreviewPath({
      collection: "products",
      slug: "",
      req: { locale: "fr" } as never,
    });
    expect(url).toBeNull();
  });
});
