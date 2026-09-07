// A fingerprint of the cohort, for detecting a stale human-baseline result.
//
// ─── THE FAILURE THIS PREVENTS ─────────────────────────────────────────────
//
// The human baseline study (PRD P1-2) measures people placing THE COHORT THAT
// WAS LIVE WHEN THEY SAT DOWN. The claim it produces — "five people placed
// this cohort by hand and averaged N violations" — is only true while that
// cohort is the one on screen.
//
// This is not hypothetical. `cohort.ts` changed on 8 Sept: Bruno's size, p14's
// size ceiling, and p21's named request all moved to make the demo narrative
// true. A study run on 7 Sept would describe a board that no longer exists,
// and nothing in the app would have noticed.
//
// So the recorded result carries the fingerprint of the cohort it was measured
// against, and the panel refuses to render when it no longer matches.
//
// ─── WHAT IS AND IS NOT IN THE FINGERPRINT ─────────────────────────────────
//
// IN — everything a participant is shown (research/human-baseline-protocol.md
// lists it: name, species, age, size, energy, behavioural difficulty, the four
// compatibility flags, medication, special needs, days in shelter) plus every
// household fact, because those are the inputs to both the participant's
// choice and to `evaluatePair`, which scores it.
//
// OUT — `photo`, `surveyed`, `prefersSpecies`, `prefersAge`, `prefersEnergy`,
// and `specificAnimalId`. The protocol is explicit that participants are given
// household facts and NOT stated preferences, because someone matching
// first-come-first-served is matching to need. Those fields cannot change a
// participant's pairing and cannot change its violation count, so including
// them would invalidate real sessions over edits that did not affect them.
//
// That distinction has already earned its keep: removing p21's named request
// on 8 Sept does NOT invalidate a study, while changing Bruno's size does.
//
// If you widen the constraint set in `engine/constraints.ts` to read a field
// not listed here, add it here too — otherwise a scoring-relevant change can
// slip past this check.

import type { Animal, Applicant, Cohort } from '../engine';

/** The participant-visible and scoring-relevant fields of one animal. */
function animalFields(animal: Animal): string {
  return [
    animal.id,
    animal.name,
    animal.species,
    animal.ageYears,
    animal.sizeKg,
    animal.energy,
    animal.behaviouralDifficulty,
    animal.okWithChildren,
    animal.okWithOtherPets,
    animal.needsYard,
    animal.needsQuietHome,
    animal.dailyMedication,
    [...animal.specialNeeds].sort().join('|'),
    animal.daysInShelter,
  ].join(',');
}

/** The household facts of one applicant. Stated preferences are excluded. */
function applicantFields(applicant: Applicant): string {
  return [
    applicant.id,
    applicant.name,
    applicant.homeType,
    applicant.hasYard,
    applicant.hoursAwayPerDay,
    applicant.hasChildren,
    applicant.hasOtherPets,
    applicant.experience,
    applicant.canDoDailyMeds,
    applicant.maxSizeKg,
  ].join(',');
}

/**
 * Canonical text for a cohort — sorted by id, so the fingerprint is a property
 * of the cohort's content and not of the order it happens to be written in.
 */
function canonical(cohort: Cohort): string {
  const animals = [...cohort.animals]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(animalFields)
    .join(';');
  const applicants = [...cohort.applicants]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(applicantFields)
    .join(';');
  return `A[${animals}]P[${applicants}]`;
}

/**
 * FNV-1a, 32-bit. Chosen because it is eight lines, has no dependencies, and
 * is identical on every engine — this value gets pasted into a source file by
 * hand, so it has to be short enough to copy and stable enough to trust.
 *
 * Not cryptographic, and does not need to be: it defends against forgetting to
 * re-run a study, not against someone forging one.
 */
function fnv1a(text: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/** Stable 8-character fingerprint of a cohort's placement-relevant content. */
export function cohortFingerprint(cohort: Cohort): string {
  return fnv1a(canonical(cohort));
}
