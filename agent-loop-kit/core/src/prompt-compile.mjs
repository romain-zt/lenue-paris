const BLOCKED_PATTERNS = [
  /vision-prd\.md/i,
  /\bvision prd\b/i,
  /full vision document/i,
  /reconstruct.*vision/i
];

const ALLOWED_KEYS = new Set([
  'sliceContractHash',
  'firstSliceBrief',
  'buildLogTail',
  'liveHints',
  'role',
  'acceptanceCriteria'
]);

/**
 * @param {Record<string, unknown>} context
 * @returns {{ ok: true, prompt: string } | { ok: false, reason: string }}
 */
export function compilePrompt(context) {
  for (const key of Object.keys(context)) {
    if (!ALLOWED_KEYS.has(key)) {
      return { ok: false, reason: `disallowed context key: ${key}` };
    }
  }

  const serialized = JSON.stringify(context);
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(serialized)) {
      return { ok: false, reason: `freeze violation: matched ${pattern}` };
    }
  }

  if (context.buildLogTail && typeof context.buildLogTail === 'string') {
    const tail = context.buildLogTail;
    if (/non-goal.*retired|full prd|complete vision/i.test(tail) && tail.length > 500) {
      return { ok: false, reason: 'freeze violation: build log tail reconstructs vision' };
    }
  }

  const prompt = [
    `Role: ${context.role ?? 'agent'}`,
    `Slice contract: ${context.sliceContractHash ?? 'none'}`,
    `Brief: ${context.firstSliceBrief ?? ''}`,
    `Build log tail: ${context.buildLogTail ?? ''}`,
    `Live hints: ${JSON.stringify(context.liveHints ?? [])}`,
    `Acceptance: ${context.acceptanceCriteria ?? ''}`
  ].join('\n');

  return { ok: true, prompt };
}
