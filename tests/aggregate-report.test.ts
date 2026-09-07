// Randomised aggregate — PRD P1-3, Architecture §7.
//
// "Run greedy() and runMatch() across 500 generated cohorts, report mean
// hard-constraint violations for each. Nearly free — reuses the
// property-test generator. Kills the 'your demo cohort is rigged by
// construction' objection before it's raised."
//
// This is a REPORT, not a correctness proof — property 1 and 2 in
// engine.test.ts already prove correctness. This file exists to print the
// numbers a judge or a Devpost writeup can quote. Run it on its own with:
//   npx vitest run tests/aggregate-report.test.ts

import { describe, it, expect } from 'vitest';
import { compare, countViolations, randomCohort } from '../src/engine';

const COHORTS = 500;
const EQUITY_WEIGHT = 0.5;

describe('randomised aggregate — greedy vs stable', () => {
  it('reports mean and worst-case hard-constraint violations across 500 cohorts', () => {
    const greedyViolations: number[] = [];
    const stableViolations: number[] = [];

    for (let seed = 0; seed < COHORTS; seed++) {
      const cohort = randomCohort(seed);
      const { greedy, stable } = compare(cohort, { equityWeight: EQUITY_WEIGHT });

      const stableMatching = new Map(
        stable.assignments.map((assignment) => [assignment.animalId, assignment.applicantId]),
      );

      greedyViolations.push(greedy.constraintViolations);
      stableViolations.push(countViolations(cohort, stableMatching));
    }

    const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
    const max = (values: number[]) => Math.max(...values);
    const cohortsWithAnyGreedyViolation = greedyViolations.filter((v) => v > 0).length;

    const report = {
      cohorts: COHORTS,
      equityWeight: EQUITY_WEIGHT,
      greedy: {
        meanViolations: Number(mean(greedyViolations).toFixed(3)),
        worstCase: max(greedyViolations),
        cohortsWithAtLeastOneViolation: cohortsWithAnyGreedyViolation,
      },
      stable: {
        meanViolations: Number(mean(stableViolations).toFixed(3)),
        worstCase: max(stableViolations),
      },
    };

    // Printed for the Devpost writeup / demo script — not asserted on, since
    // the exact mean depends on the generator and isn't the claim being made.
    console.log('\nRANDOMISED AGGREGATE (500 cohorts) —', JSON.stringify(report, null, 2));

    // The claim the demo makes out loud: stable is provably clean, greedy
    // provably is not, across the whole generated space — not just one cohort.
    expect(report.stable.meanViolations).toBe(0);
    expect(report.stable.worstCase).toBe(0);
    expect(report.greedy.meanViolations).toBeGreaterThan(0);
    expect(report.greedy.cohortsWithAtLeastOneViolation).toBeGreaterThan(0);
  });
});
