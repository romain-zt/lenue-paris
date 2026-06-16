/** @typedef {'idea_seed'|'vision_prd'|'convergence'|'veto'|'building'|'reviewing'|'slice_complete'|'aborted'|'resume_at_veto'} State */

export const TRANSITIONS = {
  idea_seed: ['vision_prd'],
  vision_prd: ['convergence'],
  convergence: ['veto', 'resume_at_veto'],
  veto: ['building'],
  building: ['reviewing', 'aborted'],
  reviewing: ['slice_complete', 'aborted', 'resume_at_veto'],
  slice_complete: [],
  aborted: ['convergence'],
  resume_at_veto: ['veto']
};

/** @param {State} from @param {State} to */
export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}

/** @param {State} state @param {object} ctx */
export function nextState(state, ctx = {}) {
  switch (state) {
    case 'idea_seed':
      return 'vision_prd';
    case 'vision_prd':
      return 'convergence';
    case 'convergence':
      return ctx.diverged ? 'resume_at_veto' : 'veto';
    case 'resume_at_veto':
      return 'veto';
    case 'veto':
      return 'building';
    case 'building':
      return ctx.freezeViolation ? 'aborted' : 'reviewing';
    case 'reviewing':
      if (ctx.ceilingExceeded) return 'resume_at_veto';
      if (ctx.freezeViolation || ctx.sliceAbort) return 'aborted';
      return 'slice_complete';
    default:
      return state;
  }
}

export const SESSION_ONE_PATH = [
  'idea_seed',
  'vision_prd',
  'convergence',
  'veto',
  'building',
  'reviewing',
  'slice_complete'
];
