import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

function fillBuyerFields() {
  fireEvent.change(screen.getByPlaceholderText("Votre prénom et nom"), {
    target: { value: "Jean Dupont" },
  });
  fireEvent.change(screen.getByPlaceholderText("Votre numéro WhatsApp"), {
    target: { value: "+33 6 12 34 56 78" },
  });
}

function selectDressVariants() {
  fireEvent.click(screen.getByText("Version longue"));
  fireEvent.click(screen.getByRole("button", { name: "M" }));
}

describe("OrderCTA — dress", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("shows length and size selectors for dresses", () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    expect(screen.getByText("Longueur")).toBeDefined();
    expect(screen.getByText("Taille")).toBeDefined();
  });

  it("shows selection-required warning when no variant chosen", () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("disables the order button when no variant selected", () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    const btn = screen.getByRole("button", { name: /Commander/i });
    expect(btn.getAttribute("aria-disabled")).toBe("true");
  });
});

describe("OrderCTA — bag / scarf", () => {
  beforeEach(() => { vi.stubGlobal("fetch", vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("shows no length or size selectors for bags", () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    expect(screen.queryByText("Longueur")).toBeNull();
    expect(screen.queryByText("Taille")).toBeNull();
  });

  it("CTA is enabled immediately for bags", () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fillBuyerFields();
    const btn = screen.getByRole("button", { name: /Commander/i });
    expect(btn.getAttribute("aria-disabled")).toBe("false");
  });
});

describe("OrderCTA — checkout form", () => {
  const locationMock = { href: "" };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(window, "location", {
      value: locationMock,
      writable: true,
      configurable: true,
    });
    locationMock.href = "";
  });

  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it("renders buyerName input with correct placeholder", () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    expect(screen.getByPlaceholderText("Votre prénom et nom")).toBeDefined();
  });

  it("renders buyerContact input with correct placeholder", () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    expect(screen.getByPlaceholderText("Votre numéro WhatsApp")).toBeDefined();
  });

  it("submit button is disabled when buyerName is empty", () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fireEvent.change(screen.getByPlaceholderText("Votre numéro WhatsApp"), {
      target: { value: "+33 6 12 34 56 78" },
    });
    const btn = screen.getByRole("button", { name: /Commander/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("submit button is disabled when buyerContact is empty", () => {
    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fireEvent.change(screen.getByPlaceholderText("Votre prénom et nom"), {
      target: { value: "Jean Dupont" },
    });
    const btn = screen.getByRole("button", { name: /Commander/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("on submit calls fetch with correct body", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "order-1" }), { status: 201 })
    );

    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fillBuyerFields();
    fireEvent.click(screen.getByRole("button", { name: /Commander/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: "sac-cuir",
          buyerName: "Jean Dupont",
          buyerContact: "+33 6 12 34 56 78",
        }),
      });
    });
  });

  it("shows loading state while submitting", async () => {
    const fetchMock = vi.mocked(fetch);
    let resolveFetch!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => { resolveFetch = resolve; })
    );

    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fillBuyerFields();
    fireEvent.click(screen.getByRole("button", { name: /Commander/i }));

    expect(
      (screen.getByRole("button", { name: /Envoi en cours/i }) as HTMLButtonElement).disabled
    ).toBe(true);

    resolveFetch(new Response(JSON.stringify({ id: "order-1" }), { status: 201 }));

    await waitFor(() => {
      expect(screen.getByText(/Votre commande a été enregistrée/i)).toBeDefined();
    });
  });

  it("on success shows confirmation message", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "order-1" }), { status: 201 })
    );

    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fillBuyerFields();
    fireEvent.click(screen.getByRole("button", { name: /Commander/i }));

    await waitFor(() => {
      expect(screen.getByText(/Votre commande a été enregistrée/i)).toBeDefined();
      expect(screen.getByText(/Si WhatsApp ne s'est pas ouvert/i)).toBeDefined();
    });

    expect(locationMock.href).toMatch(/^https:\/\/wa\.me\//);
  });

  it("on error shows error message when fetch fails", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValueOnce(new Error("Network error"));

    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fillBuyerFields();
    fireEvent.click(screen.getByRole("button", { name: /Commander/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Impossible d'enregistrer la commande/i)
      ).toBeDefined();
    });
  });

  it("on error shows error message when response is non-2xx", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Failed" }), { status: 500 })
    );

    render(<WithIntl><OrderCTA product={bagProduct} /></WithIntl>);
    fillBuyerFields();
    fireEvent.click(screen.getByRole("button", { name: /Commander/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Impossible d'enregistrer la commande/i)
      ).toBeDefined();
    });
  });

  it("for a dress submit button is disabled if length/size not selected even when buyer fields filled", () => {
    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    fillBuyerFields();
    const btn = screen.getByRole("button", { name: /Commander/i });
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it("for a dress submits length and size in fetch body", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "order-2" }), { status: 201 })
    );

    render(<WithIntl><OrderCTA product={dressProduct} /></WithIntl>);
    selectDressVariants();
    fillBuyerFields();
    fireEvent.click(screen.getByRole("button", { name: /Commander/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
      const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(JSON.parse(options.body as string)).toEqual({
        productSlug: "robe-en-soie",
        length: "longer",
        size: "M",
        buyerName: "Jean Dupont",
        buyerContact: "+33 6 12 34 56 78",
      });
    });
  });
});
