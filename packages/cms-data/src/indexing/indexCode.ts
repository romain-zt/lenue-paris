import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { getPgPool } from "../db/pool";
import type { CodeSearchParams, CodeSearchResult } from "../types";
import { chunkCode, languageFromPath } from "./chunkCode";
import {
  createEmbedding,
  createEmbeddings,
  isEmbeddingConfigured,
  toVectorLiteral,
} from "./embeddings";

/** Directories never worth indexing (dependencies, build output, VCS, legacy apps). */
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  ".vercel",
  ".cache",
  ".cursor",
  "dist",
  "build",
  "out",
  "coverage",
  "playwright-report",
  "test-results",
  ".idea",
  ".vscode",
  "cms",
]);

/** Source extensions worth embedding. */
const INDEXABLE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "css",
  "scss",
  "sql",
  "prisma",
  "md",
  "mdx",
  "json",
  "yml",
  "yaml",
]);

/** Files that are generated, locked, or otherwise pure noise for retrieval. */
const IGNORED_FILE_PATTERNS: readonly RegExp[] = [
  /\.d\.ts$/i,
  /payload-types\.ts$/i,
  /importMap\.(js|ts)$/i,
  /pnpm-lock\.yaml$/i,
  /package-lock\.json$/i,
  /yarn\.lock$/i,
  /\.min\.(js|css)$/i,
];

const MAX_FILE_BYTES = 200 * 1024;
const EMBEDDING_BATCH_SIZE = 96;

interface PendingChunk {
  filePath: string;
  language: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  text: string;
}

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function isIndexableFile(fileName: string): boolean {
  if (IGNORED_FILE_PATTERNS.some((pattern) => pattern.test(fileName))) {
    return false;
  }
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  const ext = match?.[1]?.toLowerCase();
  return Boolean(ext && INDEXABLE_EXTENSIONS.has(ext));
}

async function collectSourceFiles(rootDir: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) continue;
        // apps/cms is legacy — Payload lives in apps/web
        if (entry.name === "cms" && path.basename(dir) === "apps") continue;
        await walk(abs);
      } else if (entry.isFile() && isIndexableFile(entry.name)) {
        found.push(abs);
      }
    }
  }

  await walk(rootDir);
  return found;
}

async function collectPendingChunks(
  rootDir: string,
  files: string[],
): Promise<PendingChunk[]> {
  const pending: PendingChunk[] = [];

  for (const abs of files) {
    const info = await stat(abs);
    if (info.size > MAX_FILE_BYTES) continue;

    const source = await readFile(abs, "utf8");
    const relPath = toPosixPath(path.relative(rootDir, abs));
    const language = languageFromPath(relPath);

    for (const chunk of chunkCode(source)) {
      pending.push({
        filePath: relPath,
        language,
        chunkIndex: chunk.chunkIndex,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        text: `// ${relPath} (lines ${chunk.startLine}-${chunk.endLine})\n${chunk.text}`,
      });
    }
  }

  return pending;
}

export interface ReindexCodeResult {
  totalChunks: number;
  files: number;
  skipped: boolean;
  reason?: string;
}

/**
 * Full rebuild of the `code_chunks` index for the repository rooted at
 * `rootDir`. Runs where the source actually exists (local dev or CI) — never
 * relies on the runtime filesystem. The whole table is replaced inside a
 * transaction so a failure never leaves a half-empty index.
 */
export async function reindexAllCode(rootDir: string): Promise<ReindexCodeResult> {
  if (!isEmbeddingConfigured()) {
    return { totalChunks: 0, files: 0, skipped: true, reason: "OPENAI_API_KEY not set" };
  }

  const files = await collectSourceFiles(rootDir);
  const pending = await collectPendingChunks(rootDir, files);
  const indexedFiles = new Set(pending.map((chunk) => chunk.filePath));
  const totalBatches = Math.ceil(pending.length / EMBEDDING_BATCH_SIZE) || 0;
  console.log(
    `[reindex-code] ${pending.length} chunks from ${indexedFiles.size} files — ${totalBatches} API calls OpenAI (~1-3 min)…`,
  );

  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM code_chunks");

    for (let i = 0; i < pending.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = pending.slice(i, i + EMBEDDING_BATCH_SIZE);
      const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
      if (batchNum === 1 || batchNum % 3 === 0 || batchNum === totalBatches) {
        console.log(
          `[reindex-code] Embedding batch ${batchNum}/${totalBatches} (${batch.length} chunks)…`,
        );
      }
      const embeddings = await createEmbeddings(batch.map((chunk) => chunk.text));

      for (let j = 0; j < batch.length; j += 1) {
        const chunk = batch[j];
        const embedding = embeddings[j];
        if (!chunk || !embedding) continue;

        await client.query(
          `INSERT INTO code_chunks
            (file_path, language, symbol, chunk_index, start_line, end_line, text, embedding, updated_at)
           VALUES ($1, $2, NULL, $3, $4, $5, $6, $7::vector, now())`,
          [
            chunk.filePath,
            chunk.language,
            chunk.chunkIndex,
            chunk.startLine,
            chunk.endLine,
            chunk.text,
            toVectorLiteral(embedding),
          ],
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return {
    totalChunks: pending.length,
    files: indexedFiles.size,
    skipped: false,
  };
}

interface CodeChunkRow {
  file_path: string;
  language: string;
  symbol: string | null;
  start_line: number;
  end_line: number;
  text: string;
  similarity: number;
}

export async function searchCode(
  params: CodeSearchParams,
): Promise<{ results: CodeSearchResult[]; skipped: boolean; reason?: string }> {
  const query = params.query.trim();
  if (!query) {
    return { results: [], skipped: false };
  }

  if (!isEmbeddingConfigured()) {
    return {
      results: [],
      skipped: true,
      reason: "OPENAI_API_KEY not set — indexation code indisponible",
    };
  }

  const limit = params.limit ?? 10;
  const queryEmbedding = await createEmbedding(query);
  const vector = toVectorLiteral(queryEmbedding);

  const values: Array<string | number> = [vector];
  let sql = `
    SELECT
      file_path,
      language,
      symbol,
      start_line,
      end_line,
      text,
      1 - (embedding <=> $1::vector) AS similarity
    FROM code_chunks
    WHERE embedding IS NOT NULL
  `;

  if (params.pathPrefix && params.pathPrefix.trim().length > 0) {
    values.push(`${params.pathPrefix.trim()}%`);
    sql += ` AND file_path LIKE $${values.length}`;
  }

  values.push(limit);
  sql += ` ORDER BY embedding <=> $1::vector LIMIT $${values.length}`;

  const pool = getPgPool();
  const response = await pool.query<CodeChunkRow>(sql, values);

  const results: CodeSearchResult[] = response.rows.map((row) => ({
    filePath: row.file_path,
    language: row.language,
    symbol: row.symbol,
    startLine: row.start_line,
    endLine: row.end_line,
    text: row.text,
    similarity: Number(row.similarity),
  }));

  return { results, skipped: false };
}
