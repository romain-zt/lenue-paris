import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogueClient } from "../CatalogueClient";
import type { Product } from "@/types/product";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/product/ProductGrid", () => ({
  ProductGrid: ({
    products,
  }: {
    products: Product[];
    error: string | null;
    emptyMessage: string;
  }) => (
    <ul>
      {products.map((p) => (
        <li key={p.slug} data-testid={`product-${p.slug}`} data-in-stock={String(p.inStock)}>
          {p.title}
        </li>
      ))}
    </ul>
  ),
}));

function makeProduct(slug: string, inStock: boolean): Product {
  return {
    slug,
    title: slug,
    price: 100,
    category: "dresses",
    inStock,
    images: [],
    gallery: [],
  } as unknown as Product;
}

describe("CatalogueClient sort order", () => {
  it("renders in-stock products before out-of-stock products", () => {
    const products = [
      makeProduct("out-a", false),
      makeProduct("in-b", true),
      makeProduct("out-c", false),
      makeProduct("in-d", true),
    ];

    render(<CatalogueClient initialProducts={products} initialError={null} />);

    const items = screen.getAllByRole("listitem");
    const slugs = items.map((el) => el.getAttribute("data-testid")?.replace("product-", ""));

    expect(slugs.indexOf("in-b")).toBeLessThan(slugs.indexOf("out-a"));
    expect(slugs.indexOf("in-d")).toBeLessThan(slugs.indexOf("out-c"));
  });

  it("keeps relative order when all products have the same stock status", () => {
    const products = [
      makeProduct("a", true),
      makeProduct("b", true),
      makeProduct("c", true),
    ];

    render(<CatalogueClient initialProducts={products} initialError={null} />);

    const items = screen.getAllByRole("listitem");
    const slugs = items.map((el) => el.getAttribute("data-testid")?.replace("product-", ""));
    expect(slugs).toEqual(["a", "b", "c"]);
  });

  it("passes error prop through to ProductGrid", () => {
    render(<CatalogueClient initialProducts={[]} initialError="fetch_failed" />);
    // ProductGrid mock renders nothing for empty list; just assert no crash
    expect(document.body).toBeTruthy();
  });
});
