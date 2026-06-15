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

  it('returns English fallback title when getPage returns null and locale is "en"', async () => {
    mockGetPage.mockResolvedValue(null);

    const result = await getBrandPageData("en");

    expect(result.title).toBe("About");
  });

  it('returns Russian fallback title when getPage returns null and locale is "ru"', async () => {
    mockGetPage.mockResolvedValue(null);

    const result = await getBrandPageData("ru");

    expect(result.title).toBe("О нас");
  });

  it("returns French fallback title when getPage returns null and locale is omitted", async () => {
    mockGetPage.mockResolvedValue(null);

    const result = await getBrandPageData();

    expect(result.title).toBe("À propos");
  });

  it("uses CMS page data when getPage returns a page and passes locale to getPage", async () => {
    mockGetPage.mockResolvedValue({
      id: "page-1",
      title: "CMS About Page",
      slug: "a-propos",
      body: "CMS body",
      cover: null,
    });

    const result = await getBrandPageData("en");

    expect(result.title).toBe("CMS About Page");
    expect(mockGetPage).toHaveBeenCalledWith("a-propos", "en");
  });
});
