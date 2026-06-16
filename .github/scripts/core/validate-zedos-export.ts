/**
 * Tier-1 validate for Zedos ship-first handoff (no cloud agent).
 * Skips when zedos.manifest.json is absent (non-Zedos repos).
 */

import fs from "node:fs";
import path from "node:path";
import { isFlowInventoryV0Yes, normalizeFlowCell, parseFlowInventory } from "./sync-prd-orchestration";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "zedos.manifest.json");
const PROJECT_CONFIG = path.join(ROOT, "docs/project.config.md");
const EXECUTION_LOCK = path.join(ROOT, "docs/EXECUTION_LOCK.md");
const PRD = path.join(ROOT, "docs/prd/PRD.md");
const PIPELINE = path.join(ROOT, "docs/state/orchestration.pipeline.json");
const FLOW_MAP = path.join(ROOT, "docs/state/orchestration.prd-flow-map.json");

interface Manifest {
  export_kind?: string;
  journey_mode?: string;
  promoted_flows?: string[];
}

function fail(msg: string): void {
  console.error(`❌ validate-zedos-export: ${msg}`);
  process.exit(1);
}

function main(): void {
  if (!fs.existsSync(MANIFEST)) {
    console.log("ℹ️  No zedos.manifest.json — skip Zedos export validate.");
    process.exit(0);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as Manifest;
  const exportKind = manifest.export_kind ?? "ignition";

  if (exportKind === "narrative") {
    console.log("✅ narrative export — lightweight validate OK.");
    process.exit(0);
  }

  if (!fs.existsSync(PROJECT_CONFIG)) fail("missing docs/project.config.md");
  const cfg = fs.readFileSync(PROJECT_CONFIG, "utf8");
  if (!/Implementation governance enabled:\*\*\s*yes/i.test(cfg)) {
    fail("project.config must have Implementation governance enabled: yes");
  }
  if (!/Autonomous decomposition enabled:\*\*\s*no/i.test(cfg)) {
    fail("project.config must have Autonomous decomposition enabled: no");
  }

  if (fs.existsSync(EXECUTION_LOCK)) {
    const lock = fs.readFileSync(EXECUTION_LOCK, "utf8");
    if (/forbidden_files:\s*\n\s+- src\/\*\*/.test(lock)) {
      fail("EXECUTION_LOCK still forbids src/** — set forbidden_files: [] for ignition");
    }
  }

  if (!fs.existsSync(PIPELINE)) fail("missing orchestration.pipeline.json");
  const pipeline = JSON.parse(fs.readFileSync(PIPELINE, "utf8")) as {
    steps: Array<{
      workload?: {
        kind?: string;
        scopeSliceFile?: string;
        userStoryFile?: string | null;
        planFile?: string | null;
      };
    }>;
  };

  for (const step of pipeline.steps) {
    if (step.workload?.kind !== "slice") continue;
    const us = step.workload.userStoryFile?.trim();
    const plan = step.workload.planFile?.trim();
    if (!us && !plan) continue; // bootstrap anchor — not a product slice
    if (!us || !plan) fail(`pipeline slice missing userStoryFile/planFile wiring`);
    if (!fs.existsSync(path.join(ROOT, us))) fail(`missing ${us}`);
    if (!fs.existsSync(path.join(ROOT, plan))) fail(`missing ${plan}`);
  }

  if (manifest.journey_mode === "express" && fs.existsSync(PRD)) {
    const inventory = parseFlowInventory(fs.readFileSync(PRD, "utf8"));
    for (const row of inventory) {
      if (!/post-prd pipeline/i.test(row.flow)) continue;
      if (row.v0Yes) {
        fail("express journey: post-PRD Flow Inventory row must not be Shipped=Yes");
      }
    }
  }

  if (exportKind === "delta" && manifest.promoted_flows?.length && fs.existsSync(FLOW_MAP)) {
    const map = JSON.parse(fs.readFileSync(FLOW_MAP, "utf8")) as { flows?: Record<string, unknown> };
    for (const flow of manifest.promoted_flows) {
      const key = normalizeFlowCell(flow);
      if (!map.flows?.[key]) fail(`promoted flow not in prd-flow-map: ${flow}`);
    }
  }

  console.log("✅ validate-zedos-export passed.");
}

main();
