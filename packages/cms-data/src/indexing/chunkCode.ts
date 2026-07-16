export interface CodeChunk {
  chunkIndex: number;
  startLine: number;
  endLine: number;
  text: string;
}

/**
 * Line-oriented code chunking.
 *
 * Code is split into line windows so that a retrieved chunk always maps back to
 * a precise `file:startLine-endLine` range (usable for citations). A window is
 * closed as soon as it reaches either the target line count or the character
 * budget (long minified lines never blow past the embedding token limit).
 */
const MAX_CHUNK_LINES = 80;
const MAX_CHUNK_CHARS = 1800;
const LINE_OVERLAP = 10;

export function chunkCode(source: string): CodeChunk[] {
  const normalized = source.replace(/\r\n/g, "\n");
  if (normalized.trim().length === 0) return [];

  const lines = normalized.split("\n");
  const chunks: CodeChunk[] = [];

  let start = 0; // 0-based line index
  let chunkIndex = 0;

  while (start < lines.length) {
    let end = start; // exclusive-ish cursor, 0-based
    let charCount = 0;

    while (
      end < lines.length &&
      end - start < MAX_CHUNK_LINES &&
      charCount < MAX_CHUNK_CHARS
    ) {
      const line = lines[end] ?? "";
      charCount += line.length + 1;
      end += 1;
    }

    // Guarantee forward progress even for a single oversized line.
    if (end === start) end = start + 1;

    const slice = lines.slice(start, end);
    const text = slice.join("\n").trim();

    if (text.length > 0) {
      chunks.push({
        chunkIndex,
        startLine: start + 1,
        endLine: end,
        text,
      });
      chunkIndex += 1;
    }

    if (end >= lines.length) break;
    start = Math.max(start + 1, end - LINE_OVERLAP);
  }

  return chunks;
}

const EXTENSION_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  sql: "sql",
  prisma: "prisma",
  md: "markdown",
  mdx: "markdown",
  yml: "yaml",
  yaml: "yaml",
};

export function languageFromPath(filePath: string): string {
  const match = /\.([a-z0-9]+)$/i.exec(filePath);
  const ext = match?.[1]?.toLowerCase();
  if (!ext) return "text";
  return EXTENSION_LANGUAGE[ext] ?? "text";
}
