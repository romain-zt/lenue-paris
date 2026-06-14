import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGrid } from "../ProductGrid";
import type { Product } from "@/types/product";

const mockProducts: Product[] = [
  {
    id: "1",
    title: "Robe Blanche",
    slug: "robe-blanche",
    category: "dresses",
    price: 290,
    mainImage: { id: "img1", url: "/robe.jpg", alt: "Robe blanche" },
  },
  {
    id: "2",
    title: "Sac Noir",
    slug: "sac-noir",
    category: "bags",
    price: 450,
    mainImage: { id: "img2", url: "/sac.jpg", alt: "Sac noir" },
  },
];

describe("ProductGrid", () => {
  it("renders all products", () => {
    render(<ProductGrid products={mockProducts} />);
    expect(screen.getByText("Robe Blanche")).toBeDefined();
    expect(screen.getByText("Sac Noir")).toBeDefined();
  });

  it("renders empty state when no products", () => {
    render(<ProductGrid products={[]} emptyMessage="Rien ici." />);
    expect(screen.getByText("Rien ici.")).toBeDefined();
  });

  it("renders error state when error prop set", () => {
    render(<ProductGrid products={[]} error="fetch_failed" />);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/Impossible de charger/)).toBeDefined();
  });

  it("renders skeletons when loading", () => {
    render(<ProductGrid products={[]} isLoading={true} />);
    expect(screen.getByLabelText("Chargement du catalogue")).toBeDefined();
  });
});
