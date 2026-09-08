// Runtime cohort edits — the pure half, so it can be tested without React.
//
// Every function here takes a cohort and returns a NEW cohort. Nothing
// mutates, because `COHORT` is a module-level import shared by the property
// tests and the demo: an in-place edit in the browser would be invisible here
// and an in-place edit in a test would silently rescore every test after it.
//
// ─── WHY THIS IS NOT IN App.tsx ────────────────────────────────────────────
//
// It was. `freeId` lived in the component and tests/cohort-editing.test.ts had
// to keep a hand-copied duplicate of it, because importing a .tsx module into
// a node-environment test pulls in React and the whole tree. A duplicated
// allocator is an allocator that can drift from the one actually shipping.
// These are plain functions over plain data, so the test can import the real
// thing.
//
// ─── WHAT AN EDIT MUST NOT BREAK ───────────────────────────────────────────
//
// The engine indexes both sides by id in a Map, and `specificAnimalId` is a
// cross-reference between the two sides. So an edit has exactly two ways to
// quietly corrupt a board:
//
//   1. A DUPLICATE ID. Two animals sharing one id do not throw — one
//      overwrites the other in the preference maps and the board renders a
//      placement for an animal that is not in it. `freeId` steps past
//      anything taken rather than counting.
//
//   2. A DANGLING CLAIM. Remove Sable and any household that came for Sable
//      still says `specificAnimalId: 'sable'`. The engine tolerates that —
//      `wantScore` simply never fires the specific-animal branch — so the
//      household silently degrades into a generic applicant while the intake
//      form still shows them as here for someone. Worse, an id freed by a
//      removal can be handed out again later, at which point the stale claim
//      re-attaches to a DIFFERENT animal and outranks everything for them.
//      `removeAnimal` clears the claim as part of the removal.

import type { Animal, Applicant, Cohort } from '../engine';

/**
 * An id in `prefix01` form that the cohort is not already using.
 *
 * Counting is not enough on its own: remove-then-add, or a preset id that
 * already looks generated, and `taken.size + 1` lands straight on an existing
 * record.
 */
export function freeId(prefix: string, taken: Set<string>): string {
  let n = taken.size + 1;
  while (taken.has(`${prefix}${String(n).padStart(2, '0')}`)) n += 1;
  return `${prefix}${String(n).padStart(2, '0')}`;
}

export const nextAnimalId = (cohort: Cohort): string =>
  freeId('a', new Set(cohort.animals.map((animal) => animal.id)));

export const nextApplicantId = (cohort: Cohort): string =>
  freeId('p', new Set(cohort.applicants.map((applicant) => applicant.id)));

export const addAnimal = (cohort: Cohort, animal: Animal): Cohort => ({
  animals: [...cohort.animals, animal],
  applicants: cohort.applicants,
});

export const addApplicant = (cohort: Cohort, applicant: Applicant): Cohort => ({
  animals: cohort.animals,
  applicants: [...cohort.applicants, applicant],
});

/**
 * Households that would lose the animal they came for if `animalId` went.
 * The editor names them before the click, rather than reporting them after.
 */
export const claimants = (cohort: Cohort, animalId: string): Applicant[] =>
  cohort.applicants.filter((applicant) => applicant.specificAnimalId === animalId);

/**
 * Remove an animal, and clear every named claim on it (see head of file).
 *
 * Refuses to empty the cohort: a board with no animals on one side is not a
 * result anyone can read, and every panel downstream is written for a cohort
 * that has both sides. The editor disables the control too — this is the
 * backstop, not the message.
 */
export function removeAnimal(cohort: Cohort, animalId: string): Cohort {
  if (cohort.animals.length <= 1) return cohort;
  if (!cohort.animals.some((animal) => animal.id === animalId)) return cohort;

  return {
    animals: cohort.animals.filter((animal) => animal.id !== animalId),
    applicants: cohort.applicants.map((applicant) =>
      applicant.specificAnimalId === animalId
        ? { ...applicant, specificAnimalId: null }
        : applicant,
    ),
  };
}

/** Remove a household. Nothing cross-references an applicant id. */
export function removeApplicant(cohort: Cohort, applicantId: string): Cohort {
  if (cohort.applicants.length <= 1) return cohort;

  return {
    animals: cohort.animals,
    applicants: cohort.applicants.filter((applicant) => applicant.id !== applicantId),
  };
}
