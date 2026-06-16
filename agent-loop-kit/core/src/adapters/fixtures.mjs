/** Offline fixture responses — live outside loopd, keyed by role + idea hash */

import { createHash } from 'node:crypto';

function ideaKey(idea) {
  return createHash('sha256').update(idea).digest('hex').slice(0, 8);
}

/** @param {string} role @param {string} idea @param {Record<string, unknown>} context */
export function getFixtureResponse(role, idea, context = {}) {
  const key = ideaKey(idea);
  const isB2B = /b2b|enterprise|onboarding|sales team/i.test(idea);

  switch (role) {
    case 'scribe':
      return {
        problem: idea,
        audience: isB2B ? 'B2B team leads evaluating onboarding tools' : 'indie developers seeking early access',
        success_signal: isB2B ? 'first qualified demo booking' : 'first waitlist signup'
      };
    case 'vision':
      return {
        principles: ['Ship smallest vertical fast', 'Mobile-first'],
        non_goals: isB2B ? ['consumer viral loops', 'marketplace'] : ['payments', 'full auth'],
        boundaries: isB2B ? 'Onboarding stub + one dashboard screen' : 'One landing + waitlist'
      };
    case 'slice_planner':
      return {
        slice_hypothesis: isB2B ? 'auth stub + onboarding checklist screen' : 'landing + waitlist + analytics hook',
        acceptance_criteria: isB2B
          ? ['Auth stub renders', 'Onboarding checklist visible', 'Meta tags present']
          : ['Landing page renders', 'Waitlist form submits', 'Meta tags present'],
        audience: isB2B ? 'B2B team leads' : 'indie developers',
        success_signal: isB2B ? 'first demo booking' : 'first waitlist signup',
        pack: context.pack ?? 'saas-landing'
      };
    case 'arbiter':
      return { aligned: true, score: 0.92, divergence_reason: '' };
    case 'builder':
      return {
        html: buildFixtureHtml(isB2B, context.reviseHint)
      };
    case 'architect':
      return {
        severity: context.injectConflict ? 'blocker' : 'advisory',
        criticality: 'on-path',
        reversibility: 'cheap',
        finding: context.injectConflict ? 'Defer auth to slice two' : 'Scaffold structure acceptable',
        confidence: 0.85
      };
    case 'copywriter':
      return {
        severity: context.injectConflict ? 'blocker' : 'advisory',
        criticality: 'on-path',
        reversibility: context.injectConflict ? 'expensive' : 'cheap',
        finding: context.injectConflict ? 'Block until voice guide is defined' : 'Copy tone acceptable',
        confidence: 0.8
      };
    case 'designer':
      return { severity: 'advisory', criticality: 'off-path', reversibility: 'cheap', finding: 'Add design tokens', confidence: 0.75 };
    case 'seo':
      return { severity: 'advisory', criticality: 'on-path', reversibility: 'cheap', finding: 'Meta description present', confidence: 0.9 };
    case 'image':
      return { severity: 'advisory', finding: 'Hero alt text needed', alt_recommendation: 'Product preview screenshot', confidence: 0.7 };
    case 'red_team':
      return { confirmed: true, adjusted_severity: context.injectConflict ? 'blocker' : 'advisory', reason: 'Verified against acceptance criteria' };
    case 'orchestrator':
      return { next_action: 'continue', state: context.state ?? 'idea_seed' };
    default:
      throw new Error(`no fixture for role: ${role}`);
  }
}

function buildFixtureHtml(isB2B, reviseHint) {
  const title = isB2B ? 'Team onboarding' : 'Join the waitlist';
  const desc = isB2B
    ? 'Streamline B2B team onboarding with our checklist dashboard'
    : 'Join the waitlist for our indie dev SaaS';
  const heading = reviseHint ? `${title} — ${reviseHint}` : title;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="description" content="${desc}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>:root { --color-primary: #2563eb; --spacing-md: 1rem; } body { color: var(--color-primary); padding: var(--spacing-md); }</style>
</head>
<body>
  <main><h1>${heading}</h1><form><input type="email" aria-label="Email"><img src="hero.png" alt="Product preview"></form></main>
</body>
</html>`;
}
