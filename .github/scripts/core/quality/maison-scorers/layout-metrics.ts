import type { QualityConfig, ScorerResult } from "./types.js";

function parseCssRules(html: string): Map<string, string> {
  const rules = new Map<string, string>();
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  for (const block of styleBlocks) {
    const css = block[1];
    for (const m of css.matchAll(/([^{]+)\{([^}]+)\}/g)) {
      const selector = m[1].trim();
      const body = m[2].trim();
      rules.set(selector, `${rules.get(selector) ?? ""} ${body}`.trim());
    }
  }
  return rules;
}

function cssValue(rules: Map<string, string>, selector: string, prop: string): string | undefined {
  for (const [sel, body] of rules) {
    if (!selectorMatches(sel, selector)) continue;
    const m = body.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, "i"));
    if (m) return m[1].trim();
  }
  return undefined;
}

function selectorMatches(ruleSel: string, target: string): boolean {
  const norm = target.replace(/['"]/g, "'");
  return ruleSel.includes(norm) || (ruleSel.includes("[data-maison='hero']") && target.includes("hero"));
}

function resolveCssVar(
  rules: Map<string, string>,
  value: string,
  depth = 0,
): string {
  if (depth > 4) return value;
  const varMatch = value.match(/var\(\s*(--[^,)]+)/);
  if (!varMatch) return value;
  const varName = varMatch[1].trim();
  for (const [sel, body] of rules) {
    if (!sel.includes(":root") && sel !== ":root") continue;
    const decl = body.match(new RegExp(`${varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*:\\s*([^;]+)`, "i"));
    if (decl) return resolveCssVar(rules, decl[1].trim(), depth + 1);
  }
  return value;
}

function extractMaisonBlock(html: string, attr: string): string {
  const re = new RegExp(
    `<[^>]*data-maison=["']${attr}["'][^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m?.[0] ?? "";
}

function parseTailwindViewportHeight(classAttr: string, viewport: number): number | undefined {
  const svh = classAttr.match(/\bh-\[100svh\]/);
  if (svh) return viewport;
  const dvh = classAttr.match(/\bmin-h-\[100dvh\]/);
  if (dvh) return viewport;
  const vh = classAttr.match(/\bh-\[(\d+)vh\]/);
  if (vh) return (Number(vh[1]) / 100) * viewport;
  return undefined;
}

function parsePx(value: string | undefined, viewport: number, fallback: number): number {
  if (!value) return fallback;
  if (value.endsWith("px")) return Number(value.replace("px", "")) || fallback;
  if (value.endsWith("vw")) return (Number(value.replace("vw", "")) / 100) * viewport;
  if (value.endsWith("vh")) return (Number(value.replace("vh", "")) / 100) * 812;
  if (value.startsWith("clamp(")) {
    const inner = value.match(/clamp\(([^)]+)\)/)?.[1];
    if (inner) {
      const parts = inner.split(",").map((p) => p.trim());
      const vwPart = parts.find((p) => p.endsWith("vw"));
      if (vwPart) return (Number(vwPart.replace("vw", "")) / 100) * viewport;
      const remPart = parts.find((p) => p.endsWith("rem"));
      if (remPart) return Number(remPart.replace("rem", "")) * 16;
    }
  }
  if (value.startsWith("var(")) {
    const varName = value.match(/var\((--[^,)]+)/)?.[1];
    if (varName?.includes("gutter-mobile")) return 24;
    if (varName?.includes("gutter-desktop")) return 32;
    if (varName?.includes("space-hero")) return Math.max(48, viewport * 0.12);
  }
  return fallback;
}

function estimateWhitespaceRatio(
  rules: Map<string, string>,
  selector: string,
  viewport: { width: number; height: number },
): number {
  const width = parsePx(cssValue(rules, selector, "width"), viewport.width, viewport.width);
  const minHeight = parsePx(cssValue(rules, selector, "min-height"), viewport.height, viewport.height * 0.4);
  const padding = cssValue(rules, selector, "padding") ?? "0";
  const pad = parsePx(padding.split(" ")[0], viewport.width, 0);
  const contentW = Math.max(0, width - pad * 2);
  const contentH = Math.max(0, minHeight - pad * 2);
  const contentArea = contentW * contentH;
  const viewportArea = viewport.width * viewport.height;
  return contentArea / viewportArea;
}

function gridColumnsBelow768(rules: Map<string, string>, selector: string): number {
  const template = cssValue(rules, selector, "grid-template-columns");
  if (!template) return 1;
  const repeat = template.match(/repeat\((\d+)/);
  if (repeat) return Number(repeat[1]);
  return template.split(/\s+/).filter(Boolean).length;
}

export function scoreLayoutMetrics(html: string, config: QualityConfig): ScorerResult {
  const rows: ScorerResult["rows"] = [];
  const rules = parseCssRules(html);
  const heroSel = config.layout_metrics.hero.selector;
  const gridSel = config.layout_metrics.catalogue_grid.selector;
  const mobile = { width: 375, height: 812 };

  const heroWidthRaw = cssValue(rules, heroSel, "width") ?? "";
  const heroWidth = resolveCssVar(rules, heroWidthRaw);
  if (config.layout_metrics.hero.full_bleed_required && !heroWidth.includes("100vw")) {
    rows.push({
      floor_id: "layout_metrics",
      observed: heroWidth || "unset",
      threshold: "100vw",
      reference_violated: "full-bleed hero",
      status: "fail",
    });
  }

  if (config.layout_metrics.hero.card_in_card_forbidden) {
    const cardWrap = html.match(/class=["'][^"']*hero-card[^"']*["'][\s\S]*?data-maison=['"]hero['"]/i);
    if (cardWrap) {
      rows.push({
        floor_id: "layout_metrics",
        observed: "card-in-card hero",
        threshold: "forbidden",
        reference_violated: "maison hero frame",
        status: "fail",
      });
    }
  }

  const heroRatio = estimateWhitespaceRatio(rules, heroSel, mobile);
  if (heroRatio < config.layout_metrics.hero.whitespace_ratio_min) {
    rows.push({
      floor_id: "layout_metrics",
      observed: Number(heroRatio.toFixed(3)),
      threshold: config.layout_metrics.hero.whitespace_ratio_min,
      reference_violated: "hero whitespace",
      status: "fail",
    });
  }

  const cols = gridColumnsBelow768(rules, gridSel);
  if (cols > config.layout_metrics.catalogue_grid.columns_max_below_768) {
    rows.push({
      floor_id: "layout_metrics",
      observed: cols,
      threshold: config.layout_metrics.catalogue_grid.columns_max_below_768,
      reference_violated: "catalogue grid density",
      status: "fail",
    });
  }

  const gutterMobile = parsePx(
    cssValue(rules, gridSel, "gap") ?? cssValue(rules, ":root", "--gutter-mobile"),
    mobile.width,
    0,
  );
  if (gutterMobile > 0 && gutterMobile < config.layout_metrics.catalogue_grid.gutter_min_mobile_px) {
    rows.push({
      floor_id: "layout_metrics",
      observed: gutterMobile,
      threshold: config.layout_metrics.catalogue_grid.gutter_min_mobile_px,
      reference_violated: "mobile gutters",
      status: "fail",
    });
  }

  const failRows = rows.filter((r) => r.status === "fail");
  if (failRows.length === 0) {
    rows.push({
      floor_id: "layout_metrics",
      observed: Number(heroRatio.toFixed(3)),
      threshold: config.layout_metrics.hero.whitespace_ratio_min,
      status: "pass",
    });
  }

  return { rows };
}

/** Live preview: merge fetched HTML with shell CSS (e.g. globals.css) for 3b diff mode. */
export function scoreLayoutMetricsLive(
  html: string,
  cssContent: string,
  config: QualityConfig,
): ScorerResult {
  const combined = `${cssContent}\n<style>${cssContent}</style>\n${html}`;
  const rules = parseCssRules(combined);
  const rows: ScorerResult["rows"] = [];
  const heroSel = config.layout_metrics.hero.selector;
  const gridSel = config.layout_metrics.catalogue_grid.selector;
  const mobile = { width: 375, height: 812 };

  const heroBlock = extractMaisonBlock(html, "hero");
  const heroClass = heroBlock.match(/class=["']([^"']+)["']/i)?.[1] ?? "";
  const heroWidthRaw = cssValue(rules, heroSel, "width") ?? "";
  const heroWidth = resolveCssVar(rules, heroWidthRaw);

  if (config.layout_metrics.hero.full_bleed_required && !heroWidth.includes("100vw")) {
    const fullBleedOk =
      heroWidth.includes("100vw") ||
      heroClass.includes("100vw") ||
      heroBlock.includes('sizes="100vw"') ||
      cssContent.includes("--maison-hero-width: 100vw");
    if (!fullBleedOk) {
      rows.push({
        floor_id: "layout_metrics",
        observed: heroWidth || "unset",
        threshold: "100vw",
        reference_violated: "full-bleed hero",
        status: "fail",
      });
    }
  }

  if (config.layout_metrics.hero.card_in_card_forbidden) {
    const cardWrap = html.match(/class=["'][^"']*hero-card[^"']*["'][\s\S]*?data-maison=['"]hero['"]/i);
    if (cardWrap) {
      rows.push({
        floor_id: "layout_metrics",
        observed: "card-in-card hero",
        threshold: "forbidden",
        reference_violated: "maison hero frame",
        status: "fail",
      });
    }
  }

  const parsedMinH = parseTailwindViewportHeight(heroClass, mobile.height);
  const cssMinH = parsePx(cssValue(rules, heroSel, "min-height"), mobile.height, 0);
  const heroMinH = parsedMinH ?? cssMinH ?? (heroClass.includes("100svh") || heroClass.includes("100dvh") ? mobile.height : mobile.height * 0.4);
  const heroW = heroWidth.includes("100vw") ? mobile.width : mobile.width;
  const heroRatio = (heroW * heroMinH) / (mobile.width * mobile.height);

  if (heroRatio < config.layout_metrics.hero.whitespace_ratio_min) {
    rows.push({
      floor_id: "layout_metrics",
      observed: Number(heroRatio.toFixed(3)),
      threshold: config.layout_metrics.hero.whitespace_ratio_min,
      reference_violated: "hero whitespace",
      status: "fail",
    });
  }

  const gridBlock = extractMaisonBlock(html, "catalogue-grid");
  const gridIdx = gridBlock ? html.indexOf(gridBlock) : -1;
  const gridChunk = gridIdx >= 0 ? html.slice(gridIdx, gridIdx + 4000) : "";
  const flexGap = gridChunk.match(/\bgap-(\d+)\b/);
  const cols = gridColumnsBelow768(rules, gridSel);
  if (cols > config.layout_metrics.catalogue_grid.columns_max_below_768) {
    rows.push({
      floor_id: "layout_metrics",
      observed: cols,
      threshold: config.layout_metrics.catalogue_grid.columns_max_below_768,
      reference_violated: "catalogue grid density",
      status: "fail",
    });
  }

  const gutterMobile = flexGap
    ? Number(flexGap[1]) * 4
    : parsePx(
        cssValue(rules, gridSel, "gap") ?? cssValue(rules, ":root", "--gutter-mobile"),
        mobile.width,
        32,
      );
  if (gutterMobile > 0 && gutterMobile < config.layout_metrics.catalogue_grid.gutter_min_mobile_px) {
    rows.push({
      floor_id: "layout_metrics",
      observed: gutterMobile,
      threshold: config.layout_metrics.catalogue_grid.gutter_min_mobile_px,
      reference_violated: "mobile gutters",
      status: "fail",
    });
  }

  const failRows = rows.filter((r) => r.status === "fail");
  if (failRows.length === 0) {
    rows.push({
      floor_id: "layout_metrics",
      observed: Number(heroRatio.toFixed(3)),
      threshold: config.layout_metrics.hero.whitespace_ratio_min,
      status: "pass",
    });
  }

  return { rows };
}
