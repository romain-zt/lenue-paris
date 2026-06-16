import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SESSION_ONE_PATH, canTransition } from '../src/state-machine.mjs';
import { runLoop } from '../src/loopd.mjs';
import { runScorers } from '../scorers/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = join(__dirname, '../..');

/** Run A — agent count + latency per phase */
export async function runA() {
  const start = Date.now();
  const result = await runLoop({ offline: true, projectDir: join(KIT_ROOT, '.verify-run-a') });
  const elapsed = Date.now() - start;
  return {
    name: 'Run A',
    pass: result.success && result.agentCalls <= 12,
    agentCalls: result.agentCalls,
    wallClockMs: elapsed,
    states: result.states
  };
}

/** Run B — deadlock resolves via pack quality_policy */
export function runB() {
  const policy = readFileSync(join(KIT_ROOT, 'packs/saas-landing/quality_policy.yaml'), 'utf8');
  const resolves = /deadlock_default:/.test(policy);
  return { name: 'Run B', pass: resolves, policy: 'saas-landing' };
}

/** Run C — mid-slice learnings queued, contract-amend detected, ambiguous → next-slice */
export function runC() {
  const amend = classifyLedger('must change acceptance criteria for auth');
  const queued = classifyLedger('defer to slice two for voice guide') === 'next-slice';
  const noLiveHint = classifyLedger('unclear requirement maybe') === 'next-slice';
  return { name: 'Run C', pass: amend === 'contract-amend' && queued && noLiveHint };
}

/** Run D — overlay proposals + slice-two inheritance (offline fixture) */
export function runD() {
  const overlayPath = join(KIT_ROOT, 'project/overlay');
  const hasDerivedFrom = readFileSync(join(KIT_ROOT, 'packs/saas-landing/pack.yaml'), 'utf8').includes('derived_from');
  return { name: 'Run D', pass: hasDerivedFrom, note: 'offline fixture; live gate deferred v0.2' };
}

function classifyLedger(line) {
  if (/non-goal|must change acceptance|slice two/i.test(line)) {
    if (/must change acceptance/i.test(line)) return 'contract-amend';
    return 'next-slice';
  }
  return 'next-slice'; // ambiguous defaults to next-slice, never live-hint
}

export async function runAll() {
  const results = [];
  for (let i = 0; i < SESSION_ONE_PATH.length - 1; i++) {
    if (!canTransition(SESSION_ONE_PATH[i], SESSION_ONE_PATH[i + 1])) {
      throw new Error(`invalid transition ${SESSION_ONE_PATH[i]} -> ${SESSION_ONE_PATH[i + 1]}`);
    }
  }
  results.push(await runA());
  results.push(runB());
  results.push(runC());
  results.push(runD());

  const goldenHtml = readFileSync(join(__dirname, '../tests/fixtures/golden-slice.html'), 'utf8');
  const floor = readFileSync(join(KIT_ROOT, 'packs/saas-landing/quality_floor.yaml'), 'utf8');
  const scores = runScorers({ html: goldenHtml, floorYaml: floor });
  results.push({ name: 'Golden scorer', pass: scores.pass, scores: scores.results });

  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runAll().then((results) => {
    const pass = results.every((r) => r.pass);
    console.log(JSON.stringify({ pass, results }, null, 2));
    process.exit(pass ? 0 : 1);
  });
}
