// STEP 7 — MEASURE. Distributional quality of the assignment.
// The honest counterpart to stability: stable is not the same as good.
// PHASE 0: signature only.

import type { MatchResult } from './types';
import type { Matching } from './deferred';

export function computeRegret(
  _matching: Matching,
  _animalPreferences: Map<string, string[]>,
  _applicantPreferences: Map<string, string[]>,
): MatchResult['regret'] {
  throw new Error('computeRegret: not implemented — Architecture §6 STEP 7');
}
