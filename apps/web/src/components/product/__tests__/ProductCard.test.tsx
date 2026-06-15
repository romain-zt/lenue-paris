import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductCard } from "../ProductCard";
import { WithIntl } from "@/test-utils/with-intl";
import type { Product } from "@/types/product";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

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
    render(<WithIntl><ProductCard product={mockProduct} /></WithIntl>);
    expect(screen.getByText("Robe Blanche")).toBeDefined();
  });

  it("renders formatted EUR price", () => {
    render(<WithIntl><ProductCard product={mockProduct} /></WithIntl>);
    expect(screen.getByText(/290/)).toBeDefined();
  });

  it("links to /produits/[slug]", () => {
    render(<WithIntl><ProductCard product={mockProduct} /></WithIntl>);
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/produits/robe-blanche");
  });
});
