// Guards runtime cohort editing — P0-1 / P0-2.
//
// A visitor can add animals and households to the cohort in-session. That path
// is deliberately ephemeral (see data/surveyCapture.ts), but "ephemeral" does
// not mean "unchecked": whatever it produces is fed straight into runMatch,
// and the engine indexes both sides by id in a Map.
//
// A DUPLICATE ID IS THE FAILURE THAT MATTERS. Two animals sharing an id do not
// throw — one silently overwrites the other in the preference maps, the board
// renders a placement for an animal that is not in it, and the property tests
// never see any of it because they run on the committed cohort. That is the
// worst class of bug available here: wrong, quiet, and only visible on stage.

import { describe, it, expect } from 'vitest';
import { runMatch, evaluatePair, type Animal, type Applicant, type Cohort } from '../src/engine';
import { COHORT } from '../src/data/cohort';

/**
 * The id allocator from App.tsx, which must not hand out an id already in use.
 *
 * Duplicated here rather than exported, because App.tsx is a component module
 * and importing it into a node-environment test would pull in React and the
 * whole tree. If you change it there, change it here — the assertions below
 * describe the contract, not the implementation.
 */
function freeId(prefix: string, taken: Set<string>): string {
  let n = taken.size + 1;
  while (taken.has(`${prefix}${String(n).padStart(2, '0')}`)) n += 1;
  return `${prefix}${String(n).padStart(2, '0')}`;
}

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
