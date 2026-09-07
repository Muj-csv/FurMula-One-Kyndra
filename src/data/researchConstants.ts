// Every cited figure — one source of truth. Architecture §5.
//
// RULES (non-negotiable — PRD §3):
//   1. Every number displayed anywhere resolves through RESEARCH.
//      NO NUMERIC LITERALS IN COMPONENTS.
//   2. `source` renders on screen wherever the value appears.
//   3. Powell 2021 ONLY for return composition. Do not add the 32.8% / 21.5%
//      figures from a separate analysis — mixing studies looks like
//      cherry-picking.
//   4. Cohort size is described as "sized consistent with Shelter Animals
//      Count's published per-organisation averages," never as sourced from
//      their dataset.

export const RESEARCH = {
  dogReturnRate: {
    value: 0.163,
    label: '16.3% of adopted dogs returned',
    source:
      'Powell et al. 2021, Scientific Reports (n=23,932, UPenn / Charleston Animal Society)',
  },
  behaviouralShareOfReturns: {
    value: 0.35,
    label: '~35% of returns are behavioural incompatibility',
    source: 'Powell et al. 2021, Scientific Reports',
  },
  householdPetConflictShare: {
    value: 0.18,
    label: '~18% of returns are conflict with existing household pets',
    source: 'Powell et al. 2021, Scientific Reports',
  },
  readoptionRate: {
    value: 0.1,
    label: '~1 in 10 returning owners adopt again',
    source: 'Powell et al. 2022, Scientific Reports',
  },
  behaviouralReturnerPenalty: {
    value: 4,
    label:
      'Behavioural returners 4× less likely to adopt again than medical returners',
    source: 'Powell et al. 2022, Scientific Reports',
  },
} as const;

/** Permanent UI label — PRD §3.4. Rendered wherever the projection appears. */
export const PROJECTION_CAVEAT =
  'Directionally indicative, not a causal estimate. Our constraints do not capture the full behavioural variance the research measured.';

/** Permanent UI label — PRD §3.1. Rendered wherever the cohort appears. */
export const PROVENANCE_LABEL = 'Simulated animals, real applicants.';

/** PRD §3.2. Exact wording. Never "sourced from SAC's dataset". */
export const COHORT_SIZING_NOTE =
  "Sized consistent with Shelter Animals Count's published per-organisation averages.";
