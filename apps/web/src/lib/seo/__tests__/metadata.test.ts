import { describe, expect, it, vi } from "vitest";
import { absoluteUrl, buildPageMetadata, localePath } from "@/lib/seo/metadata";

describe("localePath", () => {
  it("omits prefix for default locale fr", () => {
    expect(localePath("fr")).toBe("/");
    expect(localePath("fr", "/catalogue")).toBe("/catalogue");
  });

  it("prefixes non-default locales", () => {
    expect(localePath("en")).toBe("/en");
    expect(localePath("ru", "/catalogue")).toBe("/ru/catalogue");
  });
});

describe("buildPageMetadata", () => {
  it("includes Open Graph and Twitter images for WhatsApp previews", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.lenue.paris");

    const meta = buildPageMetadata({
      title: "Lénue Paris",
      description: "Pour les moments que vous voulez garder.",
      locale: "fr",
      pathname: "",
      imagePath: "/images/hero.jpg",
    });

    expect(meta.openGraph?.images).toEqual([
      { url: "https://www.lenue.paris/images/hero.jpg", alt: "Lénue Paris" },
    ]);
    expect(meta.twitter?.images).toEqual(["https://www.lenue.paris/images/hero.jpg"]);
    expect(meta.openGraph?.url).toBe("https://www.lenue.paris/");
    expect(meta.metadataBase?.toString()).toBe("https://www.lenue.paris/");

    vi.unstubAllEnvs();
  });
});

describe("absoluteUrl", () => {
  it("resolves relative paths against site url", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.lenue.paris");
    expect(absoluteUrl("/images/hero.jpg")).toBe("https://www.lenue.paris/images/hero.jpg");
    vi.unstubAllEnvs();
  });
});
