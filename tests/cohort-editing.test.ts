// Guards runtime cohort editing — P0-1 / P0-2.
//
// A visitor can add animals and households to the cohort in-session, and take
// them back out again. That path is deliberately ephemeral (see
// data/surveyCapture.ts), but "ephemeral" does not mean "unchecked": whatever
// it produces is fed straight into runMatch, and the engine indexes both sides
// by id in a Map.
//
// TWO FAILURES MATTER, AND NEITHER ONE THROWS:
//
//   A DUPLICATE ID. Two animals sharing an id do not throw — one silently
//   overwrites the other in the preference maps, the board renders a placement
//   for an animal that is not in it, and the property tests never see any of
//   it because they run on the committed cohort.
//
//   A DANGLING NAMED CLAIM. Remove the animal a household came for and their
//   `specificAnimalId` still points at nobody. The engine tolerates it, so the
//   household quietly stops being a claimant, and an id handed out again later
//   re-attaches the stale claim to a DIFFERENT animal — where it outranks
//   every derived score.
//
// Both are wrong, quiet, and only visible on stage. These functions are pure
// and live outside the component tree precisely so this file can import the
// code that actually ships rather than a copy of it.

import { describe, it, expect } from 'vitest';
import { runMatch, evaluatePair, type Animal, type Applicant, type Cohort } from '../src/engine';
import { COHORT } from '../src/data/cohort';
import {
  freeId,
  nextAnimalId,
  nextApplicantId,
  addAnimal,
  addApplicant,
  removeAnimal,
  removeApplicant,
  claimants,
} from '../src/data/cohortEdit';

describe('id allocation for added records', () => {
  it('never hands out an id the cohort already uses', () => {
    const animalIds = new Set(COHORT.animals.map((a) => a.id));
    const applicantIds = new Set(COHORT.applicants.map((p) => p.id));

    expect(animalIds.has(freeId('a', animalIds))).toBe(false);
    expect(applicantIds.has(freeId('p', applicantIds))).toBe(false);
  });

  it('steps past a collision rather than returning a taken id', () => {
    // The demo cohort's households are p01..p22, so a naive count+1 on a set
    // that has had one removed would land straight on an existing id.
    const taken = new Set(['p01', 'p02', 'p03']);
    taken.delete('p02');
    expect(taken.has(freeId('p', taken))).toBe(false);

    const dense = new Set(Array.from({ length: 22 }, (_, i) => `p${String(i + 1).padStart(2, '0')}`));
    expect(dense.has(freeId('p', dense))).toBe(false);
  });

  it('stays unique across a run of consecutive additions', () => {
    const taken = new Set(COHORT.animals.map((a) => a.id));
    const issued: string[] = [];
    for (let i = 0; i < 25; i++) {
      const id = freeId('a', taken);
      expect(taken.has(id)).toBe(false);
      issued.push(id);
      taken.add(id);
    }
    expect(new Set(issued).size).toBe(issued.length);
  });
});

// ─── An edited cohort must still be a cohort the engine can answer ─────────

describe('an edited cohort still matches correctly', () => {
  const addedAnimal: Animal = {
    id: 'a99',
    name: 'Test Animal',
    photo: '',
    species: 'dog',
    ageYears: 3,
    sizeKg: 15,
    energy: 3,
    behaviouralDifficulty: 2,
    okWithChildren: true,
    okWithOtherPets: true,
    needsYard: false,
    needsQuietHome: false,
    dailyMedication: false,
    specialNeeds: [],
    daysInShelter: 30,
  };

  const addedApplicant: Applicant = {
    id: 'p99',
    name: 'Test Household',
    surveyed: false,
    homeType: 'house',
    hasYard: true,
    hoursAwayPerDay: 4,
    hasChildren: false,
    hasOtherPets: false,
    experience: 4,
    canDoDailyMeds: true,
    maxSizeKg: 40,
    specificAnimalId: null,
    prefersSpecies: 'dog',
    prefersAge: 'adult',
    prefersEnergy: 3,
  };

  const edited: Cohort = {
    animals: [...COHORT.animals, addedAnimal],
    applicants: [...COHORT.applicants, addedApplicant],
  };

  it('stays stable and constraint-clean with added records', () => {
    for (const equityWeight of [0, 0.3, 1]) {
      const result = runMatch(edited, { equityWeight });
      expect({ equityWeight, stable: result.isStable }).toEqual({ equityWeight, stable: true });

      for (const assignment of result.assignments) {
        const animal = edited.animals.find((a) => a.id === assignment.animalId);
        const applicant = edited.applicants.find((p) => p.id === assignment.applicantId);
        if (animal === undefined || applicant === undefined) continue;
        expect(evaluatePair(animal, applicant)).toEqual([]);
      }
    }
  });

  it('places every animal at most once, added ones included', () => {
    // The symptom a duplicate id would produce, asserted directly.
    const result = runMatch(edited, { equityWeight: 0.3 });
    const animalIds = result.assignments.map((a) => a.animalId);
    const applicantIds = result.assignments.map((a) => a.applicantId);
    expect(new Set(animalIds).size).toBe(animalIds.length);
    expect(new Set(applicantIds).size).toBe(applicantIds.length);
  });

  it('leaves the committed cohort untouched', () => {
    // Editing is in-session only. If an add ever mutated the imported arrays,
    // every later test in the run would be scoring a different board.
    expect(COHORT.animals).toHaveLength(16);
    expect(COHORT.applicants).toHaveLength(22);
    expect(COHORT.animals.some((a) => a.id === 'a99')).toBe(false);
    expect(COHORT.applicants.some((p) => p.id === 'p99')).toBe(false);
  });
});

// ─── Removal ───────────────────────────────────────────────────────────────

// `noUncheckedIndexedAccess` is on, so index reads are widened to `| undefined`
// and guarded once here rather than asserted away at every use.
const firstAnimal = COHORT.animals[0];
const secondApplicant = COHORT.applicants[1];
if (firstAnimal === undefined || secondApplicant === undefined) {
  throw new Error('the committed cohort is too small for these tests');
}

describe('removing a record', () => {
  it('drops the animal and nothing else', () => {
    const after = removeAnimal(COHORT, 'otis');

    expect(after.animals.some((animal) => animal.id === 'otis')).toBe(false);
    expect(after.animals).toHaveLength(COHORT.animals.length - 1);
    expect(after.applicants).toHaveLength(COHORT.applicants.length);
  });

  it('clears the named claim of a household that came for that animal', () => {
    // p08 came for Otis by name (cohort.ts). With Otis gone the claim cannot
    // stand: SPECIFIC_ANIMAL_SCORE would be waiting to fire for whoever is
    // handed the id 'otis' next.
    expect(claimants(COHORT, 'otis').map((applicant) => applicant.id)).toEqual(['p08']);

    const after = removeAnimal(COHORT, 'otis');
    const p08 = after.applicants.find((applicant) => applicant.id === 'p08');
    expect(p08?.specificAnimalId).toBeNull();

    // Everyone else's claim survives untouched.
    const p05 = after.applicants.find((applicant) => applicant.id === 'p05');
    expect(p05?.specificAnimalId).toBe('sable');
  });

  it('never leaves a claim pointing at an animal that is not in the cohort', () => {
    // The invariant, asserted over every animal rather than the two that
    // happen to be claimed today.
    for (const animal of COHORT.animals) {
      const after = removeAnimal(COHORT, animal.id);
      const ids = new Set(after.animals.map((a) => a.id));
      for (const applicant of after.applicants) {
        if (applicant.specificAnimalId === null) continue;
        expect({ animal: animal.id, claim: applicant.specificAnimalId }).toEqual({
          animal: animal.id,
          claim: ids.has(applicant.specificAnimalId) ? applicant.specificAnimalId : 'DANGLING',
        });
      }
    }
  });

  it('drops the household and leaves every animal in place', () => {
    const after = removeApplicant(COHORT, 'p05');

    expect(after.applicants.some((applicant) => applicant.id === 'p05')).toBe(false);
    expect(after.applicants).toHaveLength(COHORT.applicants.length - 1);
    expect(after.animals).toEqual(COHORT.animals);
  });

  it('refuses to empty either side of the cohort', () => {
    const onlyApplicant = { ...secondApplicant, specificAnimalId: null };
    const oneEach: Cohort = { animals: [firstAnimal], applicants: [onlyApplicant] };

    expect(removeAnimal(oneEach, firstAnimal.id)).toEqual(oneEach);
    expect(removeApplicant(oneEach, onlyApplicant.id)).toEqual(oneEach);
  });

  it('ignores an id that is not in the cohort', () => {
    expect(removeAnimal(COHORT, 'not-an-animal')).toEqual(COHORT);
    expect(removeApplicant(COHORT, 'not-a-household')).toEqual(COHORT);
  });

  it('does not mutate the cohort it was given', () => {
    // Removal rewrites applicant records to clear claims. If it did that in
    // place, the imported COHORT — shared with every other test file and with
    // the demo's reset button — would be permanently altered.
    const animals = COHORT.animals.length;
    const applicants = COHORT.applicants.length;

    removeAnimal(COHORT, 'otis');
    removeApplicant(COHORT, 'p05');

    expect(COHORT.animals).toHaveLength(animals);
    expect(COHORT.applicants).toHaveLength(applicants);
    expect(COHORT.applicants.find((a) => a.id === 'p08')?.specificAnimalId).toBe('otis');
  });
});

describe('a cohort someone has edited still matches correctly', () => {
  it('stays stable and constraint-clean after removals', () => {
    // Remove from both sides, including a claimed animal, then re-run the two
    // properties the whole system rests on.
    let cohort = removeAnimal(COHORT, 'otis');
    cohort = removeApplicant(cohort, 'p05');
    cohort = removeApplicant(cohort, 'p01');

    for (const equityWeight of [0, 0.3, 1]) {
      const result = runMatch(cohort, { equityWeight });
      expect({ equityWeight, stable: result.isStable }).toEqual({ equityWeight, stable: true });

      for (const assignment of result.assignments) {
        const animal = cohort.animals.find((a) => a.id === assignment.animalId);
        const applicant = cohort.applicants.find((p) => p.id === assignment.applicantId);
        if (animal === undefined || applicant === undefined) continue;
        expect(evaluatePair(animal, applicant)).toEqual([]);
      }
    }
  });

  it('places nobody who is no longer in the cohort', () => {
    const cohort = removeApplicant(removeAnimal(COHORT, 'otis'), 'p05');
    const result = runMatch(cohort, { equityWeight: 0.3 });

    for (const assignment of result.assignments) {
      expect(cohort.animals.some((a) => a.id === assignment.animalId)).toBe(true);
      expect(cohort.applicants.some((p) => p.id === assignment.applicantId)).toBe(true);
    }
  });

  it('survives remove-then-add without reissuing a live id', () => {
    // The case the allocator was written for, now actually reachable.
    let cohort = removeApplicant(COHORT, 'p05');
    const issued = nextApplicantId(cohort);
    expect(cohort.applicants.some((applicant) => applicant.id === issued)).toBe(false);

    cohort = addApplicant(cohort, { ...secondApplicant, id: issued, specificAnimalId: null });
    const ids = cohort.applicants.map((applicant) => applicant.id);
    expect(new Set(ids).size).toBe(ids.length);

    const nextAnimal = nextAnimalId(cohort);
    expect(cohort.animals.some((animal) => animal.id === nextAnimal)).toBe(false);
  });

  it('keeps ids unique through an alternating add/remove run', () => {
    let cohort: Cohort = COHORT;

    for (let i = 0; i < 12; i++) {
      const id = nextAnimalId(cohort);
      expect(cohort.animals.some((animal) => animal.id === id)).toBe(false);
      cohort = addAnimal(cohort, { ...firstAnimal, id, name: `Added ${id}` });

      // Every third pass, take one of the originals back out — so the ids the
      // allocator has to step around are a moving target, not a prefix.
      const victim = COHORT.animals[i % COHORT.animals.length];
      if (i % 3 === 0 && victim !== undefined) cohort = removeAnimal(cohort, victim.id);
    }

    const ids = cohort.animals.map((animal) => animal.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(runMatch(cohort, { equityWeight: 0.3 }).isStable).toBe(true);
  });
});
