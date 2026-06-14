#!/usr/bin/env tsx
/**
 * status-log.ts — append-only status event log.
 *
 * WHY: `docs/state/status.json` is a single mutable file that many cloud agents
 * (and the orchestrator) used to *edit* concurrently. Concurrent edits to the
 * same JSON keys produce merge conflicts that stall the pipeline. The fix is to
 * make status changes **append-only**: every transition is one new line in
 * `docs/state/status-events.ndjson`. Append-only files merge cleanly when
 * `.gitattributes` marks them `merge=union`, so two branches that both record a
 * transition never conflict — git keeps both lines.
 *
 * `status.json` is kept as a *derived snapshot* (a cache) projected from the log
 * by the orchestrator. Agents must only append events here — never hand-edit
 * `status.json`.
 *
 * Usage (CLI, for cloud agents):
 *   npx --prefix .github/scripts/core tsx .github/scripts/core/status-log.ts set <stepId> <status> \
 *     [--note "<short note>"] [--blocker "NEED_HUMAN: ..."] [--actor "<who>"]
 *   npx --prefix .github/scripts/core tsx .github/scripts/core/status-log.ts project   # print derived status.json
 *
 * Library:
 *   import { appendStatusEvent, projectStatusFromLog, STATUS_VALUES } from "./status-log.ts";
 */

import * as fs from "fs";
import * as path from "path";

/**
 * The status lifecycle. `todo` is the alias for `not-started` (a fresh, eligible
 * step). The richer in-flight states make progress legible without changing the
 * orchestrator's readiness gate (only `todo`/`not-started`/unset is eligible to
 * fire). `complete` is the only state that satisfies a dependent's `dependsOn`.
 */
export const STATUS_VALUES = [
  "todo", // alias of not-started — queued, eligible once deps complete
  "not-started", // legacy alias of todo (kept for back-compat)
  "in-progress", // an agent owns it and is building
  "in-review", // implementation + tests done; under review (PR / reviewer agent)
  "validated", // re-test/validation passed and review approved; awaiting merge
  "to-qa-human", // needs a human QA pass before it can be called done
  "complete", // merged + done; unblocks dependents
  "blocked", // NEED_HUMAN — cannot proceed without a person
] as const;

export type StatusValue = (typeof STATUS_VALUES)[number];

/** Statuses that mean "do not fire a new agent for this step right now". */
export const NON_FIREABLE: ReadonlySet<StatusValue> = new Set([
  "in-progress",
  "in-review",
  "validated",
  "to-qa-human",
  "complete",
  "blocked",
]);

/** Statuses that should be surfaced as "a human is needed" (skipped, non-fatal). */
export const NEEDS_HUMAN: ReadonlySet<StatusValue> = new Set(["blocked", "to-qa-human"]);

export interface StatusEvent {
  /** ISO timestamp — primary ordering key. */
  ts: string;
  /** Pipeline step id. */
  step: string;
  /** New status value. */
  status: StatusValue;
  /** Optional short human note. */
  note?: string;
  /** Optional blocker text (used when status is blocked/to-qa-human). */
  blocker?: string;
  /** Who recorded it (agent label, "orchestrator", "cleanup", …). */
  actor?: string;
}

export const STATUS_LOG_PATH = path.join(process.cwd(), "docs/state/status-events.ndjson");

export function normalizeStatus(value: string): StatusValue {
  const v = value.trim() as StatusValue;
  if (!STATUS_VALUES.includes(v)) {
    throw new Error(`Unknown status "${value}". Expected one of: ${STATUS_VALUES.join(", ")}`);
  }
  // `todo` and `not-started` are interchangeable; keep what the caller passed.
  return v;
}

/** True when a status counts as a fresh, eligible-to-fire step. */
export function isFireable(status: StatusValue | undefined): boolean {
  if (!status) return true;
  if (status === "todo" || status === "not-started") return true;
  return !NON_FIREABLE.has(status);
}

/** True when a status satisfies a dependent step's `dependsOn`. Only `complete`. */
export function satisfiesDependency(status: StatusValue | undefined): boolean {
  return status === "complete";
}

/** Append a single status event to the append-only log (creates the file if needed). */
export function appendStatusEvent(event: Omit<StatusEvent, "ts"> & { ts?: string }): void {
  const line = JSON.stringify({
    ts: event.ts ?? new Date().toISOString(),
    step: event.step,
    status: normalizeStatus(event.status),
    ...(event.note ? { note: event.note } : {}),
    ...(event.blocker ? { blocker: event.blocker } : {}),
    ...(event.actor ? { actor: event.actor } : {}),
  });
  fs.mkdirSync(path.dirname(STATUS_LOG_PATH), { recursive: true });
  // Always start on a fresh line so `merge=union` keeps every event intact.
  const prefix = fs.existsSync(STATUS_LOG_PATH) && fs.readFileSync(STATUS_LOG_PATH, "utf8").endsWith("\n") ? "" : "";
  fs.appendFileSync(STATUS_LOG_PATH, prefix + line + "\n", "utf8");
}

/** Parse a log body (ndjson string) into events, skipping blank/corrupt lines. */
export function parseStatusLog(raw: string): StatusEvent[] {
  const events: StatusEvent[] = [];
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const e = JSON.parse(trimmed) as StatusEvent;
      if (e && typeof e.step === "string" && typeof e.status === "string") events.push(e);
    } catch {
      /* ignore corrupt line */
    }
  }
  return events;
}

/**
 * Project the latest status per step from a log body. Ordering: by `ts` ascending,
 * with original line order as a stable tie-break (so the last-written line wins
 * even when timestamps collide). Union-merged logs may interleave lines from two
 * branches; ts ordering gives a deterministic result.
 */
export function projectStatus(events: StatusEvent[]): Record<string, StatusEvent> {
  const indexed = events.map((e, i) => ({ e, i }));
  indexed.sort((a, b) => {
    if (a.e.ts !== b.e.ts) return a.e.ts < b.e.ts ? -1 : 1;
    return a.i - b.i;
  });
  const latest: Record<string, StatusEvent> = {};
  for (const { e } of indexed) latest[e.step] = e;
  return latest;
}

/** Read + project the on-disk log. Returns {} when the log does not exist. */
export function projectStatusFromLog(logPath: string = STATUS_LOG_PATH): Record<string, StatusEvent> {
  if (!fs.existsSync(logPath)) return {};
  return projectStatus(parseStatusLog(fs.readFileSync(logPath, "utf8")));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

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

  if (cmd === "set") {
    const [step, status] = rest;
    if (!step || !status) {
      console.error('Usage: status-log.ts set <stepId> <status> [--note "…"] [--blocker "…"] [--actor "…"]');
      process.exit(1);
    }
    const flags = parseFlags(rest.slice(2));
    appendStatusEvent({
      step,
      status: normalizeStatus(status),
      note: flags.note,
      blocker: flags.blocker,
      actor: flags.actor ?? "agent",
    });
    console.log(`✅ Appended status event: ${step} → ${status}`);
    return;
  }

  if (cmd === "project") {
    const latest = projectStatusFromLog();
    const steps: Record<string, StatusValue> = {};
    for (const [step, e] of Object.entries(latest)) steps[step] = e.status;
    console.log(JSON.stringify({ orchestration: { steps } }, null, 2));
    return;
  }

  console.error("Usage: status-log.ts <set|project> …");
  process.exit(1);
}

// Only run the CLI when invoked directly (not when imported).
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]).endsWith("status-log.ts");
if (invokedDirectly) runCli();
