// STEP 2 — DERIVE. Build BOTH preference orders.
//
// ⚠ THE TWO SIDES MUST NOT SHARE A SCORING FUNCTION (Architecture §6).
// Applicants rank on WANT; the shelter ranks on NEED. If both orders derive
// from one fit score, stability becomes vacuous and the algorithm choice is
// indefensible.
//
// TIEBREAK: deterministic, ascending id, applied consistently on both sides.
// PHASE 0: signature only.

import type { Animal, Applicant } from './types';

/** Applicant's order over animals — WANT only. Household-fit fields must not appear. */
export function deriveApplicantOrder(
  _applicant: Applicant,
  _viableAnimals: Animal[],
): string[] {
  throw new Error('deriveApplicantOrder: not implemented — Architecture §6 STEP 2');
}

/** Shelter's order over applicants for one animal — NEED only. Want fields must not appear. */
export function deriveShelterOrder(
  _animal: Animal,
  _viableApplicants: Applicant[],
): string[] {
  throw new Error('deriveShelterOrder: not implemented — Architecture §6 STEP 2');
}
