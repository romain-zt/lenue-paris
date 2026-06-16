import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compilePrompt } from '../src/prompt-compile.mjs';

describe('freeze-bypass adversarial', () => {
  it('aborts when vision-prd.md is injected into prompt template', () => {
    const result = compilePrompt({
      role: 'builder',
      sliceContractHash: 'abc123',
      firstSliceBrief: 'landing page',
      buildLogTail: 'see vision-prd.md for full scope',
      liveHints: [],
      acceptanceCriteria: 'ship landing'
    });
    assert.equal(result.ok, false);
    assert.match(result.reason, /freeze violation/i);
  });

  it('rejects build log tail that reconstructs full vision', () => {
    const tail = 'non-goal retired: payments. ' + 'Full PRD context: '.repeat(80);
    const result = compilePrompt({
      role: 'reviewer',
      sliceContractHash: 'abc123',
      firstSliceBrief: 'brief',
      buildLogTail: tail,
      liveHints: [],
      acceptanceCriteria: 'copy pass'
    });
    assert.equal(result.ok, false);
    assert.match(result.reason, /reconstructs vision/i);
  });

  it('allows valid compile with allowlisted keys only', () => {
    const result = compilePrompt({
      role: 'copywriter',
      sliceContractHash: 'def456',
      firstSliceBrief: 'waitlist landing',
      buildLogTail: 'tone should be direct',
      liveHints: [{ hint: 'use short sentences', binding: false }],
      acceptanceCriteria: 'readability >= 0.5'
    });
    assert.equal(result.ok, true);
    assert.ok(result.prompt.includes('waitlist landing'));
  });
});
