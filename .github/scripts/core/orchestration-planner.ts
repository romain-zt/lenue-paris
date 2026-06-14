/**
 * Append docs/state/orchestration.planner-queue.json → orchestration.pipeline.json,
 * seed docs/state/status.json for new step ids, commit/push.
 *
 * Project-agnostic: drives the pipeline purely from JSON state files.
 *
 * Env:
 *   PLANNER_CLEAR_QUEUE=1       — after a successful append, set planner-queue steps to []
 *   ORCHESTRATION_WRITE_ONLY=1  — write JSON only; let the workflow commit once (batch mode)
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { appendStatusEvent } from "./status-log";

const ROOT = process.cwd();
const PIPELINE_PATH = path.join(ROOT, "docs/state/orchestration.pipeline.json");
const PLANNER_QUEUE_PATH = path.join(ROOT, "docs/state/orchestration.planner-queue.json");
const STATUS_PATH = path.join(ROOT, "docs/state/status.json");
const STATUS_LOG_REL = "docs/state/status-events.ndjson";

type PhaseStatus = "not-started" | "in-progress" | "complete" | "blocked";

interface StatusJson {
  orchestration?: {
    steps?: Record<string, PhaseStatus>;
    blocker?: string;
  };
  [key: string]: unknown;
}

interface PipelineWorkloadSlice {
  kind: "slice";
  title: string;
  featureAreaFile: string;
  scopeSliceFile: string;
  userStoryFile: string | null;
  planFile: string | null;
  notes?: string;
}

interface PipelineStepRow {
  id: string;
  dependsOn: string[];
  workload: PipelineWorkloadSlice;
  /** Optional scheduling priority 0 (highest) – 5 (lowest, default). See 61-input-queue.mdc. */
  priority?: number;
}

interface PipelineConfig {
  version: number;
  description?: string;
  steps: PipelineStepRow[];
}

interface PlannerQueueFile {
  version?: number;
  description?: string;
  steps: PipelineStepRow[];
}

function gitExec(cmd: string): void {
  execSync(`git ${cmd}`, { stdio: "inherit" });
}

function loadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function validateStepRow(step: PipelineStepRow, index: number): void {
  if (!step?.id || typeof step.id !== "string") {
    console.error(`❌ planner-queue steps[${index}]: missing string id`);
    process.exit(1);
  }
  if (!Array.isArray(step.dependsOn)) {
    console.error(`❌ planner-queue steps[${index}] (${step.id}): dependsOn must be an array`);
    process.exit(1);
  }
  if (step.priority !== undefined && (typeof step.priority !== "number" || step.priority < 0 || step.priority > 5)) {
    console.error(`❌ planner-queue steps[${index}] (${step.id}): priority must be a number 0–5`);
    process.exit(1);
  }
  const w = step.workload;
  if (!w || typeof w !== "object" || w.kind !== "slice") {
    console.error(`❌ planner-queue steps[${index}] (${step.id}): workload.kind must be "slice"`);
    process.exit(1);
  }
  for (const field of ["title", "featureAreaFile", "scopeSliceFile"] as const) {
    if (!w[field] || typeof w[field] !== "string") {
      console.error(`❌ planner-queue steps[${index}] (${step.id}): slice workload missing ${field}`);
      process.exit(1);
    }
  }
}

function main(): void {
  /** CI batch: write JSON only; the workflow commits once after PRD sync + planner */
  const writeOnly = process.env.ORCHESTRATION_WRITE_ONLY === "1" || process.env.ORCHESTRATION_WRITE_ONLY === "true";
  const clearQueue = process.env.PLANNER_CLEAR_QUEUE === "1";

  if (!fs.existsSync(PLANNER_QUEUE_PATH)) {
    console.error(`❌ Missing ${PLANNER_QUEUE_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(PIPELINE_PATH)) {
    console.error(`❌ Missing ${PIPELINE_PATH}`);
    process.exit(1);
  }
  if (!fs.existsSync(STATUS_PATH)) {
    console.error(`❌ Missing ${STATUS_PATH}`);
    process.exit(1);
  }

  const queue = loadJson<PlannerQueueFile>(PLANNER_QUEUE_PATH);
  if (!queue.steps?.length) {
    console.log("ℹ️  orchestration.planner-queue.json has no steps — nothing to append.");
    process.exit(0);
  }

  const pipeline = loadJson<PipelineConfig>(PIPELINE_PATH);
  if (!pipeline.steps?.length) {
    console.error("❌ orchestration.pipeline.json has empty steps[]");
    process.exit(1);
  }

  const existingIds = new Set(pipeline.steps.map((s) => s.id));
  const toAppend: PipelineStepRow[] = [];

  queue.steps.forEach((step, index) => validateStepRow(step, index));

  for (const step of queue.steps) {
    if (existingIds.has(step.id)) {
      console.log(`⏭️  Skip duplicate pipeline id "${step.id}"`);
      continue;
    }
    for (const dep of step.dependsOn) {
      if (!existingIds.has(dep)) {
        console.error(
          `❌ Step "${step.id}" depends on unknown id "${dep}" (must exist in pipeline or earlier in planner queue).`,
        );
        process.exit(1);
      }
    }
    toAppend.push(step);
    existingIds.add(step.id);
  }

  if (toAppend.length === 0) {
    console.log("ℹ️  No new steps to append (all duplicates or skipped).");
    process.exit(0);
  }

  pipeline.steps.push(...toAppend);
  fs.writeFileSync(PIPELINE_PATH, `${JSON.stringify(pipeline, null, 2)}\n`);

  const status = loadJson<StatusJson>(STATUS_PATH);
  status.orchestration ??= {};
  status.orchestration.steps ??= {};
  for (const s of toAppend) {
    if (status.orchestration.steps![s.id] === undefined) {
      status.orchestration.steps![s.id] = "not-started";
      // Append-only log is the source of truth — seed a `todo` event too.
      appendStatusEvent({ step: s.id, status: "todo", actor: "planner", note: "queued from planner-queue" });
    }
  }
  fs.writeFileSync(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`);

  if (clearQueue) {
    queue.steps = [];
    fs.writeFileSync(PLANNER_QUEUE_PATH, `${JSON.stringify(queue, null, 2)}\n`);
  }

  const ids = toAppend.map((s) => s.id).join(", ");

  if (writeOnly) {
    console.log(`✅ Planner (write-only) staged ${toAppend.length} step(s): ${ids}`);
    process.exit(0);
  }

  gitExec(`config user.email "github-actions[bot]@users.noreply.github.com"`);
  gitExec(`config user.name "github-actions[bot]"`);
  gitExec(`add docs/state/orchestration.pipeline.json docs/state/status.json ${STATUS_LOG_REL}`);
  if (clearQueue) {
    gitExec(`add docs/state/orchestration.planner-queue.json`);
  }
  gitExec(`commit -m "chore(orchestrator): planner appended ${ids} [skip ci]"`);
  gitExec(`push`);

  console.log(`✅ Appended ${toAppend.length} step(s): ${ids}`);
}

main();
