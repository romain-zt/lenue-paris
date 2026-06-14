#!/usr/bin/env tsx
/**
 * framework-gap.ts — append-only log of detected SETUP gaps (the "auto-update the
 * setup as needed" queue).
 *
 * WHY: the self-improvement loop only ever reacted to manifest-declared-but-missing
 * files, so a gap an agent *discovers while working* ("we keep needing a reusable
 * Modal rule", "there's no agent for X") was never captured and never triggered an
 * improvement. This log is where agents record those gaps — mandatorily, at the
 * review step (see 64-self-improvement.mdc). `framework-audit.ts` then drains it and
 * fires the framework-improver to draft the artifact (+ manifest entry) on a PR.
 *
 * Append-only (`merge=union` in .gitattributes) so concurrent agents never conflict.
 *
 * Usage:
 *   tsx framework-gap.ts add "<what's missing/weak>" --kind <rule|skill|command|agent|hook|checker|template|workflow|unknown> \
 *       [--path <suggested .cursor/core/... path>] [--priority 0..5] [--actor <who>]
 *   tsx framework-gap.ts list [--open]
 *   tsx framework-gap.ts resolve <id> [--note "<how / PR link>"]
 */

import * as fs from "fs";
import * as path from "path";

export const GAP_LOG_PATH = path.join(process.cwd(), "docs/state/framework-gaps.ndjson");

const KINDS = ["rule", "skill", "command", "agent", "hook", "checker", "template", "workflow", "unknown"] as const;
export type GapKind = (typeof KINDS)[number];

export interface FrameworkGapEvent {
  id: string;
  ts: string;
  summary: string;
  kind: GapKind;
  /** Suggested target path under .cursor/core/ (optional). */
  suggestedPath?: string;
  /** 0 (urgent) … 5 (default). */
  priority: number;
  actor?: string;
  state: "open" | "resolved";
  note?: string;
}

function clampPriority(p: number): number {
  if (Number.isNaN(p)) return 3;
  return Math.min(5, Math.max(0, Math.round(p)));
}

function append(event: FrameworkGapEvent): void {
  fs.mkdirSync(path.dirname(GAP_LOG_PATH), { recursive: true });
  fs.appendFileSync(GAP_LOG_PATH, JSON.stringify(event) + "\n", "utf8");
}

export function readGaps(): FrameworkGapEvent[] {
  if (!fs.existsSync(GAP_LOG_PATH)) return [];
  const out: FrameworkGapEvent[] = [];
  for (const line of fs.readFileSync(GAP_LOG_PATH, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const e = JSON.parse(t) as FrameworkGapEvent;
      if (e && typeof e.id === "string") out.push(e);
    } catch {
      /* ignore corrupt line */
    }
  }
  return out;
}

/** Latest state per id. */
export function projectGaps(): FrameworkGapEvent[] {
  const byId = new Map<string, FrameworkGapEvent>();
  for (const e of readGaps()) {
    const prev = byId.get(e.id);
    if (!prev || e.ts >= prev.ts) byId.set(e.id, { ...prev, ...e });
  }
  return [...byId.values()];
}

/** Open gaps, priority asc then oldest first. */
export function openGapsByPriority(): FrameworkGapEvent[] {
  return projectGaps()
    .filter((e) => e.state !== "resolved")
    .sort((a, b) => (a.priority !== b.priority ? a.priority - b.priority : a.ts < b.ts ? -1 : 1));
}

export function resolveGap(id: string, note?: string): boolean {
  const existing = projectGaps().find((e) => e.id === id);
  if (!existing) return false;
  append({ ...existing, ts: new Date().toISOString(), state: "resolved", note });
  return true;
}

function parseFlags(argv: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      flags[key] = val;
    }
  }
  return flags;
}

function runCli(): void {
  const [cmd, ...rest] = process.argv.slice(2);

  if (cmd === "add") {
    const summary = rest.find((a) => !a.startsWith("--"));
    if (!summary) {
      console.error('Usage: framework-gap.ts add "<summary>" --kind <kind> [--path <p>] [--priority 0..5] [--actor <who>]');
      process.exit(1);
    }
    const flags = parseFlags(rest);
    const kind = (KINDS as readonly string[]).includes(flags.kind) ? (flags.kind as GapKind) : "unknown";
    const id = `fg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    append({
      id,
      ts: new Date().toISOString(),
      summary,
      kind,
      suggestedPath: flags.path,
      priority: clampPriority(parseInt(flags.priority ?? "3", 10)),
      actor: flags.actor ?? "agent",
      state: "open",
    });
    console.log(`✅ Recorded framework gap ${id} (${kind}, p${clampPriority(parseInt(flags.priority ?? "3", 10))}): ${summary}`);
    return;
  }

  if (cmd === "list") {
    const flags = parseFlags(rest);
    const items = flags.open ? openGapsByPriority() : projectGaps();
    if (items.length === 0) {
      console.log("ℹ️  No framework gaps.");
      return;
    }
    for (const e of items) {
      console.log(`P${e.priority} [${e.state}] ${e.id} (${e.kind}${e.suggestedPath ? ` → ${e.suggestedPath}` : ""}) — ${e.summary}`);
    }
    return;
  }

  if (cmd === "resolve") {
    const id = rest.find((a) => !a.startsWith("--"));
    if (!id) {
      console.error('Usage: framework-gap.ts resolve <id> [--note "<how>"]');
      process.exit(1);
    }
    const flags = parseFlags(rest);
    if (!resolveGap(id, flags.note)) {
      console.error(`❌ No framework gap with id "${id}".`);
      process.exit(1);
    }
    console.log(`✅ Resolved framework gap ${id}.`);
    return;
  }

  console.error("Usage: framework-gap.ts <add|list|resolve> …");
  process.exit(1);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]).endsWith("framework-gap.ts");
if (invokedDirectly) runCli();
