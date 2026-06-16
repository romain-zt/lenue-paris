import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductGrid } from "../ProductGrid";
import { WithIntl } from "@/test-utils/with-intl";
import type { Product } from "@/types/product";

vi.mock("@/lib/selection/SelectionProvider", () => ({
  useSelection: () => ({
    items: [],
    count: 0,
    isFull: false,
    isInSelection: vi.fn().mockReturnValue(false),
    addItem: vi.fn().mockReturnValue(true),
    removeItem: vi.fn(),
    clear: vi.fn(),
    isPanelOpen: false,
    openPanel: vi.fn(),
    closePanel: vi.fn(),
  }),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

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
    render(<WithIntl><ProductGrid products={mockProducts} /></WithIntl>);
    expect(screen.getByText("Robe Blanche")).toBeDefined();
    expect(screen.getByText("Sac Noir")).toBeDefined();
  });

  it("renders empty state when no products", () => {
    render(<WithIntl><ProductGrid products={[]} emptyMessage="Rien ici." /></WithIntl>);
    expect(screen.getByText("Rien ici.")).toBeDefined();
  });

  it("renders error state when error prop set", () => {
    render(<WithIntl><ProductGrid products={[]} error="fetch_failed" /></WithIntl>);
    expect(screen.getByRole("alert")).toBeDefined();
    expect(screen.getByText(/Impossible de charger/)).toBeDefined();
  });

  it("renders skeletons when loading", () => {
    render(<WithIntl><ProductGrid products={[]} isLoading={true} /></WithIntl>);
    expect(screen.getByLabelText("Chargement du catalogue")).toBeDefined();
  });
});
