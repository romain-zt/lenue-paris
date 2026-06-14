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

const dressWithPickers: ProductDetail = {
  ...product,
  variantPickers: {
    lengthOptions: ["longer", "shorter"],
    sizeOptions: ["XS", "S", "M", "L", "XL"],
  },
};

const bagProduct: ProductDetail = {
  ...product,
  slug: "sac-cuir",
  name: "Sac en cuir",
  category: "sac",
  orderHref: "/fr/order/sac-cuir",
  variantPickers: null,
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

  it("shows dress variant pickers with a disabled order CTA until both are chosen", () => {
    render(<ProductDetailView product={dressWithPickers} locale="fr" />);

    expect(screen.getByText("Longueur")).toBeInTheDocument();
    expect(screen.getByText("Taille")).toBeInTheDocument();
    expect(
      screen.getByText("Choisissez une longueur et une taille pour continuer."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Commander" })).not.toBeInTheDocument();
    expect(screen.getByText("Commander")).toHaveAttribute("aria-disabled", "true");
  });

  it("highlights the missing picker and keeps the CTA disabled on partial selection", () => {
    render(<ProductDetailView product={dressWithPickers} locale="fr" />);

    fireEvent.click(screen.getByRole("button", { name: "Plus long" }));

    expect(screen.getByText("Sélectionnez une taille.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Commander" })).not.toBeInTheDocument();
  });

  it("enables the order link with variant query params when selection is complete", () => {
    render(<ProductDetailView product={dressWithPickers} locale="fr" />);

    fireEvent.click(screen.getByRole("button", { name: "Plus long" }));
    fireEvent.click(screen.getByRole("button", { name: "M" }));

    expect(screen.getByRole("link", { name: "Commander" })).toHaveAttribute(
      "href",
      "/fr/order/robe-lin?length=longer&size=M",
    );
  });

  it("renders localized picker labels for the active locale", () => {
    render(<ProductDetailView product={dressWithPickers} locale="en" />);

    expect(screen.getByText("Length")).toBeInTheDocument();
    expect(screen.getByText("Size")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Longer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "M" })).toBeInTheDocument();
  });

  it("does not show variant pickers for bags", () => {
    render(<ProductDetailView product={bagProduct} locale="fr" />);

    expect(screen.queryByText("Longueur")).not.toBeInTheDocument();
    expect(screen.queryByText("Taille")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Commander" })).toHaveAttribute(
      "href",
      "/fr/order/sac-cuir",
    );
  });
});
