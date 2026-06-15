import { describe, it, expect, vi, beforeEach } from "vitest";
import { getPage } from "@/lib/getPage";

describe("getPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ docs: [] }),
      }),
    );
  });

  it('fetches with locale=en when called with "en"', async () => {
    await getPage("a-propos", "en");

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("locale=en");
  });

  it('fetches with locale=ru when called with "ru"', async () => {
    await getPage("a-propos", "ru");

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("locale=ru");
  });

  it("defaults to locale=fr when locale is omitted", async () => {
    await getPage("a-propos");

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toContain("locale=fr");
  });
});
