import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandPageContent } from "./BrandPageContent";
import Loading from "./loading";
import NotFound from "./not-found";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => {
    const messages: Record<string, string> = {
      loading: "Chargement",
      pageNotFound: "Cette page est introuvable.",
      backToShop: "← Retour à la boutique",
    };
    return messages[key] ?? key;
  },
}));

describe("BrandPageContent", () => {
  it("renders title from props", () => {
    render(<BrandPageContent title="Notre histoire" body="Hello" cover={null} brandName="Test Brand" />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Notre histoire");
  });

  it("renders body paragraphs split by newlines", () => {
    const { container } = render(<BrandPageContent title="Notre histoire" body="First para\n\nSecond para" cover={null} brandName="Test Brand" />);
    expect(container.textContent).toContain("First para");
    expect(container.textContent).toContain("Second para");
  });

  it("renders nothing when title is empty (no CMS content)", () => {
    render(<BrandPageContent title="" body="" cover={null} brandName="" />);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("renders without cover image when cover is null", () => {
    render(<BrandPageContent title="Notre histoire" body="Hello" cover={null} brandName="Test Brand" />);
    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("BrandPageLoading", () => {
  it("loading.tsx renders skeleton", async () => {
    const ui = await Loading();
    render(ui);
    expect(screen.getByTestId("loading-skeleton")).toBeDefined();
  });
});

describe("BrandPageNotFound", () => {
  it("not-found.tsx renders back link", async () => {
    const ui = await NotFound();
    render(ui);
    const link = screen.getByRole("link", { name: /Retour à la boutique/i });
    expect(link.getAttribute("href")).toBe("/");
  });
});
