import type { QualityConfig, ScorerResult } from "./types.js";

export function scoreMarketplaceGrep(html: string, config: QualityConfig): ScorerResult {
  const rows: ScorerResult["rows"] = [];
  if (!config.marketplace_grep.enabled) return { rows };

  const lower = html.toLowerCase();

  for (const s of config.marketplace_grep.forbidden_strings) {
    if (lower.includes(s.toLowerCase())) {
      rows.push({
        floor_id: "marketplace_grep",
        observed: s,
        threshold: "forbidden",
        reference_violated: "marketplace",
        status: "fail",
      });
    }
  }

  for (const pattern of config.marketplace_grep.forbidden_patterns) {
    const re = new RegExp(pattern, "i");
    if (re.test(html)) {
      rows.push({
        floor_id: "marketplace_grep",
        observed: pattern,
        threshold: "forbidden_pattern",
        reference_violated: "marketplace",
        status: "fail",
      });
    }
  }

  for (const el of config.marketplace_grep.forbidden_elements) {
    if (html.includes(el)) {
      rows.push({
        floor_id: "marketplace_grep",
        observed: el,
        threshold: "forbidden_element",
        reference_violated: "marketplace",
        status: "fail",
      });
    }
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "marketplace_grep",
      observed: "none",
      threshold: "forbidden",
      status: "pass",
    });
  }

  return { rows };
}
