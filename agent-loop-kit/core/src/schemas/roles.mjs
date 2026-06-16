/** Structured output schemas per agent role */

export const ROLE_SCHEMAS = {
  scribe: {
    type: 'object',
    required: ['problem', 'audience', 'success_signal'],
    properties: {
      problem: { type: 'string' },
      audience: { type: 'string' },
      success_signal: { type: 'string' }
    }
  },
  vision: {
    type: 'object',
    required: ['principles', 'non_goals', 'boundaries'],
    properties: {
      principles: { type: 'array', items: { type: 'string' } },
      non_goals: { type: 'array', items: { type: 'string' } },
      boundaries: { type: 'string' }
    }
  },
  slice_planner: {
    type: 'object',
    required: ['slice_hypothesis', 'acceptance_criteria', 'audience', 'success_signal'],
    properties: {
      slice_hypothesis: { type: 'string' },
      acceptance_criteria: { type: 'array', items: { type: 'string' } },
      audience: { type: 'string' },
      success_signal: { type: 'string' },
      pack: { type: 'string' }
    }
  },
  arbiter: {
    type: 'object',
    required: ['aligned', 'score', 'divergence_reason'],
    properties: {
      aligned: { type: 'boolean' },
      score: { type: 'number' },
      divergence_reason: { type: 'string' }
    }
  },
  builder: {
    type: 'object',
    required: ['html'],
    properties: {
      html: { type: 'string' }
    }
  },
  architect: {
    type: 'object',
    required: ['severity', 'criticality', 'reversibility', 'finding'],
    properties: {
      severity: { enum: ['blocker', 'advisory'] },
      criticality: { enum: ['on-path', 'off-path'] },
      reversibility: { enum: ['cheap', 'expensive'] },
      finding: { type: 'string' },
      confidence: { type: 'number' }
    }
  },
  copywriter: {
    type: 'object',
    required: ['severity', 'criticality', 'reversibility', 'finding'],
    properties: {
      severity: { enum: ['blocker', 'advisory'] },
      criticality: { enum: ['on-path', 'off-path'] },
      reversibility: { enum: ['cheap', 'expensive'] },
      finding: { type: 'string' },
      confidence: { type: 'number' }
    }
  },
  designer: {
    type: 'object',
    required: ['severity', 'criticality', 'reversibility', 'finding'],
    properties: {
      severity: { enum: ['blocker', 'advisory'] },
      criticality: { enum: ['on-path', 'off-path'] },
      reversibility: { enum: ['cheap', 'expensive'] },
      finding: { type: 'string' },
      confidence: { type: 'number' }
    }
  },
  seo: {
    type: 'object',
    required: ['severity', 'criticality', 'reversibility', 'finding'],
    properties: {
      severity: { enum: ['blocker', 'advisory'] },
      criticality: { enum: ['on-path', 'off-path'] },
      reversibility: { enum: ['cheap', 'expensive'] },
      finding: { type: 'string' },
      confidence: { type: 'number' }
    }
  },
  image: {
    type: 'object',
    required: ['severity', 'finding', 'alt_recommendation'],
    properties: {
      severity: { enum: ['blocker', 'advisory'] },
      finding: { type: 'string' },
      alt_recommendation: { type: 'string' },
      confidence: { type: 'number' }
    }
  },
  red_team: {
    type: 'object',
    required: ['confirmed', 'adjusted_severity', 'reason'],
    properties: {
      confirmed: { type: 'boolean' },
      adjusted_severity: { enum: ['blocker', 'advisory'] },
      reason: { type: 'string' }
    }
  },
  orchestrator: {
    type: 'object',
    required: ['next_action', 'state'],
    properties: {
      next_action: { type: 'string' },
      state: { type: 'string' }
    }
  }
};

export function getRoleSchema(role) {
  const schema = ROLE_SCHEMAS[role];
  if (!schema) throw new Error(`unknown role schema: ${role}`);
  return schema;
}
