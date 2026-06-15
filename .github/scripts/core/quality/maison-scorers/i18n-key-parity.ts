import type { QualityConfig, ScorerResult } from "./types.js";

function extractI18nFixture(html: string): Record<string, Record<string, string>> | null {
  const m = html.match(/<script[^>]*id=["']i18n-fixture["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as Record<string, Record<string, string>>;
  } catch {
    return null;
  }
}

export function scoreI18nKeyParity(html: string, config: QualityConfig): ScorerResult {
  const rows: ScorerResult["rows"] = [];
  const fixture = extractI18nFixture(html);
  if (!fixture) {
    rows.push({
      floor_id: "i18n_key_parity",
      observed: "missing i18n-fixture",
      threshold: "present",
      reference_violated: "tri-locale parity",
      status: "fail",
    });
    return { rows };
  }

  const keys = Object.keys(fixture).filter((k) =>
    config.i18n_key_parity.required_key_prefixes.some((p) => k.startsWith(p.replace(/\.$/, "")) || k.startsWith(p)),
  );

  for (const key of keys.length ? keys : Object.keys(fixture)) {
    for (const locale of config.i18n_key_parity.locales) {
      if (!fixture[key]?.[locale]) {
        rows.push({
          floor_id: "i18n_key_parity",
          observed: `${key}.${locale} missing`,
          threshold: "all locales",
          reference_violated: "tri-locale parity",
          status: "fail",
        });
      }
    }
  }

  if (rows.length === 0) {
    rows.push({
      floor_id: "i18n_key_parity",
      observed: config.i18n_key_parity.locales.join(","),
      threshold: "all locales",
      status: "pass",
    });
  }

  return { rows };
}
