import { describe, it, expect, vi } from "vitest";

vi.mock("payload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("payload")>();
  return {
    ...actual,
    getPayload: vi.fn().mockResolvedValue({
      find: vi.fn().mockResolvedValue({ docs: [] }),
    }),
  };
});

describe("getBrandPageData module contract", () => {
  it("exports getBrandPageData as a function", async () => {
    const mod = await import("@/lib/getBrandPageData");
    expect(typeof mod.getBrandPageData).toBe("function");
  });

  it("returns empty state when no CMS row", async () => {
    const { getBrandPageData } = await import("@/lib/getBrandPageData");
    const result = await getBrandPageData("fr");
    expect(result).toEqual({ title: "", body: "", cover: null });
  });
});
