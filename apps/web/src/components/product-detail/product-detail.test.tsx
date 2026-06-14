import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProductDetail } from "@repo/product-detail";
import { ProductDetailView } from "./ProductDetailView";
import { ProductGallery } from "./ProductGallery";

const product: ProductDetail = {
  id: "1",
  slug: "robe-lin",
  name: "Robe en lin",
  description: "Une robe légère.",
  price: 320,
  currency: "EUR",
  category: "robe",
  gallery: [
    {
      id: "img-1",
      url: "https://cdn.example/robe-1.jpg",
      alt: "Robe en lin",
    },
    {
      id: "img-2",
      url: "https://cdn.example/robe-2.jpg",
      alt: "Robe en lin",
    },
  ],
  variantPickers: null,
  orderHref: "/fr/order/robe-lin",
  catalogueHref: "/fr/catalogue",
};

describe("ProductGallery", () => {
  it("lets the buyer browse through multiple images", () => {
    render(
      <ProductGallery gallery={product.gallery} galleryLabel="Galerie photos" />,
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);

    fireEvent.click(tabs[1]!);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });
});

describe("ProductDetailView", () => {
  it("renders localized copy, price, and order CTA", () => {
    render(<ProductDetailView product={product} locale="fr" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Robe en lin",
    );
    expect(screen.getByText("Une robe légère.")).toBeInTheDocument();
    expect(screen.getByText("320 €")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Commander" })).toHaveAttribute(
      "href",
      "/fr/order/robe-lin",
    );
  });
});
