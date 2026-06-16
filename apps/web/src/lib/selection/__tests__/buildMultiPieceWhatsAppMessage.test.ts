import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildMultiPieceWhatsAppMessage } from "../buildMultiPieceWhatsAppMessage";
import type { SelectionItem } from "../types";

vi.mock("@/lib/seo/metadata", () => ({
  getSiteUrl: () => "https://www.lenue.paris",
  localePath: (locale: string, pathname: string) =>
    locale === "fr" ? pathname : `/${locale}${pathname}`,
}));

const frLabels = {
  intro: "Bonjour — je souhaite ces pièces Lénue :",
  pieceLine: ({ title, url, priceLabel, details }: { title: string; url: string; priceLabel: string; details?: string }) =>
    details
      ? `• ${title} — ${url} (${details}, ${priceLabel})`
      : `• ${title} — ${url} (${priceLabel})`,
  formatSize: (size: string) => `Taille ${size}`,
  formatLength: (length: string) => `Longueur ${length}`,
};

describe("buildMultiPieceWhatsAppMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds a tri-piece message with product URLs for fr locale", () => {
    const items: SelectionItem[] = [
      { slug: "robe-camille", title: "Robe Camille", price: 490 },
      { slug: "sac-celeste", title: "Sac Céleste", price: 310 },
    ];

    const message = buildMultiPieceWhatsAppMessage(items, "fr", frLabels);

    expect(message).toContain("Bonjour — je souhaite ces pièces Lénue :");
    expect(message).toContain("Robe Camille — https://www.lenue.paris/produits/robe-camille (490 €)");
    expect(message).toContain("Sac Céleste — https://www.lenue.paris/produits/sac-celeste (310 €)");
  });

  it("includes size and length details when present", () => {
    const items: SelectionItem[] = [
      {
        slug: "robe-camille",
        title: "Robe Camille",
        price: 490,
        size: "M",
        length: "longer",
      },
    ];

    const message = buildMultiPieceWhatsAppMessage(items, "fr", {
      ...frLabels,
      formatLength: () => "Version longue",
    });

    expect(message).toContain("Taille M");
    expect(message).toContain("Version longue");
  });

  it("prefixes non-default locale in product URLs", () => {
    const items: SelectionItem[] = [{ slug: "robe-camille", title: "Robe Camille", price: 490 }];

    const message = buildMultiPieceWhatsAppMessage(items, "ru", frLabels);

    expect(message).toContain("https://www.lenue.paris/ru/produits/robe-camille");
  });
});
