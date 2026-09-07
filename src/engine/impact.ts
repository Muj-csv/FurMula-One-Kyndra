// STEP 8 — MODEL. Two numbers, NEVER combined.
//
//   (a) EFFORT SAVED — pairwise judgements avoided on this cohort. Provable,
//       ours, no research needed. It is arithmetic about the shelter's day.
//
//   (b) PROJECTED WELFARE EFFECT — RESEARCH constants applied to the
//       constraint violations present in the greedy baseline and absent from
//       the stable assignment, scaled by assumptionLevel. A projection. Every
//       constant and source is carried on the object so the UI cannot render
//       the number without them.
//
// PRD §3.3: framed as odds, never as prevented returns. The tool proposes;
// staff decide. The two claims must not contradict each other.

import type { Cohort } from './types';
import { RESEARCH, PROJECTION_CAVEAT } from '../data/researchConstants';

/** Conservative and optimistic ends of the assumption toggle (Architecture §6). */
export const ASSUMPTION_CONSERVATIVE = 0.4;
export const ASSUMPTION_OPTIMISTIC = 0.6;

export interface ImpactModel {
  effortSaved: {
    pairwiseJudgementsAvoided: number;
    animals: number;
    applicants: number;
    note: string;
  };
  projectedWelfare: {
    violationsAvoided: number;
    assumptionLevel: number;
    /** Expected returns averted, per the model. NOT an outcome claim. */
    projectedReturnsAverted: number;
    /** Adopters retained, following the compounding path in PRD §1. */
    projectedAdoptersRetained: number;
    constants: { label: string; source: string }[];
    caveat: string;
  };
}

export function computeImpact(
  cohort: Cohort,
  greedyViolations: number,
  stableViolations: number,
  assumptionLevel: number = ASSUMPTION_CONSERVATIVE,
): ImpactModel {
  const animals = cohort.animals.length;
  const applicants = cohort.applicants.length;
  const violationsAvoided = Math.max(0, greedyViolations - stableViolations);

  // A violation is a pairing the research associates with a behavioural or
  // household-pet return. Scale by the share of returns those causes account
  // for, then by the assumption level, which says how much of the research's
  // behavioural variance our eight constraints plausibly capture.
  const returnCauseShare =
    RESEARCH.behaviouralShareOfReturns.value + RESEARCH.householdPetConflictShare.value;

  const projectedReturnsAverted = violationsAvoided * returnCauseShare * assumptionLevel;

  // Each averted return also keeps an adopter: ~9 in 10 who return never adopt again.
  const projectedAdoptersRetained = projectedReturnsAverted * (1 - RESEARCH.readoptionRate.value);

  return {
    effortSaved: {
      pairwiseJudgementsAvoided: animals * applicants,
      animals,
      applicants,
      note: `${animals} animals \u00d7 ${applicants} applications is ${animals * applicants} pairwise judgements to make by hand.`,
    },
    projectedWelfare: {
      violationsAvoided,
      assumptionLevel,
      projectedReturnsAverted,
      projectedAdoptersRetained,
      constants: [
        {
          label: RESEARCH.behaviouralShareOfReturns.label,
          source: RESEARCH.behaviouralShareOfReturns.source,
        },
        {
          label: RESEARCH.householdPetConflictShare.label,
          source: RESEARCH.householdPetConflictShare.source,
        },
        { label: RESEARCH.readoptionRate.label, source: RESEARCH.readoptionRate.source },
      ],
      caveat: PROJECTION_CAVEAT,
    },
  };
}
