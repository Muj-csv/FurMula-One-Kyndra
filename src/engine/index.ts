// The ONLY public surface of the engine — kyndra-architecture-final.md §3.
//
// Nothing outside `src/engine/` may import an engine internal. The UI calls
// runMatch() and reads the MatchResult; that is the whole contract.
//
// Pipeline (Architecture §6):
//   1 FILTER → 2 DERIVE → 3 EQUITY → 4 MATCH → 5 VERIFY → 6 EXPLAIN
//   → 7 MEASURE → 8 MODEL

import type {
  Animal,
  Applicant,
  Assignment,
  Cohort,
  MatchOptions,
  MatchResult,
  UnmatchedAnimal,
} from './types';
import { evaluatePair, satisfiedLabels } from './constraints';
import { deriveApplicantOrder, deriveShelterOrder } from './derive';
import { deferredAcceptance, type Matching } from './deferred';
import { findBlockingPairs, evaluateSwap, type SwapVerdict } from './stability';
import { computeRegret } from './regret';
import { buildRationale, buildCounterfactual, buildRecruitmentProfile } from './explain';
import { equityBoost } from './equity';
import { greedy, type GreedyResult } from './greedy';
import { computeImpact, type ImpactModel } from './impact';

export type {
  Animal,
  Applicant,
  Cohort,
  Constraint,
  Assignment,
  UnmatchedAnimal,
  MatchResult,
  MatchOptions,
} from './types';
export type { Matching } from './deferred';
export type { SwapVerdict } from './stability';
export type { GreedyResult } from './greedy';
export type { ImpactModel } from './impact';
export { CONSTRAINTS, evaluatePair, isViable } from './constraints';
export { greedy } from './greedy';
export { computeImpact, ASSUMPTION_CONSERVATIVE, ASSUMPTION_OPTIMISTIC } from './impact';
export { randomCohort, randomWeight } from './random';
export { equityFraction, equityBoost, EQUITY_BAND } from './equity';

/** What the filter produced, kept so later steps never re-derive it. */
interface Viability {
  /** animalId → applicant ids that survived every constraint. */
  viableApplicants: Map<string, string[]>;
  /** applicantId → animal ids that survived every constraint. */
  viableAnimals: Map<string, string[]>;
  /** animalId → the first constraint each eliminated applicant failed. */
  blockedBy: Map<string, { applicantId: string; failedConstraint: string }[]>;
}

// ─── STEP 1 ────────────────────────────────────────────────────────────────

function filter(cohort: Cohort): Viability {
  const viableApplicants = new Map<string, string[]>();
  const viableAnimals = new Map<string, string[]>();
  const blockedBy = new Map<string, { applicantId: string; failedConstraint: string }[]>();

  for (const animal of cohort.animals) {
    viableApplicants.set(animal.id, []);
    blockedBy.set(animal.id, []);
  }
  for (const applicant of cohort.applicants) {
    viableAnimals.set(applicant.id, []);
  }

  for (const animal of cohort.animals) {
    for (const applicant of cohort.applicants) {
      const failures = evaluatePair(animal, applicant);
      if (failures.length === 0) {
        viableApplicants.get(animal.id)?.push(applicant.id);
        viableAnimals.get(applicant.id)?.push(animal.id);
      } else {
        // First failure in declaration order — one reason, not a wall of them.
        const first = failures[0];
        if (first !== undefined) {
          blockedBy.get(animal.id)?.push({
            applicantId: applicant.id,
            failedConstraint: first.label,
          });
        }
      }
    }
  }

  return { viableApplicants, viableAnimals, blockedBy };
}

// ─── STEPS 2 & 3 ───────────────────────────────────────────────────────────

interface Preferences {
  animalPreferences: Map<string, string[]>;
  applicantPreferences: Map<string, string[]>;
}

function derive(cohort: Cohort, viability: Viability, equityWeight: number): Preferences {
  const animalsById = new Map(cohort.animals.map((animal) => [animal.id, animal]));
  const applicantsById = new Map(cohort.applicants.map((applicant) => [applicant.id, applicant]));

  const animalPreferences = new Map<string, string[]>();
  const applicantPreferences = new Map<string, string[]>();

  for (const animal of cohort.animals) {
    const candidates = (viability.viableApplicants.get(animal.id) ?? [])
      .map((id) => applicantsById.get(id))
      .filter((candidate): candidate is Applicant => candidate !== undefined);
    animalPreferences.set(animal.id, deriveShelterOrder(animal, candidates));
  }

  for (const applicant of cohort.applicants) {
    const candidates = (viability.viableAnimals.get(applicant.id) ?? [])
      .map((id) => animalsById.get(id))
      .filter((candidate): candidate is Animal => candidate !== undefined);
    applicantPreferences.set(
      applicant.id,
      deriveApplicantOrder(applicant, candidates, equityWeight),
    );
  }

  return { animalPreferences, applicantPreferences };
}

/** Steps 1–4 only. Used by the counterfactual, which must not recurse. */
function matchOnly(cohort: Cohort, equityWeight: number): Matching {
  const viability = filter(cohort);
  const { animalPreferences, applicantPreferences } = derive(cohort, viability, equityWeight);
  return deferredAcceptance(animalPreferences, applicantPreferences);
}

const byId = (x: { animalId: string }, y: { animalId: string }): number =>
  x.animalId < y.animalId ? -1 : x.animalId > y.animalId ? 1 : 0;

// ─── The public surface ────────────────────────────────────────────────────

/**
 * Run the full matching pipeline over a cohort.
 *
 * Deterministic: with the ascending-id tiebreak both preference orders are
 * strict, and the proposer-optimal stable matching is unique, so the result
 * does not depend on the order animals or applicants appear in the input.
 */
export function runMatch(cohort: Cohort, options: MatchOptions): MatchResult {
  const equityWeight = Math.min(1, Math.max(0, options.equityWeight));

  const animalsById = new Map(cohort.animals.map((animal) => [animal.id, animal]));
  const applicantsById = new Map(cohort.applicants.map((applicant) => [applicant.id, applicant]));

  // STEP 1
  const viability = filter(cohort);

  // STEPS 2 & 3
  const { animalPreferences, applicantPreferences } = derive(cohort, viability, equityWeight);

  // STEP 4
  const matching = deferredAcceptance(animalPreferences, applicantPreferences);

  // STEP 5
  const blockingPairs = findBlockingPairs(matching, animalPreferences, applicantPreferences);

  // STEP 6
  const assignments: Assignment[] = [];
  for (const [animalId, applicantId] of matching) {
    const animal = animalsById.get(animalId);
    const applicant = applicantsById.get(applicantId);
    if (animal === undefined || applicant === undefined) continue;

    const animalOrder = animalPreferences.get(animalId) ?? [];
    const applicantOrder = applicantPreferences.get(applicantId) ?? [];

    assignments.push({
      animalId,
      applicantId,
      constraintsSatisfied: satisfiedLabels(animal, applicant),
      applicantRankOfAnimal: applicantOrder.indexOf(animalId) + 1,
      shelterRankOfApplicant: animalOrder.indexOf(applicantId) + 1,
      equityBoostApplied: equityBoost(animal, equityWeight),
      rationale: buildRationale(animal, applicant),
      counterfactual: buildCounterfactual(cohort, animalId, applicantId, (reduced) =>
        matchOnly(reduced, equityWeight),
      ),
    });
  }
  assignments.sort(byId);

  const unmatchedAnimals: UnmatchedAnimal[] = cohort.animals
    .filter((animal) => !matching.has(animal.id))
    .map((animal) => ({
      animalId: animal.id,
      blockedBy: viability.blockedBy.get(animal.id) ?? [],
      recruitmentProfile: buildRecruitmentProfile(animal),
    }));

  const matchedApplicants = new Set(matching.values());
  const unmatchedApplicants = cohort.applicants
    .filter((applicant) => !matchedApplicants.has(applicant.id))
    .map((applicant) => {
      const viable = viability.viableAnimals.get(applicant.id) ?? [];
      const plural = viable.length === 1 ? '' : 's';
      return {
        id: applicant.id,
        reason:
          viable.length === 0
            ? `No animal in this cohort clears every hard constraint for this household.`
            : `Viable for ${viable.length} animal${plural}, but each was placed with a household that meets its needs better.`,
      };
    });

  // STEP 7
  const regret = computeRegret(matching, animalPreferences, applicantPreferences);

  return {
    assignments,
    unmatchedAnimals,
    unmatchedApplicants,
    isStable: blockingPairs.length === 0,
    blockingPairs,
    equityWeight,
    regret,
  };
}

/**
 * Evaluate a proposed reshuffle against a fresh run of the cohort.
 *
 * Same evaluator as STEP 5 — a proposed swap is a candidate blocking pair.
 */
export function attemptSwap(
  cohort: Cohort,
  options: MatchOptions,
  animalId: string,
  applicantId: string,
): SwapVerdict {
  const equityWeight = Math.min(1, Math.max(0, options.equityWeight));
  const viability = filter(cohort);
  const { animalPreferences, applicantPreferences } = derive(cohort, viability, equityWeight);
  const matching = deferredAcceptance(animalPreferences, applicantPreferences);

  const names = new Map<string, string>();
  for (const animal of cohort.animals) names.set(animal.id, animal.name);
  for (const applicant of cohort.applicants) names.set(applicant.id, applicant.name);

  return evaluateSwap(
    matching,
    animalPreferences,
    applicantPreferences,
    animalId,
    applicantId,
    (id) => names.get(id) ?? id,
  );
}

/** Hard-constraint violations in a matching. Zero for any runMatch result. */
export function countViolations(cohort: Cohort, matching: Matching): number {
  const animalsById = new Map(cohort.animals.map((animal) => [animal.id, animal]));
  const applicantsById = new Map(cohort.applicants.map((applicant) => [applicant.id, applicant]));

  let violations = 0;
  for (const [animalId, applicantId] of matching) {
    const animal = animalsById.get(animalId);
    const applicant = applicantsById.get(applicantId);
    if (animal === undefined || applicant === undefined) continue;
    if (evaluatePair(animal, applicant).length > 0) violations += 1;
  }
  return violations;
}

/** The greedy baseline and the stable result over one cohort, with the model. */
export function compare(
  cohort: Cohort,
  options: MatchOptions,
): { greedy: GreedyResult; stable: MatchResult; impact: ImpactModel } {
  const baseline = greedy(cohort);
  const stable = runMatch(cohort, options);
  const stableMatching: Matching = new Map(
    stable.assignments.map((assignment) => [assignment.animalId, assignment.applicantId]),
  );

  return {
    greedy: baseline,
    stable,
    impact: computeImpact(
      cohort,
      baseline.constraintViolations,
      countViolations(cohort, stableMatching),
      options.assumptionLevel,
    ),
  };
}
