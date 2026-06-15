import type { QualityConfig, ScorerResult } from "./types.js";

function parseHslChroma(value: string): number | null {
  const hsl = value.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/i);
  if (!hsl) return null;
  const s = Number(hsl[2]) / 100;
  const l = Number(hsl[3]) / 100;
  return s * (1 - Math.abs(2 * l - 1));
}

export function scorePaletteChroma(html: string, config: QualityConfig): ScorerResult {
  const rows: ScorerResult["rows"] = [];

  for (const token of config.palette_chroma.forbidden_accent_tokens) {
    if (html.includes(token)) {
      rows.push({
        floor_id: "palette_chroma",
        observed: token,
        threshold: "forbidden",
        reference_violated: "marketplace sale/cart tokens",
        status: "fail",
      });
    }
  }

  for (const m of html.matchAll(/(--color-accent[^:]*):\s*([^;}{]+)/gi)) {
    const value = m[2].trim();
    const chroma = parseHslChroma(value);
    if (chroma !== null && chroma > config.palette_chroma.accent_chroma_max) {
      rows.push({
        floor_id: "palette_chroma",
        observed: Number(chroma.toFixed(3)),
        threshold: config.palette_chroma.accent_chroma_max,
        reference_violated: "muted maison palette",
        status: "fail",
      });
    }
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "palette_chroma",
      observed: "within bounds",
      threshold: config.palette_chroma.accent_chroma_max,
      status: "pass",
    });
  }

  return { rows };
}
