// STEP 2 — DERIVE. Build BOTH preference orders.
//
// ⚠ THE TWO SIDES MUST NOT SHARE A SCORING FUNCTION (Architecture §6).
//
//   deriveApplicantOrder reads ONLY: specificAnimalId, prefersSpecies,
//     prefersAge, prefersEnergy, maxSizeKg.
//   deriveShelterOrder reads ONLY household facts, and never touches a
//     `prefers*` field or specificAnimalId.
//
// If both orders derived from one fit score the two lists would be
// near-identical, blocking pairs would be impossible by construction, and
// stability would be vacuous — at which point a Hungarian assignment would
// produce strictly better total welfare and Gale–Shapley would be
// indefensible. Independence is what makes this the right algorithm.
//
// SCORES ARE INTEGERS, ON PURPOSE. It keeps the derivation auditable and it
// makes the equity band (equity.ts) legible: at dial setting w an animal can
// gain at most w x EQUITY_BAND want-score points, so the reach of the dial is
// readable straight off the numbers rather than buried in a comparator.
//
// Equity cannot touch a pair STEP 1 eliminated, and cannot outrank a stated
// specific animal. It CAN reorder two animals inside the band - see equity.ts
// for what may and may not be claimed about that.
//
// TIEBREAK: deterministic, ascending id, applied consistently on both sides.

import type { Animal, Applicant } from './types';
import { equityBoost } from './equity';

/** A stated, specific animal outranks anything a score could produce. */
export const SPECIFIC_ANIMAL_SCORE = 1_000_000;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export type AgeBand = 'young' | 'adult' | 'senior';

export function ageBand(animal: Animal): AgeBand {
  if (animal.ageYears < 2) return 'young';
  if (animal.ageYears < 8) return 'adult';
  return 'senior';
}

// ─── APPLICANT SIDE — ranks on WANT ────────────────────────────────────────

/**
 * How much this applicant wants this animal. Integer.
 * Household-fit fields MUST NOT appear here.
 */
export function wantScore(applicant: Applicant, animal: Animal): number {
  if (applicant.specificAnimalId === animal.id) return SPECIFIC_ANIMAL_SCORE;

  let score = 0;

  if (applicant.prefersSpecies !== null && applicant.prefersSpecies === animal.species) {
    score += 40;
  }

  if (applicant.prefersAge !== null && applicant.prefersAge === ageBand(animal)) {
    score += 30;
  }

  if (applicant.prefersEnergy !== null) {
    score += Math.max(0, 20 - 5 * Math.abs(applicant.prefersEnergy - animal.energy));
  }

  // "size within maxSizeKg" (Architecture §6) — read as headroom: an animal
  // comfortably inside the stated limit is wanted more than one at the ceiling.
  if (applicant.maxSizeKg > 0) {
    score += clamp(Math.round(10 * (1 - animal.sizeKg / applicant.maxSizeKg)), 0, 10);
  }

  return score;
}

/**
 * The applicant's order over the animals they are viable for, best first.
 *
 * `equityWeight` adds a sub-integer nudge that can only separate exact ties
 * (STEP 3). At equityWeight 0 this is a pure want order.
 */
export function deriveApplicantOrder(
  applicant: Applicant,
  viableAnimals: Animal[],
  equityWeight = 0,
): string[] {
  return [...viableAnimals]
    .map((animal) => ({
      id: animal.id,
      score: wantScore(applicant, animal) + equityBoost(animal, equityWeight),
    }))
    .sort((x, y) => (y.score - x.score) || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
    .map((entry) => entry.id);
}

// ─── SHELTER SIDE — ranks on NEED ──────────────────────────────────────────

/**
 * How well this household meets this animal's needs. Integer.
 * Applicant preference fields MUST NOT appear here.
 */
export function needScore(animal: Animal, applicant: Applicant): number {
  let score = 0;

  // Behavioural difficulty against experience. The filter guarantees a margin
  // of at least -1; headroom beyond that is what the shelter actually wants.
  score += (clamp(applicant.experience - animal.behaviouralDifficulty, -4, 4) + 4) * 5;

  // Energy against hours away. A home that is occupied is the resource here.
  const hoursAtHome = 24 - applicant.hoursAwayPerDay;
  const hoursNeeded = 8 + animal.energy * 2;
  score += (clamp(hoursAtHome - hoursNeeded, -6, 6) + 6) * 3;

  // Outdoor space, weighted by how much this animal will use it.
  if (applicant.hasYard) score += animal.energy >= 4 ? 12 : 6;

  // A large animal in a house rather than an apartment.
  if (applicant.homeType === 'house' && animal.sizeKg >= 25) score += 8;

  // A difficult animal does better without children, even when safe with them.
  if (animal.behaviouralDifficulty >= 4 && !applicant.hasChildren) score += 10;

  // Capacity for ongoing care, beyond the medication constraint itself.
  if (animal.specialNeeds.length > 0 && applicant.canDoDailyMeds && applicant.experience >= 3) {
    score += 6;
  }

  // Comfortable size margin rather than the household's ceiling.
  if (applicant.maxSizeKg > 0 && animal.sizeKg <= applicant.maxSizeKg * 0.7) score += 8;

  return score;
}

/**
 * The shelter's order over the applicants viable for this animal, best first.
 *
 * No equity term: within one animal's list, daysInShelter is constant, so an
 * equity nudge here is arithmetically a no-op. See equity.ts.
 */
export function deriveShelterOrder(animal: Animal, viableApplicants: Applicant[]): string[] {
  return [...viableApplicants]
    .map((applicant) => ({ id: applicant.id, score: needScore(animal, applicant) }))
    .sort((x, y) => (y.score - x.score) || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
    .map((entry) => entry.id);
}
