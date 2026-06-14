#!/usr/bin/env tsx
/**
 * inbox.ts — append-only priority input queue (the `/btw` "by the way, put that
 * in the pipe" queue).
 *
 * WHY: you want to drop a thought/input into the pipeline at any time without
 * stopping to fully spec it, and tag how urgent it is. Items are recorded
 * append-only in `docs/state/inbox.ndjson` (`merge=union`, never edited) so two
 * agents can both add items without conflict. A manager/decomposer drains the
 * queue lowest-priority-number-first; priority 0 means "pick this next run,
 * absolutely". See `.cursor/core/rules/61-input-queue.mdc`.
 *
 * Usage:
 *   tsx inbox.ts add "<text>" [--priority 0..5] [--actor "<who>"] [--tag <tag>]
 *   tsx inbox.ts list [--open]        # show items (—open = not yet resolved), priority-sorted
 *   tsx inbox.ts resolve <id> [--note "<how>"]
 */

import * as fs from "fs";
import * as path from "path";

export const INBOX_PATH = path.join(process.cwd(), "docs/state/inbox.ndjson");

export interface InboxEvent {
  /** Stable id (also used to resolve). */
  id: string;
  /** ISO timestamp. */
  ts: string;
  /** What to do / consider. */
  text: string;
  /** 0 (highest — pick next absolutely) … 5 (lowest, default). */
  priority: number;
  /** Optional free tag (e.g. "bug", "copy", "refactor"). */
  tag?: string;
  /** Who added it. */
  actor?: string;
  /** Lifecycle: "queued" | "resolved". A resolve appends a new line; latest wins. */
  state: "queued" | "resolved";
  /** Optional note recorded at resolve time. */
  note?: string;
}

function clampPriority(p: number): number {
  if (Number.isNaN(p)) return 5;
  return Math.min(5, Math.max(0, Math.round(p)));
}

function appendInbox(event: InboxEvent): void {
  fs.mkdirSync(path.dirname(INBOX_PATH), { recursive: true });
  fs.appendFileSync(INBOX_PATH, JSON.stringify(event) + "\n", "utf8");
}

export function readInbox(): InboxEvent[] {
  if (!fs.existsSync(INBOX_PATH)) return [];
  const events: InboxEvent[] = [];
  for (const line of fs.readFileSync(INBOX_PATH, "utf8").split("\n")) {
    const t = line.trim();
    if (!t) continue;
    try {
      const e = JSON.parse(t) as InboxEvent;
      if (e && typeof e.id === "string") events.push(e);
    } catch {
      /* ignore corrupt line */
    }
  }
  return events;
}

/** Collapse the event log to the latest state per id. */
export function projectInbox(): InboxEvent[] {
  const byId = new Map<string, InboxEvent>();
  for (const e of readInbox()) {
    const prev = byId.get(e.id);
    if (!prev || e.ts >= prev.ts) byId.set(e.id, { ...prev, ...e });
  }
  return [...byId.values()];
}

/** Open items, sorted priority asc (0 first) then oldest first. */
export function openItemsByPriority(): InboxEvent[] {
  return projectInbox()
    .filter((e) => e.state !== "resolved")
    .sort((a, b) => (a.priority !== b.priority ? a.priority - b.priority : a.ts < b.ts ? -1 : 1));
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
    const text = rest.find((a) => !a.startsWith("--"));
    if (!text) {
      console.error('Usage: inbox.ts add "<text>" [--priority 0..5] [--tag <tag>] [--actor <who>]');
      process.exit(1);
    }
    const flags = parseFlags(rest);
    const priority = clampPriority(parseInt(flags.priority ?? "5", 10));
    const id = `btw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    appendInbox({
      id,
      ts: new Date().toISOString(),
      text,
      priority,
      tag: flags.tag,
      actor: flags.actor ?? "user",
      state: "queued",
    });
    console.log(`✅ Queued ${id} (priority ${priority}${priority === 0 ? " — next run, absolutely" : ""}): ${text}`);
    return;
  }

  if (cmd === "list") {
    const flags = parseFlags(rest);
    const items = flags.open ? openItemsByPriority() : projectInbox();
    if (items.length === 0) {
      console.log("ℹ️  Inbox empty.");
      return;
    }
    for (const e of items) {
      console.log(`P${e.priority} [${e.state}] ${e.id} ${e.tag ? `(${e.tag}) ` : ""}— ${e.text}`);
    }
    return;
  }

  if (cmd === "resolve") {
    const id = rest.find((a) => !a.startsWith("--"));
    if (!id) {
      console.error('Usage: inbox.ts resolve <id> [--note "<how>"]');
      process.exit(1);
    }
    const flags = parseFlags(rest);
    const existing = projectInbox().find((e) => e.id === id);
    if (!existing) {
      console.error(`❌ No inbox item with id "${id}".`);
      process.exit(1);
    }
    appendInbox({ ...existing, ts: new Date().toISOString(), state: "resolved", note: flags.note });
    console.log(`✅ Resolved ${id}.`);
    return;
  }

  console.error("Usage: inbox.ts <add|list|resolve> …");
  process.exit(1);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]).endsWith("inbox.ts");
if (invokedDirectly) runCli();
