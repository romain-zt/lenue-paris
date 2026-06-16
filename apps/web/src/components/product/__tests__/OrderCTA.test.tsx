import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OrderCTA } from "../OrderCTA";
import { WithIntl } from "@/test-utils/with-intl";
import type { Product } from "@/types/product";

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/",
}));

const mockAddItem = vi.fn().mockReturnValue(true);
const mockOpenPanel = vi.fn();
let mockIsInSelection = vi.fn().mockReturnValue(false);

const mockSelection = {
  items: [],
  count: 0,
  isFull: false,
  isInSelection: mockIsInSelection,
  addItem: mockAddItem,
  removeItem: vi.fn(),
  clear: vi.fn(),
  isPanelOpen: false,
  openPanel: mockOpenPanel,
  closePanel: vi.fn(),
};

vi.mock("@/lib/selection/SelectionProvider", () => ({
  useSelection: () => mockSelection,
}));

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

function selectDressVariants() {
  fireEvent.click(screen.getByText("Version longue"));
  fireEvent.click(screen.getByRole("button", { name: "M" }));
}

describe("OrderCTA — dress", () => {
  beforeEach(() => {
    mockIsInSelection = vi.fn().mockReturnValue(false);
    mockSelection.isInSelection = mockIsInSelection;
    mockAddItem.mockClear();
    mockOpenPanel.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders length and size selectors", () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    expect(screen.getByText("Longueur")).toBeDefined();
    expect(screen.getByText("Taille")).toBeDefined();
  });

  it("shows variant-required alert when no variant chosen", () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("button is disabled when no variant selected", () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    const btn = screen.getByRole("button", { name: /Ajouter à ma sélection/i });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });

  it("button enabled after length + size selected", () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    selectDressVariants();
    const btn = screen.getByRole("button", { name: /Ajouter à ma sélection/i });
    expect(btn.getAttribute("aria-disabled")).toBe("false");
  });

  it('clicking "Ajouter" calls addItem with slug, title, price, length, size and openPanel', () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    selectDressVariants();
    fireEvent.click(screen.getByRole("button", { name: /Ajouter à ma sélection/i }));

    expect(mockAddItem).toHaveBeenCalledWith({
      slug: "robe-en-soie",
      title: "Robe en soie",
      price: 390,
      length: "longer",
      size: "M",
    });
    expect(mockOpenPanel).toHaveBeenCalled();
  });
});

describe("OrderCTA — bag/scarf", () => {
  beforeEach(() => {
    mockIsInSelection = vi.fn().mockReturnValue(false);
    mockSelection.isInSelection = mockIsInSelection;
    mockAddItem.mockClear();
    mockOpenPanel.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no variant selectors shown", () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    expect(screen.queryByText("Longueur")).toBeNull();
    expect(screen.queryByText("Taille")).toBeNull();
  });

  it("button is enabled immediately (not already in selection)", () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    const btn = screen.getByRole("button", { name: /Ajouter à ma sélection/i });
    expect(btn.getAttribute("aria-disabled")).toBe("false");
  });

  it('clicking "Ajouter" calls addItem with slug, title, price, length null, size null and openPanel', () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fireEvent.click(screen.getByRole("button", { name: /Ajouter à ma sélection/i }));

    expect(mockAddItem).toHaveBeenCalledWith({
      slug: "sac-cuir",
      title: "Sac Cuir",
      price: 195,
      length: null,
      size: null,
    });
    expect(mockOpenPanel).toHaveBeenCalled();
  });
});

describe("OrderCTA — already in selection", () => {
  beforeEach(() => {
    mockIsInSelection = vi.fn().mockReturnValue(true);
    mockSelection.isInSelection = mockIsInSelection;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('button shows "Ajoutée" and is disabled when isInSelection returns true', () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    const btn = screen.getByRole("button", { name: /Ajoutée/i });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("OrderCTA — out of stock", () => {
  it("shows WhatsApp interest CTA, no add-to-selection button", () => {
    const soldOut: Product = { ...dressProduct, inStock: false, slug: "look-elise-edition-limitee" };
    render(<WithIntl><OrderCTA product={soldOut} /></WithIntl>);

    expect(screen.getByText("Épuisé")).toBeDefined();
    expect(screen.queryByRole("button", { name: /Ajouter à ma sélection/i })).toBeNull();
    expect(screen.getByRole("link", { name: /Me prévenir sur WhatsApp/i })).toBeDefined();
  });
});
