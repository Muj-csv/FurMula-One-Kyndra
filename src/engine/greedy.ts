// First-come-first-served baseline — what a coordinator does under time
// pressure. Used for the greedy→stable comparison and the randomised
// aggregate (PRD §5).
// PHASE 0: signature only.

import type { Cohort } from './types';
import type { Matching } from './deferred';

export interface GreedyResult {
  matching: Matching;
  constraintViolations: number;
}

export function greedy(_cohort: Cohort): GreedyResult {
  throw new Error('greedy: not implemented — P0 work');
}
