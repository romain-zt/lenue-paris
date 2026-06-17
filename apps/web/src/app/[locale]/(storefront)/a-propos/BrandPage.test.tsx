import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandPageContent } from "./BrandPageContent";
import { getBrandPageData } from "@/lib/getBrandPageData";
import Loading from "./loading";
import NotFound from "./not-found";

vi.mock("@/lib/getPage", () => ({
  getPage: vi.fn(),
}));

import { getPage } from "@/lib/getPage";

const mockedGetPage = vi.mocked(getPage);

async function renderBrandPageFromCms(locale: "fr" | "en" | "ru" = "fr") {
  const data = await getBrandPageData(locale);
  render(<BrandPageContent {...data} />);
}

describe("BrandPageContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title from CMS page", async () => {
    mockedGetPage.mockResolvedValue({
      id: "1",
      title: "Notre histoire",
      slug: "a-propos",
      body: "Hello",
      cover: null,
    });

    await renderBrandPageFromCms();

    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Notre histoire");
  });

  it("renders body paragraphs split by newlines", async () => {
    mockedGetPage.mockResolvedValue({
      id: "1",
      title: "Notre histoire",
      slug: "a-propos",
      body: "First para\n\nSecond para",
      cover: null,
    });

    await renderBrandPageFromCms();

    expect(screen.getByText("First para")).toBeDefined();
    expect(screen.getByText("Second para")).toBeDefined();
  });

  it("renders nothing when CMS is empty (no fallback copy)", async () => {
    mockedGetPage.mockResolvedValue(null);

    await renderBrandPageFromCms();

    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("renders without cover image when cover is null", async () => {
    mockedGetPage.mockResolvedValue({
      id: "1",
      title: "Notre histoire",
      slug: "a-propos",
      body: "Hello",
      cover: null,
    });

    await renderBrandPageFromCms();

    expect(screen.queryByRole("img")).toBeNull();
  });
});

describe("BrandPageLoading", () => {
  it("loading.tsx renders skeleton", () => {
    render(<Loading />);
    expect(screen.getByTestId("loading-skeleton")).toBeDefined();
  });
});

describe("BrandPageNotFound", () => {
  it("not-found.tsx renders back link", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /Retour à la boutique/i });
    expect(link.getAttribute("href")).toBe("/");
  });
});
