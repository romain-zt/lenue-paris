import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProductDetail } from "@repo/product-detail";
import { getCheckoutCopy } from "@/lib/checkout-copy";
import { CheckoutForm } from "./CheckoutForm";

vi.mock("@/lib/open-whatsapp-handoff", () => ({
  openWhatsAppHandoff: vi.fn(),
}));

import { openWhatsAppHandoff } from "@/lib/open-whatsapp-handoff";

const bagProduct: ProductDetail = {
  id: "2",
  slug: "sac-cuir",
  name: "Sac en cuir",
  description: null,
  price: 480,
  currency: "EUR",
  category: "sac",
  gallery: [
    {
      id: "img-1",
      url: "https://cdn.example/sac.jpg",
      alt: "Sac en cuir",
    },
  ],
  variantPickers: null,
  orderHref: "/fr/order/sac-cuir",
  catalogueHref: "/fr/catalogue",
};

const dressProduct: ProductDetail = {
  ...bagProduct,
  slug: "robe-lin",
  name: "Robe en lin",
  category: "robe",
  orderHref: "/fr/order/robe-lin",
  variantPickers: {
    lengthOptions: ["longer", "shorter"],
    sizeOptions: ["S", "M", "L"],
  },
};

const copy = getCheckoutCopy("fr");

describe("CheckoutForm", () => {
  beforeEach(() => {
    vi.mocked(openWhatsAppHandoff).mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          id: "order-1",
          whatsappUrl: "https://wa.me/79117126262?text=hello",
        }),
      }),
    );
  });

  it("summarizes the product and dress variants from query params", () => {
    render(
      <CheckoutForm
        product={dressProduct}
        locale="fr"
        variantSelection={{ length: "longer", size: "M" }}
        copy={copy}
      />,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Robe en lin",
    );
    expect(screen.getByText("480 €")).toBeInTheDocument();
    expect(screen.getByText("Longueur: Plus longue")).toBeInTheDocument();
    expect(screen.getByText("Taille: M")).toBeInTheDocument();
  });

  it("shows inline validation errors without calling the API", async () => {
    render(
      <CheckoutForm
        product={bagProduct}
        locale="fr"
        variantSelection={{}}
        copy={copy}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Enregistrer et continuer sur WhatsApp",
      }),
    );

    expect(await screen.findByText("Indiquez votre nom")).toBeInTheDocument();
    expect(screen.getByText("Indiquez votre numéro de téléphone")).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("posts to /api/orders then confirms and opens WhatsApp on success", async () => {
    render(
      <CheckoutForm
        product={bagProduct}
        locale="fr"
        variantSelection={{}}
        copy={copy}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Anna" },
    });
    fireEvent.change(screen.getByLabelText("Téléphone"), {
      target: { value: "+33612345678" },
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Enregistrer et continuer sur WhatsApp",
      }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/orders",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            customerName: "Anna",
            customerPhone: "+33612345678",
            productSlug: "sac-cuir",
            locale: "fr",
          }),
        }),
      );
    });

    expect(await screen.findByText("Commande enregistrée")).toBeInTheDocument();
    expect(openWhatsAppHandoff).toHaveBeenCalledWith(
      "https://wa.me/79117126262?text=hello",
    );
    expect(
      screen.getByRole("link", { name: "Continuer sur WhatsApp" }),
    ).toHaveAttribute("href", "https://wa.me/79117126262?text=hello");
  });

  it("shows a retry message when the order save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "order_save_failed" }),
      }),
    );

    render(
      <CheckoutForm
        product={bagProduct}
        locale="fr"
        variantSelection={{}}
        copy={copy}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nom"), {
      target: { value: "Anna" },
    });
    fireEvent.change(screen.getByLabelText("Téléphone"), {
      target: { value: "+33612345678" },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: "Enregistrer et continuer sur WhatsApp",
      }),
    );

    expect(await screen.findByText("Enregistrement impossible")).toBeInTheDocument();
    expect(openWhatsAppHandoff).not.toHaveBeenCalled();
  });
});
