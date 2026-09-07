// STEP 1 — FILTER. Eliminate impossible pairs entirely, each with a citation.
// Architecture §6. Elimination is total; a failed pair is never down-ranked.
// PHASE 0: signature only.

import type { Animal, Applicant, Constraint } from './types';

/** Every hard constraint, each carrying its return-cause and citation key. */
export const CONSTRAINTS: readonly Constraint[] = [];

export interface ConstraintFailure {
  constraintId: string;
  label: string;
  preventsReturnCause: string;
}

/** Evaluate every constraint for one pair. Empty result = pair is viable. */
export function evaluatePair(_a: Animal, _p: Applicant): ConstraintFailure[] {
  throw new Error('evaluatePair: not implemented — Architecture §6 STEP 1');
}
