// The claims the demo makes OUT LOUD, pinned against real engine output.
//
// ─── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
//
// engine.test.ts proves the algorithm is correct. Correct is not the same as
// true-on-stage. Every assertion below was FAILING against the committed
// cohort while all 15 tests in the other two files were green:
//
//   PRD §8 step 8 says "Slide the equity dial. Bruno matches." Bruno was in
//   fact matched at every setting from 0 to 1, so there was nothing to reveal.
//   What the dial actually did was move him off the household that came for
//   him BY NAME onto one the shelter scored higher — so the hero interaction,
//   live in front of a judge, took Bruno away from the family that asked for
//   him, in the same breath as the script has the presenter promise that a
//   named choice is never overridden.
//
// That is a cohort defect, not an engine defect, and PRD §9 prescribes the fix
// in the cohort ("adjust the cohort so the story is true — never adjust the
// story"). These tests are what stops it drifting back.
//
// ─── SCOPE — READ BEFORE ADDING TO THIS FILE ───────────────────────────────
//
// These are DEMO-COHORT regression guards, not property tests, and they must
// stay that way. "A household that came for an animal by name gets it" is NOT
// a theorem about stable matching — two households can want the same animal
// and only one can have it — so asserting it over randomised cohorts would be
// asserting something false. It is a property of THIS cohort, which is exactly
// the thing that has to be true at 5:15pm on stage.
//
// Universal claims belong in engine.test.ts. Claims about what a judge will
// see belong here.

import { describe, it, expect } from 'vitest';
import { runMatch, evaluatePair, compare } from '../src/engine';
import { COHORT } from '../src/data/cohort';

/** Every setting the slider can reach, at its 0.05 step. */
const ALL_SETTINGS = Array.from({ length: 21 }, (_, i) => Number((i * 0.05).toFixed(2)));

const nameOf = (id: string): string =>
  COHORT.animals.find((a) => a.id === id)?.name ??
  COHORT.applicants.find((p) => p.id === id)?.name ??
  id;

const partnerOfAnimal = (animalId: string, equityWeight: number): string | null =>
  runMatch(COHORT, { equityWeight }).assignments.find((a) => a.animalId === animalId)
    ?.applicantId ?? null;

// ─── CLAIM 1 — "Slide the equity dial. Bruno matches." (PRD §8 step 8) ─────

describe('demo claim — the dial rescues Bruno', () => {
  it('leaves Bruno unmatched at pure want, the board the judge sees first', () => {
    // App.tsx opens at equityWeight 0 precisely so this is the first board.
    const atZero = runMatch(COHORT, { equityWeight: 0 });
    expect(atZero.assignments.map((a) => a.animalId)).not.toContain('bruno');
    expect(atZero.unmatchedAnimals.map((u) => u.animalId)).toContain('bruno');
  });

  it('places Bruno once the dial is raised, and keeps him placed to the top', () => {
    const matched = ALL_SETTINGS.filter((w) => partnerOfAnimal('bruno', w) !== null);
    expect(matched.length).toBeGreaterThan(0);

    // No flapping: once he is in, he stays in. A dial that placed him at 0.4
    // and dropped him again at 0.6 would be unpresentable.
    const firstMatch = Math.min(...matched);
    expect(matched).toEqual(ALL_SETTINGS.filter((w) => w >= firstMatch));
  });

  it('flips him inside the slider’s reach, not at either extreme', () => {
    // If the flip sat at 0.05 the beat is over before the presenter speaks; at
    // 1.0 it needs the dial pinned to the stop, which reads as forcing it.
    const firstMatch = Math.min(
      ...ALL_SETTINGS.filter((w) => partnerOfAnimal('bruno', w) !== null),
    );
    expect(firstMatch).toBeGreaterThanOrEqual(0.15);
    expect(firstMatch).toBeLessThanOrEqual(0.6);
  });

  it('rescues him without breaking a single hard constraint', () => {
    // The guardrail stated on stage: equity moves ties, never constraints.
    for (const equityWeight of ALL_SETTINGS) {
      const result = runMatch(COHORT, { equityWeight });
      expect({ equityWeight, stable: result.isStable }).toEqual({ equityWeight, stable: true });

      for (const assignment of result.assignments) {
        const animal = COHORT.animals.find((a) => a.id === assignment.animalId);
        const applicant = COHORT.applicants.find((p) => p.id === assignment.applicantId);
        if (animal === undefined || applicant === undefined) continue;
        expect({
          equityWeight,
          pair: `${animal.id}/${applicant.id}`,
          failed: evaluatePair(animal, applicant).map((f) => f.constraintId),
        }).toEqual({ equityWeight, pair: `${animal.id}/${applicant.id}`, failed: [] });
      }
    }
  });
});

// ─── CLAIM 2 — a named choice is never overridden (PRD §8 step 8) ──────────

describe('demo claim — a household that came for an animal by name keeps it', () => {
  it('has households in the cohort that came for a specific animal', () => {
    // Guard the guard: if someone strips every specificAnimalId, the test
    // below would pass vacuously and the feature would go undemonstrated.
    const named = COHORT.applicants.filter((p) => p.specificAnimalId !== null);
    expect(named.length).toBeGreaterThanOrEqual(2);
  });

  it('honours every named request at EVERY dial setting', () => {
    const named = COHORT.applicants.filter((p) => p.specificAnimalId !== null);

    for (const equityWeight of ALL_SETTINGS) {
      const result = runMatch(COHORT, { equityWeight });

      for (const applicant of named) {
        const assignment = result.assignments.find((a) => a.applicantId === applicant.id);
        expect({
          equityWeight,
          household: applicant.name,
          got: assignment === undefined ? 'nothing' : nameOf(assignment.animalId),
        }).toEqual({
          equityWeight,
          household: applicant.name,
          got: nameOf(applicant.specificAnimalId as string),
        });
      }
    }
  });

  it('ranks the named animal first for that household, at every setting', () => {
    // The rationale line rendered on screen says the choice "was never
    // overridden" — this is the half of that claim about the ranking itself.
    for (const equityWeight of ALL_SETTINGS) {
      const result = runMatch(COHORT, { equityWeight });
      for (const assignment of result.assignments) {
        const applicant = COHORT.applicants.find((p) => p.id === assignment.applicantId);
        if (applicant?.specificAnimalId == null) continue;
        if (assignment.animalId !== applicant.specificAnimalId) continue;
        expect({ equityWeight, rank: assignment.applicantRankOfAnimal }).toEqual({
          equityWeight,
          rank: 1,
        });
      }
    }
  });
});

// ─── CLAIM 3 — the recruitment diagnostic (PRD §8 step 9) ──────────────────

describe('demo claim — the unmatched animal is a recruitment finding', () => {
  it('leaves Ember unplaceable at every setting, with zero viable households', () => {
    const ember = COHORT.animals.find((a) => a.id === 'ember');
    expect(ember).toBeDefined();
    if (ember === undefined) return;

    // Not "nobody chose her" — nobody in this cohort CAN take her. That is what
    // makes the recruitment profile a finding rather than an apology, and it is
    // why no dial setting can or should rescue her.
    const viable = COHORT.applicants.filter((p) => evaluatePair(ember, p).length === 0);
    expect(viable).toEqual([]);

    for (const equityWeight of ALL_SETTINGS) {
      expect({ equityWeight, partner: partnerOfAnimal('ember', equityWeight) }).toEqual({
        equityWeight,
        partner: null,
      });
    }
  });

  it('generates a recruitment profile naming what Ember actually needs', () => {
    const unmatched = runMatch(COHORT, { equityWeight: 0 }).unmatchedAnimals.find(
      (u) => u.animalId === 'ember',
    );
    expect(unmatched).toBeDefined();
    expect(unmatched?.recruitmentProfile).toContain('Ember');
    expect(unmatched?.recruitmentProfile).toContain('yard');
  });
});

// ─── The exact figures PRD §8 quotes on stage ──────────────────────────────
//
// The demo script now names three specific values out loud: the dial setting
// Bruno flips at, the household he flips to, and how many placements move with
// him. Quoting a number on stage means owning it, so they are pinned here.
//
// If one of these fails, nothing is necessarily broken — but PRD §8 is now
// wrong, and the fix is to re-read these values and update the script, not to
// loosen the test.

describe('demo script — the figures PRD §8 says out loud', () => {
  const partnersAt = (equityWeight: number): Map<string, string> =>
    new Map(
      runMatch(COHORT, { equityWeight }).assignments.map((a) => [a.animalId, a.applicantId]),
    );

  it('flips Bruno at exactly 0.30, to Household 03', () => {
    expect(partnersAt(0.25).get('bruno')).toBeUndefined();

    const partner = partnersAt(0.3).get('bruno');
    expect(partner).toBeDefined();
    expect(nameOf(partner as string)).toBe('Household 03');
  });

  it('moves exactly six placements when he flips', () => {
    const before = partnersAt(0);
    const after = partnersAt(0.3);
    const moved = COHORT.animals.filter((a) => before.get(a.id) !== after.get(a.id));
    expect(moved.map((a) => a.name).sort()).toEqual(
      ['Barnaby', 'Bruno', 'Clementine', 'Fern', 'Juno', 'Tilly'],
    );
  });

  it('has the grid the script quotes: 16 × 22 = 352', () => {
    expect(COHORT.animals.length).toBe(16);
    expect(COHORT.applicants.length).toBe(22);
    expect(COHORT.animals.length * COHORT.applicants.length).toBe(352);
  });

  it('has greedy place Bruno into three violated constraints, on a board of five', () => {
    const { greedy: baseline } = compare(COHORT, { equityWeight: 0 });
    expect(baseline.constraintViolations).toBe(5);

    const brunoPair = baseline.violatingPairs.find((v) => v.animalId === 'bruno');
    expect(brunoPair).toBeDefined();
    expect(brunoPair?.failed).toHaveLength(3);
  });
});

// ─── CLAIM 4 — the regret panel does not contradict itself ─────────────────
//
// engine.test.ts pins what the two rank fields MEAN. It cannot catch a
// component reading the wrong one — which is exactly what shipped: the panel
// showed "worst matched rank, animal side: 12" directly above "the worst-off
// animal ... matched its #5 choice". This pins the numbers the judge actually
// sees on the demo cohort, so the headline and the sentence must agree.

describe('demo claim — the regret panel is internally consistent', () => {
  it('names a worst-off animal whose rank equals the headline tile', () => {
    for (const equityWeight of [0, 0.3, 1]) {
      const result = runMatch(COHORT, { equityWeight });

      // The same selection RegretView makes, on the same field it must read.
      const worst = [...result.assignments].sort(
        (a, b) => b.shelterRankOfApplicant - a.shelterRankOfApplicant,
      )[0];
      expect(worst).toBeDefined();
      if (worst === undefined) continue;

      expect({ equityWeight, sentence: worst.shelterRankOfApplicant }).toEqual({
        equityWeight,
        sentence: result.regret.worstAnimalRank,
      });
    }
  });

  it('keeps the two first-choice tiles on their own sides of the match', () => {
    // The panel now shows both figures side by side, and they are wildly
    // different — which is the point, but it also means a swap between them
    // would look entirely plausible on screen. This pins each to its own side.
    //
    // Animal side: only Sable got its top-ranked household. Household side:
    // most households did get the animal they wanted most. Reading either
    // number under the other's label is the bug that shipped once already.
    const result = runMatch(COHORT, { equityWeight: 0.3 });

    const animalSide = result.assignments.filter((a) => a.shelterRankOfApplicant === 1);
    expect(animalSide).toHaveLength(1);
    expect(nameOf(animalSide[0]?.animalId as string)).toBe('Sable');

    const householdSide = result.assignments.filter((a) => a.applicantRankOfAnimal === 1);
    expect(householdSide).toHaveLength(9);

    // If these two ever come out equal the tiles have almost certainly been
    // wired to the same field again.
    expect(animalSide.length).not.toBe(householdSide.length);
  });
});
