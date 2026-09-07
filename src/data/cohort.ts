// Seeded animals + surveyed applicants.
//
// PHASE 0: empty. The cohort is a Day 2 deliverable (PRD §6) and the applicant
// survey is Day 2 fieldwork (PRD §5). Deliberately left empty rather than
// seeded with invented households — PRD §3.1 requires that the UI be able to
// say "simulated animals, real applicants" truthfully, per record.

import type { Animal, Applicant, Cohort } from '../engine';

export const ANIMALS: Animal[] = [];

/** `surveyed: true` only for households actually surveyed. Never backfill. */
export const APPLICANTS: Applicant[] = [];

export const COHORT: Cohort = { animals: ANIMALS, applicants: APPLICANTS };
