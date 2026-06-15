import type { QualityConfig, ScorerResult } from "./types.js";

function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreTypographyAccent(html: string, config: QualityConfig): ScorerResult {
  const rows: ScorerResult["rows"] = [];
  const text = visibleText(html);
  const required = config.typography_accent.wordmark_required;
  const forbidden = config.typography_accent.wordmark_forbidden_visible;

  const wordmarkMatch = html.match(/data-maison=['"]wordmark['"][^>]*>([^<]+)</i);
  const wordmarkText = wordmarkMatch?.[1]?.trim() ?? "";

  if (wordmarkText.includes(forbidden) && !wordmarkText.includes(required)) {
    rows.push({
      floor_id: "typography_accent",
      observed: wordmarkText,
      threshold: required,
      reference_violated: "Lénue wordmark",
      status: "fail",
    });
  } else if (!text.includes(required)) {
    rows.push({
      floor_id: "typography_accent",
      observed: "missing",
      threshold: required,
      reference_violated: "Lénue wordmark",
      status: "fail",
    });
  } else {
    rows.push({
      floor_id: "typography_accent",
      observed: required,
      threshold: required,
      status: "pass",
    });
  }

  const fontFamilies = new Set<string>();
  for (const m of html.matchAll(/font-family:\s*([^;}{]+)/gi)) {
    for (const part of m[1].split(",")) {
      const name = part.trim().replace(/^['"]|['"]$/g, "");
      if (name && !["system-ui", "sans-serif", "serif", "Georgia"].includes(name)) {
        fontFamilies.add(name);
      }
    }
  }

  if (fontFamilies.size > 2) {
    rows.push({
      floor_id: "typography_families",
      observed: fontFamilies.size,
      threshold: 2,
      reference_violated: "maison typography",
      status: "fail",
    });
  }

  return { rows };
}
