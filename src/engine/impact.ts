// STEP 8 — MODEL. Two numbers, never combined.
//
//   (a) EFFORT SAVED — pairwise reviews avoided. Provable, ours.
//   (b) PROJECTED WELFARE EFFECT — RESEARCH constants applied to violations
//       present in greedy and absent in stable, scaled by assumptionLevel.
//       Labelled a projection; every constant and source shown.
//
// PRD §3.3: framed as odds, never as prevented returns.
// PHASE 0: signature only.

import type { Cohort } from './types';

export interface ImpactModel {
  effortSaved: { pairwiseReviewsAvoided: number };
  projectedWelfare: {
    value: number;
    assumptionLevel: number;
    caveat: string;
  };
}

export function computeImpact(
  _cohort: Cohort,
  _greedyViolations: number,
  _assumptionLevel: number,
): ImpactModel {
  throw new Error('computeImpact: not implemented — Architecture §6 STEP 8');
}
