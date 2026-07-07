import { afterEach, describe, expect, it } from "vitest";
import {
  EMBEDDING_DIMENSIONS,
  isEmbeddingConfigured,
  toVectorLiteral,
} from "./embeddings";

describe("embeddings", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalKey;
    }
  });

  it("isEmbeddingConfigured is false without API key", () => {
    delete process.env.OPENAI_API_KEY;
    expect(isEmbeddingConfigured()).toBe(false);
  });

  it("isEmbeddingConfigured is false for blank API key", () => {
    process.env.OPENAI_API_KEY = "   ";
    expect(isEmbeddingConfigured()).toBe(false);
  });

  it("isEmbeddingConfigured is true when API key is set", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect(isEmbeddingConfigured()).toBe(true);
  });

  it("toVectorLiteral formats a pgvector literal", () => {
    expect(toVectorLiteral([0.1, 0.2, 0.3])).toBe("[0.1,0.2,0.3]");
  });

  it("EMBEDDING_DIMENSIONS matches content_chunks schema", () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });
});
