// STEP 7 — MEASURE. Distributional quality of the assignment.
//
// The honest counterpart to stability: stable is not the same as good. A
// matching with no blocking pairs can still place an animal tenth on its list.
// Ranks are 1-indexed — rank 1 is the top of the list.

import type { MatchResult } from './types';
import type { Matching } from './deferred';

const rank1 = (order: string[] | undefined, id: string): number | null => {
  const position = order?.indexOf(id) ?? -1;
  return position === -1 ? null : position + 1;
};

export function computeRegret(
  matching: Matching,
  animalPreferences: Map<string, string[]>,
  applicantPreferences: Map<string, string[]>,
): MatchResult['regret'] {
  const animalRanks: number[] = [];
  const applicantRanks: number[] = [];

  for (const [animalId, applicantId] of matching) {
    const animalRank = rank1(animalPreferences.get(animalId), applicantId);
    if (animalRank !== null) animalRanks.push(animalRank);

    const applicantRank = rank1(applicantPreferences.get(applicantId), animalId);
    if (applicantRank !== null) applicantRanks.push(applicantRank);
  }

  const mean = (values: number[]) =>
    values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length;

  return {
    worstAnimalRank: animalRanks.length === 0 ? 0 : Math.max(...animalRanks),
    worstApplicantRank: applicantRanks.length === 0 ? 0 : Math.max(...applicantRanks),
    meanAnimalRank: mean(animalRanks),
  };
}
