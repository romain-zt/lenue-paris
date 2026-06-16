/**
 * Deterministic quality scorers — no LLM required.
 * @param {{ html: string, floorYaml: string }} input
 */
export function runScorers({ html, floorYaml = '' }) {
  const results = {
    readability: scoreReadability(html),
    designTokens: scoreDesignTokens(html),
    seoMeta: scoreSeoMeta(html),
    altCoverage: scoreAltCoverage(html)
  };

  const floors = parseFloors(floorYaml);
  const pass = Object.entries(floors).every(([key, min]) => (results[key]?.score ?? 0) >= min);

  return { pass, results, floors };
}

function parseFloors(yaml) {
  const floors = { readability: 0.5, designTokens: 1, seoMeta: 1, altCoverage: 1 };
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w+):\s*([\d.]+)/);
    if (m) floors[m[1]] = parseFloat(m[2]);
  }
  return floors;
}

function scoreReadability(html) {
  const text = html.replace(/<[^>]+>/g, ' ').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWords = words.length / Math.max(sentences.length, 1);
  const score = avgWords <= 20 ? 0.9 : avgWords <= 30 ? 0.7 : 0.4;
  return { score, avgWordsPerSentence: avgWords };
}

function scoreDesignTokens(html) {
  const hasRoot =/:root\s*\{/.test(html);
  const hasVar = /var\s*\(--/.test(html);
  const score = hasRoot && hasVar ? 1 : hasRoot ? 0.5 : 0;
  return { score, hasRoot, hasVar };
}

function scoreSeoMeta(html) {
  const hasDescription = /<meta\s+name=["']description["']/i.test(html);
  const hasViewport = /<meta\s+name=["']viewport["']/i.test(html);
  const score = (hasDescription ? 0.5 : 0) + (hasViewport ? 0.5 : 0);
  return { score, hasDescription, hasViewport };
}

function scoreAltCoverage(html) {
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)];
  if (imgs.length === 0) return { score: 1, coverage: 1 };
  const withAlt = imgs.filter((m) => /\balt=["'][^"']+["']/i.test(m[0])).length;
  const coverage = withAlt / imgs.length;
  return { score: coverage, coverage, total: imgs.length };
}
