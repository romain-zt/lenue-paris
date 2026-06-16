/**
 * Luxury Brand Gate worker allowlist — binds Manager prompts to frozen scope slices
 * and open maison floor failures, never live PRD.md (Step 3c contract).
 */
import fs from "node:fs";
import path from "node:path";

export const PRD_REL = "docs/prd/PRD.md";
export const LUXURY_LOG_REL = "docs/state/luxury-review-log.ndjson";

export interface LuxuryFloorRow {
  floor_id: string;
  observed: string;
  threshold: string;
  reference_violated?: string;
  status: "pass" | "fail" | "blocked" | "resolved";
  kind?: string;
}

export interface CompileManagerAllowlistInput {
  repoRoot: string;
  scopeSliceFile: string;
  featureAreaFile?: string;
  basePrompt: string;
  /** Test-only: simulates PRD injection — must abort compile. */
  prdInjection?: string;
  luxuryLogRel?: string;
  remediation?: boolean;
}

export interface CompileManagerAllowlistResult {
  ok: boolean;
  reason?: string;
  prompt: string;
  openFloors: LuxuryFloorRow[];
  can_pr_ready: boolean;
}

const PRD_MARKERS = [/docs\/prd\/PRD\.md/i, /\bPRD\.md\b/];

function resolveRepoPath(repoRoot: string, rel: string): string {
  return path.join(repoRoot, rel);
}

function readTextFile(repoRoot: string, rel: string): string | null {
  const abs = resolveRepoPath(repoRoot, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, "utf8");
}

function containsPrdBody(text: string): boolean {
  for (const marker of PRD_MARKERS) {
    if (marker.test(text)) return true;
  }
  return false;
}

function parseLuxuryLogLines(raw: string): LuxuryFloorRow[] {
  const rows: LuxuryFloorRow[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const entry = JSON.parse(trimmed) as {
        rows?: LuxuryFloorRow[];
        failures?: LuxuryFloorRow[];
      };
      for (const row of [...(entry.rows ?? []), ...(entry.failures ?? [])]) {
        if (row.floor_id && row.status) rows.push(row);
      }
    } catch {
      /* skip malformed lines */
    }
  }
  return rows;
}

/** Open floors: last status per floor_id; fail wins until resolved. */
export function getOpenLuxuryFloors(logContent: string): LuxuryFloorRow[] {
  const chronology = parseLuxuryLogLines(logContent);
  const byId = new Map<string, LuxuryFloorRow>();
  for (const row of chronology) {
    if (row.status === "resolved") {
      byId.delete(row.floor_id);
      continue;
    }
    if (row.status === "fail") {
      byId.set(row.floor_id, row);
    }
  }
  return [...byId.values()];
}

export function canPrReady(openFloors: LuxuryFloorRow[]): boolean {
  return openFloors.length === 0;
}

export function readLuxuryLogTail(repoRoot: string, logRel = LUXURY_LOG_REL, maxLines = 8): string {
  const raw = readTextFile(repoRoot, logRel);
  if (!raw) return "";
  return raw
    .trim()
    .split("\n")
    .slice(-maxLines)
    .join("\n");
}

export function formatOpenFloorsForRemediation(openFloors: LuxuryFloorRow[]): string {
  if (openFloors.length === 0) return "";
  return openFloors
    .map((row) => JSON.stringify(row))
    .join("\n");
}

/**
 * Compile Manager worker prompt under luxury allowlist.
 * Aborts if PRD body would leak; injects scope slice + luxury log tail.
 */
export function compileManagerAllowlist(
  input: CompileManagerAllowlistInput,
): CompileManagerAllowlistResult {
  const logRel = input.luxuryLogRel ?? LUXURY_LOG_REL;
  const logRaw = readTextFile(input.repoRoot, logRel) ?? "";
  const openFloors = getOpenLuxuryFloors(logRaw);
  const can_pr_ready = canPrReady(openFloors);

  if (input.prdInjection) {
    return {
      ok: false,
      reason: "freeze violation: docs/prd/PRD.md injection blocked",
      prompt: "",
      openFloors,
      can_pr_ready: false,
    };
  }

  const prdOnDisk = readTextFile(input.repoRoot, PRD_REL);
  if (prdOnDisk && containsPrdBody(input.basePrompt)) {
    return {
      ok: false,
      reason: "freeze violation: compiled prompt references docs/prd/PRD.md",
      prompt: "",
      openFloors,
      can_pr_ready: false,
    };
  }

  const scopeSliceBody = readTextFile(input.repoRoot, input.scopeSliceFile);
  if (!scopeSliceBody) {
    return {
      ok: false,
      reason: `missing scope slice: ${input.scopeSliceFile}`,
      prompt: "",
      openFloors,
      can_pr_ready: false,
    };
  }

  const logTail = readLuxuryLogTail(input.repoRoot, logRel);
  const openFloorBlock = formatOpenFloorsForRemediation(openFloors);

  const luxurySection = `## Luxury Brand Gate allowlist (mandatory)

You MUST NOT read or cite \`${PRD_REL}\`. Bind only to the frozen Scope Slice below and \`${logRel}\` tail.
${
  input.featureAreaFile
    ? `\nFeature Area path (metadata only — do not open \`${PRD_REL}\`): \`${input.featureAreaFile}\`\n`
    : ""
}
### Frozen Scope Slice — \`${input.scopeSliceFile}\`
\`\`\`markdown
${scopeSliceBody.trim()}
\`\`\`

### Luxury review log tail (\`${logRel}\`)
\`\`\`ndjson
${logTail || "(empty)"}
\`\`\`

### Open maison floor failures (must fix before \`gh pr ready\`)
\`can_pr_ready: ${can_pr_ready}\`
${
  openFloorBlock
    ? `\`\`\`json\n${openFloorBlock}\n\`\`\`\n`
    : "(none — run \`npm run luxury-gate -- --diff apps/web --slice storefront-shell--global-chrome --preview-url http://localhost:3001/fr\` from \`.github/scripts/core\` before marking ready.)\n"
}
Before \`gh pr ready\`, run the luxury gate on \`apps/web\` and ensure every open \`floor_id\` is resolved. If any row above has \`status: fail\`, do NOT call \`gh pr ready\`.
`;

  const remediationSection =
    input.remediation && openFloors.length > 0
      ? `\n## Maison floor remediation (verbatim failures)\nFix each row below on \`apps/web\` before re-running the gate:\n\`\`\`json\n${openFloorBlock}\n\`\`\`\n`
      : "";

  const prompt = `${input.basePrompt.trim()}\n\n${luxurySection}${remediationSection}`;

  if (prdOnDisk && prompt.includes(prdOnDisk.slice(0, 200))) {
    return {
      ok: false,
      reason: "freeze violation: PRD body leaked into compiled prompt",
      prompt: "",
      openFloors,
      can_pr_ready: false,
    };
  }

  return {
    ok: true,
    prompt,
    openFloors,
    can_pr_ready,
  };
}
