// STEP 3 — EQUITY. Long-stay tie-breaking weight.
//
// HARD RULE: equity operates only on candidates that already passed STEP 1.
// It can never introduce, reinstate, or advance a pair that failed a
// constraint. Property test #2 enforces this.
// PHASE 0: signature only.

import type { Animal } from './types';

/** Reorder within the shelter's tie band only. Never crosses a constraint. */
export function applyEquityTiebreak(
  _animal: Animal,
  _shelterOrder: string[],
  _equityWeight: number,
): string[] {
  throw new Error('applyEquityTiebreak: not implemented — Architecture §6 STEP 3');
}
