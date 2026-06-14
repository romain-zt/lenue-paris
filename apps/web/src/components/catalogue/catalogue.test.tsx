import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ProductCard } from "@repo/catalog";
import {
  CatalogueEmptyState,
  CatalogueErrorState,
} from "./CatalogueEmptyState";
import { CatalogueGrid } from "./CatalogueGrid";
import { CategoryFilterChips } from "./CategoryFilterChips";

const sampleProduct: ProductCard = {
  id: "1",
  slug: "robe-lin",
  name: "Robe en lin",
  price: 320,
  currency: "EUR",
  category: "robe",
  thumbnailUrl: "https://cdn.example/robe.jpg",
  detailHref: "/fr/products/robe-lin",
};

describe("CategoryFilterChips", () => {
  it("renders all category links with active chip marked", () => {
    render(<CategoryFilterChips locale="fr" activeCategory="dress" />);

    expect(screen.getByRole("navigation", { name: "Catalogue" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Robes" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Sacs" })).toHaveAttribute(
      "href",
      "/fr/catalogue?category=bag",
    );
  });
});

describe("CatalogueGrid", () => {
  it("renders product cards linking to detail routes", () => {
    render(<CatalogueGrid products={[sampleProduct]} locale="fr" />);

    const link = screen.getByRole("link", { name: /Robe en lin/i });
    expect(link).toHaveAttribute("href", "/fr/products/robe-lin");
    expect(screen.getByText("320 €")).toBeTruthy();
  });
});

describe("CatalogueEmptyState", () => {
  it("shows category-specific empty copy with view-all link when filtered", () => {
    render(<CatalogueEmptyState locale="en" category="bag" />);

    expect(
      screen.getByText("No pieces in this category yet."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "View all pieces" })).toHaveAttribute(
      "href",
      "/en/catalogue",
    );
  });

  it("shows catalogue-wide empty copy when unfiltered", () => {
    render(<CatalogueEmptyState locale="fr" category="all" />);

    expect(
      screen.getByText("La collection arrive bientôt. Revenez très prochainement."),
    ).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Voir toute la collection" })).toBeNull();
  });
});

describe("CatalogueErrorState", () => {
  it("exposes an alert role with localized error copy", () => {
    render(<CatalogueErrorState locale="fr" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Le catalogue est momentanément indisponible. Veuillez réessayer.",
    );
  });
});
