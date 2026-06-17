import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockGetPage } = vi.hoisted(() => ({
  mockGetPage: vi.fn(),
}));

vi.mock("@/lib/getPage", () => ({
  getPage: mockGetPage,
}));

import { getBrandPageData } from "@/lib/getBrandPageData";

describe("getBrandPageData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty body when CMS has no a-propos page", async () => {
    mockGetPage.mockResolvedValue(null);
    const result = await getBrandPageData("fr");
    expect(result.title).toBe("");
    expect(result.body).toBe("");
    expect(result.cover).toBeNull();
  });

  it("returns empty body for any locale when CMS is empty", async () => {
    mockGetPage.mockResolvedValue(null);
    const en = await getBrandPageData("en");
    const ru = await getBrandPageData("ru");
    expect(en.body).toBe("");
    expect(ru.body).toBe("");
  });

  it("uses CMS page data when getPage returns a page and passes locale to getPage", async () => {
    mockGetPage.mockResolvedValue({
      id: "page-1",
      title: "Notre histoire",
      slug: "a-propos",
      body: "CMS body",
      cover: null,
    });

    const result = await getBrandPageData("fr");

    expect(result.title).toBe("Notre histoire");
    expect(result.body).toBe("CMS body");
    expect(mockGetPage).toHaveBeenCalledWith("a-propos", "fr");
  });

  it("returns cover from CMS when populated", async () => {
    mockGetPage.mockResolvedValue({
      id: "page-1",
      title: "Notre histoire",
      slug: "a-propos",
      body: "body",
      cover: { url: "/images/cover.jpg", alt: "Cover" },
    });

    const result = await getBrandPageData("fr");
    expect(result.cover?.url).toBe("/images/cover.jpg");
  });
});
