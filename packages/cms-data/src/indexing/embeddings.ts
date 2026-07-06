export const EMBEDDING_MODEL =
  process.env.AI_EMBEDDING_MODEL ?? "text-embedding-3-small";

export const EMBEDDING_DIMENSIONS = 1536;

interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[] }>;
}

export function isEmbeddingConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function createEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for semantic search indexing");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI embeddings failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as OpenAIEmbeddingResponse;
  const embedding = json.data[0]?.embedding;
  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("OpenAI embeddings returned an invalid vector");
  }

  return embedding;
}

export async function createEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required for semantic search indexing");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI embeddings failed (${response.status}): ${body}`);
  }

  const json = (await response.json()) as OpenAIEmbeddingResponse;
  return json.data.map((entry) => {
    if (entry.embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error("OpenAI embeddings returned an invalid vector");
    }
    return entry.embedding;
  });
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
