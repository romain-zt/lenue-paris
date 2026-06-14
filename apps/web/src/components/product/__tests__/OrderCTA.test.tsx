import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderCTA } from "../OrderCTA";
import type { Product } from "@/types/product";

const dressProduct: Product = {
  id: "1",
  title: "Robe en soie",
  slug: "robe-en-soie",
  category: "dresses",
  price: 390,
  mainImage: { id: "img1", url: "/robe.jpg", alt: "Robe en soie" },
};

const bagProduct: Product = {
  id: "2",
  title: "Sac Cuir",
  slug: "sac-cuir",
  category: "bags",
  price: 195,
  mainImage: { id: "img2", url: "/sac.jpg", alt: "Sac Cuir" },
};

describe("OrderCTA — dress", () => {
  it("shows length and size selectors for dresses", () => {
    render(<OrderCTA product={dressProduct} />);
    expect(screen.getByText("Longueur")).toBeDefined();
    expect(screen.getByText("Taille")).toBeDefined();
  });

  it("shows selection-required warning when no variant chosen", () => {
    render(<OrderCTA product={dressProduct} />);
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("disables the order button when no variant selected", () => {
    render(<OrderCTA product={dressProduct} />);
    const btn = screen.getByRole("button", { name: /Commander/i });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("OrderCTA — bag / scarf", () => {
  it("shows no length or size selectors for bags", () => {
    render(<OrderCTA product={bagProduct} />);
    expect(screen.queryByText("Longueur")).toBeNull();
    expect(screen.queryByText("Taille")).toBeNull();
  });

  it("CTA is enabled immediately for bags", () => {
    render(<OrderCTA product={bagProduct} />);
    const btn = screen.getByRole("button", { name: /Commander/i });
    expect(btn.getAttribute("aria-disabled")).toBe("false");
  });
});
