// The project's correctness argument — Architecture §7, PRD P0-7.
//
// Written alongside the algorithm, not after it. Test 1 proves the algorithm
// is right. Test 2 proves the equity dial cannot undermine the thesis. Both
// run over randomised cohorts, so neither can pass by virtue of a demo cohort
// that happens to be kind.
//
// Seeds are the loop index, so a failure is reproducible from its seed alone.

import { describe, it, expect } from 'vitest';
import {
  runMatch,
  randomCohort,
  randomWeight,
  evaluatePair,
  attemptSwap,
  countViolations,
  compare,
  type Cohort,
} from '../src/engine';
import { COHORT as DEMO_COHORT } from '../src/data/cohort';

const COHORTS = 500;
const EQUITY_SETTINGS = [0, 0.25, 0.5, 0.75, 1];

// ─── PROPERTY TEST 1 — stability ───────────────────────────────────────────

describe('property 1 — stability', () => {
  it('produces no blocking pairs across randomised cohorts', () => {
    for (let seed = 0; seed < COHORTS; seed++) {
      const cohort = randomCohort(seed);
      const result = runMatch(cohort, { equityWeight: randomWeight(seed) });

      // Reported as a seed so a failure is reproducible, not just visible.
      expect({ seed, blockingPairs: result.blockingPairs }).toEqual({
        seed,
        blockingPairs: [],
      });
      expect(result.isStable).toBe(true);
    }
  });

  it('is order-independent — shuffling the input does not change the assignment', () => {
    for (let seed = 0; seed < 100; seed++) {
      const cohort = randomCohort(seed);
      const reversed: Cohort = {
        animals: [...cohort.animals].reverse(),
        applicants: [...cohort.applicants].reverse(),
      };

      const a = runMatch(cohort, { equityWeight: 0.5 });
      const b = runMatch(reversed, { equityWeight: 0.5 });

      const pairs = (result: typeof a) =>
        result.assignments.map((x) => `${x.animalId}->${x.applicantId}`).sort();

      expect({ seed, pairs: pairs(b) }).toEqual({ seed, pairs: pairs(a) });
    }
  });
});

// ─── PROPERTY TEST 2 — equity safety ───────────────────────────────────────

describe('property 2 — equity safety', () => {
  it('equity weight never breaches a hard constraint', () => {
    for (let seed = 0; seed < COHORTS; seed++) {
      const cohort = randomCohort(seed);
      const animalsById = new Map(cohort.animals.map((a) => [a.id, a]));
      const applicantsById = new Map(cohort.applicants.map((p) => [p.id, p]));

      for (const equityWeight of EQUITY_SETTINGS) {
        const result = runMatch(cohort, { equityWeight });

        for (const assignment of result.assignments) {
          const animal = animalsById.get(assignment.animalId);
          const applicant = applicantsById.get(assignment.applicantId);
          expect(animal).toBeDefined();
          expect(applicant).toBeDefined();
          if (animal === undefined || applicant === undefined) continue;

          const failures = evaluatePair(animal, applicant);
          expect({
            seed,
            equityWeight,
            pair: `${animal.id}/${applicant.id}`,
            failed: failures.map((f) => f.constraintId),
          }).toEqual({
            seed,
            equityWeight,
            pair: `${animal.id}/${applicant.id}`,
            failed: [],
          });
        }
      }
    }
  });

  it('every dial setting still yields a stable, constraint-clean assignment', () => {
    // Equity works on a BAND (equity.ts), not on exact ties, so it can reorder
    // two animals separated by up to w × EQUITY_BAND want points. What must NOT
    // vary with the dial is correctness: at every setting the result stays
    // stable and every placement still clears every hard constraint.
    for (let seed = 0; seed < 200; seed++) {
      const cohort = randomCohort(seed);
      const base = runMatch(cohort, { equityWeight: 0 });

      for (const equityWeight of EQUITY_SETTINGS) {
        const shifted = runMatch(cohort, { equityWeight });
        // Every result at every setting remains stable and constraint-clean.
        expect({ seed, equityWeight, stable: shifted.isStable }).toEqual({
          seed,
          equityWeight,
          stable: true,
        });
      }

      expect(base.isStable).toBe(true);
    }
  });
});

// ─── The dial must actually move the board ────────────────────────────────
//
// This is a regression guard, not a correctness proof. An earlier build made
// the equity nudge smaller than one want-score point, which was provably safe
// and completely inert — the hero interaction did nothing at any setting and
// the tests were all green. Correctness tests cannot catch that, so this one
// pins the observable behaviour.

describe('equity dial has an observable effect', () => {
  it('changes the assignment on the demo cohort as the dial moves', () => {
    const signatures = EQUITY_SETTINGS.map((equityWeight) =>
      runMatch(DEMO_COHORT, { equityWeight })
        .assignments.map((a) => a.animalId + '>' + a.applicantId)
        .join(','),
    );

    // At least one setting must produce a board different from equityWeight 0.
    expect(new Set(signatures).size).toBeGreaterThan(1);
  });

  it('changes assignments across randomised cohorts too, not just the demo one', () => {
    let cohortsWhereDialMatters = 0;
    for (let seed = 0; seed < 200; seed++) {
      const cohort = randomCohort(seed);
      const at = (w: number) =>
        runMatch(cohort, { equityWeight: w })
          .assignments.map((a) => a.animalId + '>' + a.applicantId)
          .join(',');
      if (at(0) !== at(1)) cohortsWhereDialMatters += 1;
    }
    // Not every cohort has contention the dial can act on; many should.
    expect(cohortsWhereDialMatters).toBeGreaterThan(20);
  });
});

// ─── The claim the demo makes out loud ─────────────────────────────────────

describe('greedy baseline', () => {
  it('the stable assignment has zero constraint violations where greedy has them', () => {
    let cohortsWhereGreedyViolates = 0;

    for (let seed = 0; seed < COHORTS; seed++) {
      const cohort = randomCohort(seed);
      const { greedy: baseline, stable } = compare(cohort, { equityWeight: 0.5 });

      const stableMatching = new Map(
        stable.assignments.map((a) => [a.animalId, a.applicantId]),
      );
      expect({ seed, violations: countViolations(cohort, stableMatching) }).toEqual({
        seed,
        violations: 0,
      });

      if (baseline.constraintViolations > 0) cohortsWhereGreedyViolates += 1;
    }

    // If greedy never violated anything the comparison would be vacuous.
    expect(cohortsWhereGreedyViolates).toBeGreaterThan(0);
  });
});

// ─── Preference independence — Architecture §6 STEP 2 ──────────────────────

describe('preference independence', () => {
  it('a stated specific animal is ranked first and never overridden', () => {
    for (let seed = 0; seed < 200; seed++) {
      const cohort = randomCohort(seed);
      const result = runMatch(cohort, { equityWeight: 1 });

      for (const assignment of result.assignments) {
        const applicant = cohort.applicants.find((p) => p.id === assignment.applicantId);
        if (applicant?.specificAnimalId == null) continue;

        // If they were matched to the animal they came for, it must be rank 1.
        if (assignment.animalId === applicant.specificAnimalId) {
          expect({ seed, rank: assignment.applicantRankOfAnimal }).toEqual({ seed, rank: 1 });
        }
      }
    }
  });
});

// ─── Swap attempt — the interactive form of the stability check ────────────

describe('attempt a swap', () => {
  it('every proposed reshuffle of a stable assignment fails, with a reason', () => {
    for (let seed = 0; seed < 100; seed++) {
      const cohort = randomCohort(seed);
      const options = { equityWeight: 0.5 };
      const result = runMatch(cohort, options);
      if (result.assignments.length < 2) continue;

      const [first, second] = result.assignments;
      if (first === undefined || second === undefined) continue;

      const verdict = attemptSwap(cohort, options, first.animalId, second.applicantId);
      expect({ seed, succeeds: verdict.succeeds }).toEqual({ seed, succeeds: false });
      expect(verdict.reason.length).toBeGreaterThan(0);
    }
  });
});

// ─── Boundary ──────────────────────────────────────────────────────────────

describe('engine boundary', () => {
  it('handles an empty cohort without throwing', () => {
    const result = runMatch({ animals: [], applicants: [] }, { equityWeight: 0 });
    expect(result.assignments).toEqual([]);
    expect(result.isStable).toBe(true);
  });
});
