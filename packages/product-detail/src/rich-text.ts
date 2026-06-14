type RichTextNode = {
  type?: string;
  text?: string;
  children?: RichTextNode[];
};

function collectText(node: RichTextNode, parts: string[]): void {
  if (typeof node.text === "string" && node.text.length > 0) {
    parts.push(node.text);
  }

  for (const child of node.children ?? []) {
    collectText(child, parts);
  }
}

function extractFromParagraphs(root: RichTextNode): string | null {
  const paragraphs: string[] = [];

  for (const child of root.children ?? []) {
    if (child.type === "paragraph" || child.type === "heading") {
      const parts: string[] = [];
      collectText(child, parts);
      const line = parts.join("").trim();
      if (line) {
        paragraphs.push(line);
      }
    } else {
      const parts: string[] = [];
      collectText(child, parts);
      const line = parts.join("").trim();
      if (line) {
        paragraphs.push(line);
      }
    }
  }

  if (paragraphs.length === 0) {
    return null;
  }

  return paragraphs.join("\n\n");
}

export function extractPlainTextFromRichText(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const node =
    record.root && typeof record.root === "object"
      ? (record.root as RichTextNode)
      : (value as RichTextNode);

  if (node.type === "root" || Array.isArray(node.children)) {
    return extractFromParagraphs(node);
  }

  const parts: string[] = [];
  collectText(node, parts);
  const text = parts.join("").trim();
  return text.length > 0 ? text : null;
}
