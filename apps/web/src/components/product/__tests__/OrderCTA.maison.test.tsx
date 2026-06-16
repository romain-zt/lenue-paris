import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderCTA } from "../OrderCTA";
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

const bagProduct: Product = {
  id: "2",
  title: "Sac Céleste",
  slug: "sac-celeste",
  category: "bags",
  price: 310,
  mainImage: { id: "img2", url: "/images/PHOTO-2026-06-12-23-17-32.jpg", alt: "Sac Céleste" },
};

describe("OrderCTA — maison hooks", () => {
  it("exposes data-maison=cta-add-selection on the primary add control", () => {
    render(
      <WithIntl>
        <OrderCTA product={bagProduct} />
      </WithIntl>,
    );

    const cta = screen.getByRole("button", { name: /Ajouter/i });
    expect(cta.getAttribute("data-maison")).toBe("cta-add-selection");
  });
});
