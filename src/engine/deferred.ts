// STEP 4 — MATCH. Gale–Shapley deferred acceptance, ANIMALS PROPOSING.
//
// The shelter is the party accountable for the outcome, so the assignment
// should be optimal from the animals' side. The proposer-optimal stable
// matching is unique, so with a deterministic tiebreak the result is
// independent of input order.
// PHASE 0: signature only.

/** animalId → applicantId for every matched pair. */
export type Matching = Map<string, string>;

export function deferredAcceptance(
  _animalPreferences: Map<string, string[]>,
  _applicantPreferences: Map<string, string[]>,
): Matching {
  throw new Error('deferredAcceptance: not implemented — Architecture §6 STEP 4');
}
