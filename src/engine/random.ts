// Cohort generator — powers BOTH property tests and the 500-cohort randomised
// aggregate (Architecture §7). Seeded so a failing case is reproducible.
// PHASE 0: signature only.

import type { Cohort } from './types';

export function randomCohort(_seed?: number): Cohort {
  throw new Error('randomCohort: not implemented — Architecture §7');
}

export function randomWeight(_seed?: number): number {
  throw new Error('randomWeight: not implemented — Architecture §7');
}
