// STEP 1 — FILTER. Eliminate impossible pairs entirely, each with a citation.
// Architecture §6. Elimination is total; a failed pair is never down-ranked.
//
// Every constraint here maps to a documented cause of adoption return and
// carries the citation that is rendered on screen beside it (PRD §3).
//
// STRICTNESS is deliberately banded rather than exact — an adopter may take on
// an animal one difficulty step above their stated experience, but not two.
// Tuning this band is the Day 2 gate: too strict and most of the cohort goes
// unmatched, which reads as failure rather than as a recruitment finding.

import type { Animal, Applicant, Constraint } from './types';

/** An adopter may stretch this far past their stated experience level, no further. */
export const EXPERIENCE_TOLERANCE = 1;

/** Above this energy level, an animal cannot be left alone a full working day. */
export const HIGH_ENERGY_THRESHOLD = 4;

/** Hours away per day beyond which a high-energy animal is under-exercised. */
export const MAX_HOURS_AWAY_HIGH_ENERGY = 8;

/**
 * Every hard constraint, in declaration order.
 *
 * `test` returns TRUE when the pair is viable. A single false eliminates the
 * pair from both preference lists — it is never merely down-ranked.
 */
export const CONSTRAINTS: readonly Constraint[] = [
  {
    id: 'children',
    label: 'Safe with children in the home',
    test: (a: Animal, p: Applicant) => (p.hasChildren ? a.okWithChildren : true),
    preventsReturnCause:
      'Behavioural incompatibility with children — the largest single category of returns.',
    citationKey: 'behaviouralShareOfReturns',
  },
  {
    id: 'otherPets',
    label: 'Safe with the household\u2019s existing pets',
    test: (a: Animal, p: Applicant) => (p.hasOtherPets ? a.okWithOtherPets : true),
    preventsReturnCause:
      'Conflict with an existing household pet — a documented return cause in its own right.',
    citationKey: 'householdPetConflictShare',
  },
  {
    id: 'yard',
    label: 'Outdoor space this animal requires',
    test: (a: Animal, p: Applicant) => (a.needsYard ? p.hasYard : true),
    preventsReturnCause:
      'Unmet exercise need becomes destructive behaviour, and behaviour is what sends animals back.',
    citationKey: 'behaviouralShareOfReturns',
  },
  {
    id: 'quietHome',
    label: 'Quiet household this animal requires',
    test: (a: Animal, p: Applicant) =>
      a.needsQuietHome ? !p.hasChildren && !p.hasOtherPets : true,
    preventsReturnCause:
      'A noise-reactive animal in a busy home escalates rather than settles.',
    citationKey: 'behaviouralShareOfReturns',
  },
  {
    id: 'medication',
    label: 'Daily medication the adopter can administer',
    test: (a: Animal, p: Applicant) => (a.dailyMedication ? p.canDoDailyMeds : true),
    preventsReturnCause:
      'An unmet daily care requirement is a return the shelter can foresee at intake.',
    citationKey: 'dogReturnRate',
  },
  {
    id: 'size',
    label: 'Within the size the household can accommodate',
    test: (a: Animal, p: Applicant) => a.sizeKg <= p.maxSizeKg,
    preventsReturnCause:
      'A stated size limit is a housing limit, not a preference — exceeding it forces a return.',
    citationKey: 'dogReturnRate',
  },
  {
    id: 'experience',
    label: 'Behavioural difficulty within the adopter\u2019s experience',
    test: (a: Animal, p: Applicant) =>
      a.behaviouralDifficulty <= p.experience + EXPERIENCE_TOLERANCE,
    preventsReturnCause:
      'Behavioural difficulty beyond an adopter\u2019s experience is the mechanism the research names directly.',
    citationKey: 'behaviouralShareOfReturns',
  },
  {
    id: 'aloneTime',
    label: 'Hours alone this animal can tolerate',
    test: (a: Animal, p: Applicant) =>
      a.energy >= HIGH_ENERGY_THRESHOLD
        ? p.hoursAwayPerDay <= MAX_HOURS_AWAY_HIGH_ENERGY
        : true,
    preventsReturnCause:
      'A high-energy animal alone for a full working day develops the behaviours that precede a return.',
    citationKey: 'behaviouralShareOfReturns',
  },
];

export interface ConstraintFailure {
  constraintId: string;
  label: string;
  preventsReturnCause: string;
  citationKey: Constraint['citationKey'];
}

/** Evaluate every constraint for one pair. Empty result = pair is viable. */
export function evaluatePair(a: Animal, p: Applicant): ConstraintFailure[] {
  const failures: ConstraintFailure[] = [];
  for (const c of CONSTRAINTS) {
    if (!c.test(a, p)) {
      failures.push({
        constraintId: c.id,
        label: c.label,
        preventsReturnCause: c.preventsReturnCause,
        citationKey: c.citationKey,
      });
    }
  }
  return failures;
}

/** True when no constraint eliminates the pair. */
export function isViable(a: Animal, p: Applicant): boolean {
  return CONSTRAINTS.every((c) => c.test(a, p));
}

/** Labels of every constraint the pair satisfies — feeds the assignment rationale. */
export function satisfiedLabels(a: Animal, p: Applicant): string[] {
  return CONSTRAINTS.filter((c) => c.test(a, p)).map((c) => c.label);
}
