import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "../ProductCard";
import type { Product } from "@/types/product";

const mockProduct: Product = {
  id: "1",
  title: "Robe Blanche",
  slug: "robe-blanche",
  category: "dresses",
  price: 290,
  mainImage: { id: "img1", url: "/robe.jpg", alt: "Robe blanche" },
};

describe("ProductCard", () => {
  it("renders product title", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("Robe Blanche")).toBeDefined();
  });

  it("renders formatted EUR price", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText(/290/)).toBeDefined();
  });

  it("links to /produits/[slug]", () => {
    render(<ProductCard product={mockProduct} />);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/produits/robe-blanche");
  });
});
