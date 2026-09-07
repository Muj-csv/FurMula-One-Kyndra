// STEP 6 — EXPLAIN. Rationale and counterfactual strings.
//
// Animal names in every string (Architecture §8) — never animal_07.
// The counterfactual recomputes without one applicant and reports what changes.
// PHASE 0: signature only.

import type { Animal, Applicant, Cohort } from './types';

export function buildRationale(_a: Animal, _p: Applicant): string[] {
  throw new Error('buildRationale: not implemented — Architecture §6 STEP 6');
}

export function buildCounterfactual(
  _cohort: Cohort,
  _animalId: string,
  _applicantId: string,
): string {
  throw new Error('buildCounterfactual: not implemented — Architecture §6 STEP 6');
}

/** Generated, not authored — falls out of what the filter already produced. */
export function buildRecruitmentProfile(
  _animal: Animal,
  _cohort: Cohort,
): string {
  throw new Error('buildRecruitmentProfile: not implemented — Architecture §6 STEP 6');
}
