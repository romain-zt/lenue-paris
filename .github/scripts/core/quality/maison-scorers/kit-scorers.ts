import type { QualityConfig, ScorerResult } from "./types.js";

function scoreReadability(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ").trim();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWords = words.length / Math.max(sentences.length, 1);
  return avgWords <= 20 ? 0.9 : avgWords <= 30 ? 0.7 : 0.4;
}

function scoreDesignTokens(html: string): number {
  const hasRoot = /:root\s*\{/.test(html);
  const hasVar = /var\s*\(--/.test(html);
  return hasRoot && hasVar ? 1 : hasRoot ? 0.5 : 0;
}

function scoreSeoMeta(html: string): number {
  const hasDescription = /<meta\s+name=["']description["']/i.test(html);
  const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
  return (hasDescription ? 0.5 : 0) + (hasViewport ? 0.5 : 0);
}

function scoreAltCoverage(html: string): number {
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
  if (imgs.length === 0) return 1;
  const withAlt = imgs.filter((m) => /\balt=["'][^"']+["']/i.test(m[0])).length;
  return withAlt / imgs.length;
}

export function scoreKitScorers(html: string, config: QualityConfig): ScorerResult {
  const rows: ScorerResult["rows"] = [];
  const scores = {
    readability: scoreReadability(html),
    design_tokens: scoreDesignTokens(html),
    seo_meta: scoreSeoMeta(html),
    alt_coverage: scoreAltCoverage(html),
  };

  const floors: Array<[keyof typeof scores, number, string]> = [
    ["readability", config.kit_scorers.readability_min, "readability"],
    ["design_tokens", config.kit_scorers.design_tokens_min, "design_tokens"],
    ["seo_meta", config.kit_scorers.seo_meta_min, "seo_meta"],
    ["alt_coverage", config.kit_scorers.alt_coverage_min, "alt_coverage"],
  ];

  for (const [key, min, floorId] of floors) {
    const observed = scores[key];
    rows.push({
      floor_id: floorId,
      observed,
      threshold: min,
      status: observed >= min ? "pass" : "fail",
      ...(observed < min ? { reference_violated: "agent-loop-kit floor" } : {}),
    });
  }

  return { rows };
}
