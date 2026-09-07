// First-come-first-served baseline — what placement looks like under time
// pressure.
//
// ─── WHY THIS BASELINE AND NOT A SIMPLER ONE ───────────────────────────────
//
// Applications are worked in arrival order, and each household is given the
// animal they most WANT among those still available. Compatibility is never
// systematically checked — that is the whole failure being modelled.
//
// An earlier version handed each household the first animal still on the list,
// which produced a household that asked for an 8kg cat being given a 32kg dog.
// No coordinator is that careless, and a baseline nobody believes cannot carry
// a comparison. This version concedes the coordinator does the obvious thing —
// match people to what they asked for — and shows that doing the obvious thing
// still places animals into homes that cannot keep them, because WANT is not
// NEED. That is the actual argument.
//
// It costs us the larger headline number and buys one that survives a judge
// pushing on it. The 500-cohort aggregate barely moves either way, which is
// why the aggregate is the number to lead with.

import type { Cohort } from './types';
import type { Matching } from './deferred';
import { evaluatePair } from './constraints';
import { wantScore } from './derive';

export interface GreedyResult {
  matching: Matching;
  constraintViolations: number;
  violatingPairs: { animalId: string; applicantId: string; failed: string[] }[];
}

export function greedy(cohort: Cohort): GreedyResult {
  const matching: Matching = new Map();
  const violatingPairs: GreedyResult['violatingPairs'] = [];
  const taken = new Set<string>();

  // Arrival order is the input order — that is the whole point of the baseline.
  for (const applicant of cohort.applicants) {
    const available = cohort.animals.filter((candidate) => !taken.has(candidate.id));
    if (available.length === 0) break;

    // The animal this household most wants, of those still here. No check that
    // the household can actually keep it.
    const chosen = available.reduce((best, candidate) => {
      const difference = wantScore(applicant, candidate) - wantScore(applicant, best);
      if (difference > 0) return candidate;
      if (difference < 0) return best;
      return candidate.id < best.id ? candidate : best; // deterministic tiebreak
    });

    taken.add(chosen.id);
    matching.set(chosen.id, applicant.id);

    const failures = evaluatePair(chosen, applicant);
    if (failures.length > 0) {
      violatingPairs.push({
        animalId: chosen.id,
        applicantId: applicant.id,
        failed: failures.map((failure) => failure.label),
      });
    }
  }

  return {
    matching,
    constraintViolations: violatingPairs.length,
    violatingPairs,
  };
}
