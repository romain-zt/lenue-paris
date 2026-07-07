import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/pool", () => ({
  getPgPool: vi.fn(),
}));

vi.mock("./embeddings", () => ({
  isEmbeddingConfigured: vi.fn(),
  createEmbedding: vi.fn(),
  toVectorLiteral: vi.fn((embedding: number[]) => `[${embedding.join(",")}]`),
}));

import { getPgPool } from "../db/pool";
import { createEmbedding, isEmbeddingConfigured } from "./embeddings";
import { semanticSearch } from "./semanticSearch";

describe("semanticSearch", () => {
  const mockQuery = vi.fn();

  beforeEach(() => {
    vi.mocked(getPgPool).mockReturnValue({ query: mockQuery } as never);
    vi.mocked(isEmbeddingConfigured).mockReturnValue(true);
    vi.mocked(createEmbedding).mockResolvedValue(new Array(1536).fill(0.1));
    mockQuery.mockResolvedValue({ rows: [] });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("returns empty results for a blank query", async () => {
    const result = await semanticSearch({ query: "   " });

    expect(result).toEqual({ results: [], skipped: false });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("skips when embeddings are not configured", async () => {
    vi.mocked(isEmbeddingConfigured).mockReturnValue(false);

    const result = await semanticSearch({ query: "livraison" });

    expect(result.skipped).toBe(true);
    expect(result.reason).toContain("OPENAI_API_KEY");
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("queries content_chunks with locale and limit", async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          collection: "pages",
          doc_id: "5",
          locale: "fr",
          field_path: "blocks.0.editorialStrip.body",
          text: "Informations sur la livraison en France.",
          similarity: 0.91,
        },
      ],
    });

    const result = await semanticSearch({
      query: "livraison",
      locale: "fr",
      limit: 5,
    });

    expect(result.skipped).toBe(false);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      collection: "pages",
      docId: "5",
      locale: "fr",
      text: "Informations sur la livraison en France.",
    });
    expect(mockQuery).toHaveBeenCalledOnce();

    const [sql, values] = mockQuery.mock.calls[0] as [string, Array<string | number>];
    expect(sql).toContain("content_chunks");
    expect(sql).toContain("LIMIT");
    expect(values).toContain("fr");
    expect(values).toContain(5);
  });

  it("filters by collections when provided", async () => {
    await semanticSearch({
      query: "robe",
      collections: ["products"],
      limit: 3,
    });

    const [sql, values] = mockQuery.mock.calls[0] as [string, Array<string | number>];
    expect(sql).toContain("collection IN");
    expect(values).toContain("products");
  });
});
