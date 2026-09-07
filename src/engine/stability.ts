// STEP 5 — VERIFY. Blocking-pair verifier and swap-attempt evaluator.
//
// A blocking pair is one where both sides prefer each other over their current
// assignment. A correct implementation returns zero. This is not an assertion
// about the algorithm — it is a scan of every pair, run on every result.
//
// The same evaluator powers "attempt a swap": a judge's proposed reshuffle is
// just a candidate blocking pair, evaluated and explained.

import type { Matching } from './deferred';

const rankOf = (order: string[] | undefined, id: string): number => {
  const position = order?.indexOf(id) ?? -1;
  return position === -1 ? Number.POSITIVE_INFINITY : position;
};

/** applicantId → animalId. */
function invert(matching: Matching): Map<string, string> {
  const inverse = new Map<string, string>();
  for (const [animalId, applicantId] of matching) inverse.set(applicantId, animalId);
  return inverse;
}

/**
 * Every pair that would defect from the assignment. Expected: empty.
 *
 * An unmatched party prefers ANY acceptable counterparty to being unmatched,
 * which is why the rank of a missing assignment is +∞ rather than skipped.
 */
export function findBlockingPairs(
  matching: Matching,
  animalPreferences: Map<string, string[]>,
  applicantPreferences: Map<string, string[]>,
): [string, string][] {
  const matchOfApplicant = invert(matching);
  const blocking: [string, string][] = [];

  for (const [animalId, animalOrder] of animalPreferences) {
    const currentApplicant = matching.get(animalId);
    const animalCurrentRank =
      currentApplicant === undefined
        ? Number.POSITIVE_INFINITY
        : rankOf(animalOrder, currentApplicant);

    for (const applicantId of animalOrder) {
      if (applicantId === currentApplicant) continue;

      // Does the animal prefer this applicant to what it has?
      if (rankOf(animalOrder, applicantId) >= animalCurrentRank) continue;

      // Does the applicant prefer this animal to what they have?
      const applicantOrder = applicantPreferences.get(applicantId);
      const currentAnimal = matchOfApplicant.get(applicantId);
      const applicantCurrentRank =
        currentAnimal === undefined
          ? Number.POSITIVE_INFINITY
          : rankOf(applicantOrder, currentAnimal);

      if (rankOf(applicantOrder, animalId) < applicantCurrentRank) {
        blocking.push([animalId, applicantId]);
      }
    }
  }

  return blocking;
}

export interface SwapVerdict {
  succeeds: boolean;
  reason: string;
}

/**
 * Evaluate a proposed pairing and explain why it holds or fails.
 *
 * A judge picks an animal and an applicant who are not matched to each other
 * and asks whether they would rather be. If the assignment is stable the
 * answer is always no, and the reason names which side refuses.
 */
export function evaluateSwap(
  matching: Matching,
  animalPreferences: Map<string, string[]>,
  applicantPreferences: Map<string, string[]>,
  animalId: string,
  applicantId: string,
  nameOf: (id: string) => string = (id) => id,
): SwapVerdict {
  const animalOrder = animalPreferences.get(animalId);
  const applicantOrder = applicantPreferences.get(applicantId);
  const animalName = nameOf(animalId);
  const applicantName = nameOf(applicantId);

  if (matching.get(animalId) === applicantId) {
    return { succeeds: false, reason: `${animalName} and ${applicantName} are already matched.` };
  }

  if (animalOrder === undefined || !animalOrder.includes(applicantId)) {
    return {
      succeeds: false,
      reason: `${applicantName} was eliminated for ${animalName} by a hard constraint, so this pairing was never on the table.`,
    };
  }

  const currentApplicant = matching.get(animalId);
  const animalCurrentRank =
    currentApplicant === undefined ? Number.POSITIVE_INFINITY : rankOf(animalOrder, currentApplicant);

  if (rankOf(animalOrder, applicantId) >= animalCurrentRank && currentApplicant !== undefined) {
    return {
      succeeds: false,
      reason: `${animalName} is already placed with ${nameOf(currentApplicant)}, who meets ${animalName}\u2019s needs better than ${applicantName} does. ${animalName} does not want the swap.`,
    };
  }

  const matchOfApplicant = invert(matching);
  const currentAnimal = matchOfApplicant.get(applicantId);
  const applicantCurrentRank =
    currentAnimal === undefined ? Number.POSITIVE_INFINITY : rankOf(applicantOrder, currentAnimal);

  if (rankOf(applicantOrder, animalId) >= applicantCurrentRank && currentAnimal !== undefined) {
    return {
      succeeds: false,
      reason: `${applicantName} already has ${nameOf(currentAnimal)}, whom they rank above ${animalName}. ${applicantName} does not want the swap.`,
    };
  }

  return {
    succeeds: true,
    reason: `${animalName} and ${applicantName} would both prefer each other \u2014 this is a blocking pair, and the assignment is not stable.`,
  };
}
