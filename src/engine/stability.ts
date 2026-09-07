// STEP 5 — VERIFY. Blocking-pair verifier and swap-attempt evaluator.
//
// A blocking pair is one where both sides prefer each other over their current
// assignment. A correct implementation returns zero. The same evaluator powers
// "attempt a swap" — a judge's proposed reshuffle is just a candidate blocking
// pair, evaluated and explained.
// PHASE 0: signature only.

import type { Matching } from './deferred';

export function findBlockingPairs(
  _matching: Matching,
  _animalPreferences: Map<string, string[]>,
  _applicantPreferences: Map<string, string[]>,
): [string, string][] {
  throw new Error('findBlockingPairs: not implemented — Architecture §6 STEP 5');
}

export interface SwapVerdict {
  succeeds: boolean;
  reason: string;
}

/** Evaluate a judge's proposed reshuffle and explain why it holds or fails. */
export function evaluateSwap(
  _matching: Matching,
  _animalId: string,
  _applicantId: string,
): SwapVerdict {
  throw new Error('evaluateSwap: not implemented — Architecture §6 STEP 5');
}
