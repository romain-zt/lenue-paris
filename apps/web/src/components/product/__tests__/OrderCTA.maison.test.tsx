import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { OrderCTA } from "../OrderCTA";
import { WithIntl } from "@/test-utils/with-intl";
import type { Product } from "@/types/product";

const bagProduct: Product = {
  id: "2",
  title: "Sac Céleste",
  slug: "sac-celeste",
  category: "bags",
  price: 310,
  mainImage: { id: "img2", url: "/images/lenue-sac-champagne.jpg", alt: "Sac Céleste" },
};

describe("OrderCTA — maison hooks", () => {
  it("exposes data-maison=cta-whatsapp on the submit control", () => {
    render(
      <WithIntl>
        <OrderCTA product={bagProduct} />
      </WithIntl>,
    );

    const cta = screen.getByRole("button", { name: /Commander/i });
    expect(cta.getAttribute("data-maison")).toBe("cta-whatsapp");
  });
});
