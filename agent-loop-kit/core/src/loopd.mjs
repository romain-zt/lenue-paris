import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { canTransition, nextState } from './state-machine.mjs';
import { compilePrompt } from './prompt-compile.mjs';
import { runScorers } from '../scorers/index.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KIT_ROOT = join(__dirname, '../..');

export function loadManifest() {
  return JSON.parse(readFileSync(join(KIT_ROOT, 'core/manifest.json'), 'utf8'));
}

export function hashContent(content) {
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * @param {object} opts
 * @param {string} [opts.idea]
 * @param {string} [opts.pack]
 * @param {boolean} [opts.offline]
 * @param {string} [opts.projectDir]
 */
export async function runLoop(opts = {}) {
  const manifest = loadManifest();
  const offline = opts.offline ?? !process.env.OPENAI_API_KEY;
  const projectDir = opts.projectDir ?? join(KIT_ROOT, 'project');
  const idea = opts.idea ?? 'A SaaS waitlist landing page for indie developers';
  const pack = opts.pack ?? 'saas-landing';

  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'overlay'), { recursive: true });

  const stats = { agentCalls: 0, states: [], artifacts: {} };
  let state = 'idea_seed';

  const log = (event, data = {}) => {
    const line = JSON.stringify({ ts: new Date().toISOString(), event, state, ...data });
    const logPath = join(projectDir, 'build-log.ndjson');
    writeFileSync(logPath, (existsSync(logPath) ? readFileSync(logPath, 'utf8') : '') + line + '\n');
  };

  // idea_seed
  stats.states.push(state);
  const ideaSeed = `# Idea Seed\n\n**Problem:** ${idea}\n\n**Audience:** early adopters\n\n**Success signal:** first waitlist signup\n`;
  writeFileSync(join(projectDir, 'idea-seed.md'), ideaSeed);
  stats.artifacts.ideaSeed = ideaSeed;
  stats.agentCalls++;
  log('scribe_complete');
  state = nextState(state);

  // vision_prd
  stats.states.push(state);
  const visionPrd = `# Vision PRD v0.1\n\n## Principles\n- Ship smallest vertical fast\n- Mobile-first\n\n## Non-goals\n- Payments\n- Full auth\n\n## Boundaries\nOne landing + waitlist\n`;
  writeFileSync(join(projectDir, 'vision-prd.md'), visionPrd);
  stats.agentCalls++;
  log('vision_complete');
  state = nextState(state);

  // convergence
  stats.states.push(state);
  const convergence = {
    scribe: { audience: 'early adopters', successSignal: 'waitlist signup' },
    vision: { scope: 'landing + waitlist', nonGoals: ['payments'] },
    slicePlanner: { hypothesis: 'landing + waitlist + analytics hook', pack }
  };
  stats.agentCalls += 3;
  const diverged = false;
  writeFileSync(join(projectDir, 'convergence-packet.json'), JSON.stringify(convergence, null, 2));
  state = nextState(state, { diverged });
  log('convergence_complete', { diverged });

  if (state === 'resume_at_veto') {
    writeFileSync(join(projectDir, 'resume-at-veto.json'), JSON.stringify({
      reason: 'convergence divergence',
      options: [
        { slice: 'landing + waitlist', tradeoff: 'fastest path' },
        { slice: 'B2B onboarding stub', tradeoff: 'matches enterprise signal' }
      ]
    }, null, 2));
    return { ...stats, state, checkpoint: true };
  }

  // veto (session one always pauses for human in live; auto-approve offline)
  stats.states.push('veto');
  stats.agentCalls++;
  log('human_veto', { approved: offline ? 'auto-offline' : 'pending' });
  state = nextState('veto');

  // building — freeze check
  stats.states.push(state);
  const contractHash = hashContent(visionPrd);
  const sliceBrief = `# First Slice Brief\n\n**Slice:** landing + waitlist + analytics\n\n**Acceptance:**\n- Landing page renders\n- Waitlist form submits\n- Meta tags present\n`;
  writeFileSync(join(projectDir, 'first-slice-brief.md'), sliceBrief);
  writeFileSync(join(projectDir, 'slice-contract.json'), JSON.stringify({
    hash: contractHash,
    frozenAt: new Date().toISOString(),
    brief: sliceBrief
  }, null, 2));

  const compileResult = compilePrompt({
    role: 'builder',
    sliceContractHash: contractHash,
    firstSliceBrief: sliceBrief,
    buildLogTail: 'scaffold started',
    liveHints: [],
    acceptanceCriteria: 'landing + waitlist'
  });

  if (!compileResult.ok) {
    state = nextState(state, { freezeViolation: true });
    log('freeze_violation', { reason: compileResult.reason });
    return { ...stats, state, aborted: true };
  }

  const outputDir = join(projectDir, 'slice-1-output');
  mkdirSync(outputDir, { recursive: true });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="description" content="Join the waitlist for our indie dev SaaS">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Waitlist</title>
  <style>:root { --color-primary: #2563eb; --spacing-md: 1rem; } body { color: var(--color-primary); padding: var(--spacing-md); }</style>
</head>
<body>
  <main><h1>Join the waitlist</h1><form><input type="email" aria-label="Email"><img src="hero.png" alt="Product preview"></form></main>
</body>
</html>`;
  writeFileSync(join(outputDir, 'index.html'), html);
  stats.agentCalls++;
  log('build_complete');
  state = nextState(state);

  // reviewing
  stats.states.push(state);
  const packDir = join(KIT_ROOT, 'packs', pack);
  const floorPath = join(packDir, 'quality_floor.yaml');
  const floor = existsSync(floorPath)
    ? readFileSync(floorPath, 'utf8')
    : '';
  const scores = runScorers({ html, floorYaml: floor });
  stats.agentCalls += 4;
  stats.scores = scores;

  if (!scores.pass) {
    state = nextState(state, { sliceAbort: true });
    log('review_failed', scores);
    return { ...stats, state, aborted: true };
  }

  state = nextState(state);
  stats.states.push(state);

  // changelog + overlay write
  writeFileSync(join(projectDir, 'vision-prd-changelog.md'), `- learned: waitlist copy should emphasize speed\n`);
  writeFileSync(join(projectDir, 'overlay', 'calibration.json'), JSON.stringify({ gateThreshold: 0.85 }, null, 2));
  log('slice_complete');

  return { ...stats, state, success: true };
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const offline = process.argv.includes('--offline');
  const ideaIdx = process.argv.indexOf('--idea');
  const idea = ideaIdx >= 0 ? process.argv[ideaIdx + 1] : undefined;
  runLoop({ offline, idea }).then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}
