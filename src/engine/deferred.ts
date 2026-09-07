// STEP 4 — MATCH. Gale–Shapley deferred acceptance, ANIMALS PROPOSING.
//
// The shelter is the party accountable for the outcome, so the assignment
// should be optimal from the animals' side. The proposer-optimal stable
// matching is unique, so with strict preference orders (guaranteed by the
// ascending-id tiebreak in derive.ts) the result is independent of the order
// in which proposals are made — and therefore of input order.
//
// Lists are INCOMPLETE: STEP 1 removed every pair that failed a constraint, so
// an animal can exhaust its list and go unmatched. That is a finding, not a
// failure — it feeds the recruitment diagnostic.

/** animalId → applicantId for every matched pair. */
export type Matching = Map<string, string>;

/** Rank lookup: for each proposer/accepter, position of each counterparty. */
function rankIndex(orders: Map<string, string[]>): Map<string, Map<string, number>> {
  const index = new Map<string, Map<string, number>>();
  for (const [id, order] of orders) {
    const inner = new Map<string, number>();
    order.forEach((other, position) => inner.set(other, position));
    index.set(id, inner);
  }
  return index;
}

export function deferredAcceptance(
  animalPreferences: Map<string, string[]>,
  applicantPreferences: Map<string, string[]>,
): Matching {
  const applicantRanks = rankIndex(applicantPreferences);

  // animalId → index of the next applicant it has not yet proposed to
  const nextProposal = new Map<string, number>();
  for (const animalId of animalPreferences.keys()) nextProposal.set(animalId, 0);

  // applicantId → animalId currently held
  const heldBy = new Map<string, string>();

  // Free animals with proposals remaining. Ascending id for determinism;
  // the outcome is order-independent, but a reproducible trace is worth more
  // than a marginally faster queue.
  const free = [...animalPreferences.keys()].sort();

  while (free.length > 0) {
    const animalId = free.shift();
    if (animalId === undefined) break;

    const order = animalPreferences.get(animalId) ?? [];
    const cursor = nextProposal.get(animalId) ?? 0;
    if (cursor >= order.length) continue; // list exhausted — stays unmatched

    const applicantId = order[cursor];
    nextProposal.set(animalId, cursor + 1);
    if (applicantId === undefined) continue;

    const incumbent = heldBy.get(applicantId);

    if (incumbent === undefined) {
      heldBy.set(applicantId, animalId);
      continue;
    }

    // The applicant holds whichever animal stands higher in their own order.
    const ranks = applicantRanks.get(applicantId);
    const challengerRank = ranks?.get(animalId) ?? Number.POSITIVE_INFINITY;
    const incumbentRank = ranks?.get(incumbent) ?? Number.POSITIVE_INFINITY;

    if (challengerRank < incumbentRank) {
      heldBy.set(applicantId, animalId);
      free.push(incumbent);
    } else {
      free.push(animalId);
    }

    free.sort();
  }

  const matching: Matching = new Map();
  for (const [applicantId, animalId] of heldBy) matching.set(animalId, applicantId);
  return matching;
}
