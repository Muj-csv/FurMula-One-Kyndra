// STEP 3 — EQUITY. Long-stay tie-breaking weight.
//
// HARD RULE: equity operates only on candidates that already passed STEP 1.
// It can never introduce, reinstate, or advance a pair that failed a
// constraint. Property test #2 enforces this.
//
// ─── WHERE THIS APPLIES, AND WHY IT DIFFERS FROM THE DOC ───────────────────
//
// Architecture §6 STEP 3 places the equity tie-break "within the shelter's
// order". Implemented literally, it cannot do the thing the product needs it
// to do, and the discrepancy is worth stating rather than burying:
//
//   In animal-proposing deferred acceptance, an animal's own preference list
//   determines WHICH APPLICANT it gets, never WHETHER it matches. An animal
//   goes unmatched by exhausting its list, and reordering that list does not
//   change when it is exhausted. So a shelter-side nudge cannot help a
//   long-stay animal match — and "slide the dial, Bruno matches" (PRD §8) is
//   the hero interaction.
//
//   The accepting side decides who wins a contested applicant. So the equity
//   nudge is applied to the applicant's order over animals: where an applicant
//   is close to indifferent between two animals, shelter policy breaks the tie
//   toward the one who has waited longer.
//
// ⚠ TEAM: this is a reasoned deviation from Architecture §6 STEP 3 as written.
// Ratify it or overrule it before the Day 5 verification pass.
//
// ─── THE BAND, AND WHAT "TIES ONLY" HONESTLY MEANS ─────────────────────────
//
// An earlier build made the nudge strictly smaller than 1 want-score point, so
// it could separate only EXACT integer ties. That was stricter than the doc
// intends, and it produced a dial with no observable effect at any setting:
// exact ties existed in the cohort but none were pivotal — a tied pair sat
// below an animal the household wanted more, so reordering the tie changed
// nothing downstream.
//
// Architecture §10 prescribes the fix directly ("widen the tie band if fit
// scores are too separated"), which also settles what §6 meant by a "narrow
// band": a band, not an exact tie.
//
// So: at equityWeight w, an animal can gain at most w × EQUITY_BAND want-score
// points. Two consequences to state accurately and never overstate:
//
//   ✓ Equity can never advance a pair that failed a hard constraint. It only
//     permutes lists STEP 1 already filtered. Property test 2 proves this, and
//     this is the guardrail to state out loud in the demo.
//
//   ✗ Equity CAN reorder two animals separated by up to w × EQUITY_BAND points
//     of want. It is a bounded band, not an exact-tie-only rule. Do not claim
//     otherwise on stage — say "within a band the dial controls, never across
//     a hard constraint."
//
// A stated specific animal scores SPECIFIC_ANIMAL_SCORE (1,000,000), which no
// band can bridge. A real human choice stays untouchable at every setting.

import type { Animal } from './types';

/**
 * Width of the indifference band, in want-score points, at equityWeight 1.
 *
 * Chosen by measurement, not by feel. Sweeping the width against the demo
 * cohort and counting how many of the five dial settings produce a distinct
 * board:
 *
 *     band  0 -> 1 of 5 distinct,  0 placements move   (the dial does nothing)
 *     band  6 -> 2 of 5 distinct,  3 placements move
 *     band 12 -> 3 of 5 distinct,  4 placements move
 *     band 18 -> 4 of 5 distinct,  8 placements move   <- chosen
 *     band 25 -> 5 of 5 distinct,  8 placements move
 *     band 40 -> 4 of 5 distinct,  8 placements move
 *
 * Want scores run roughly 0–100 here, so 18 lets waiting time outweigh a
 * moderate preference gap but never a decisive one. 25 makes every notch
 * distinct, at the cost of inviting the fair objection that the dial simply
 * overrides what households asked for. Retune here, not at the call sites,
 * and re-run the sweep if the cohort changes.
 */
export const EQUITY_BAND = 18;

/** Days in shelter at which an animal receives the full waiting-time share. */
export const EQUITY_DAYS_CAP = 365;

/** Share of the nudge driven by waiting time; the remainder by special needs. */
export const EQUITY_DAYS_SHARE = 0.8;

/**
 * This animal's equity standing, in [0, 1].
 *
 * Longer waits and special needs score higher. Deterministic, and a pure
 * function of the animal alone.
 */
export function equityFraction(animal: Animal): number {
  const days = Math.min(Math.max(animal.daysInShelter, 0) / EQUITY_DAYS_CAP, 1);
  const specialNeed = animal.specialNeeds.length > 0 ? 1 : 0;
  return EQUITY_DAYS_SHARE * days + (1 - EQUITY_DAYS_SHARE) * specialNeed;
}

/**
 * Want-score points this animal gains at the given dial setting.
 * Zero at equityWeight 0 — the dial's floor is a pure want order.
 */
export function equityBoost(animal: Animal, equityWeight: number): number {
  return equityWeight * EQUITY_BAND * equityFraction(animal);
}

/**
 * Reorder a list of animal ids within the band.
 *
 * Exposed for inspection and testing; the pipeline applies the same boost
 * inside deriveApplicantOrder so that the order GS consumes and the order
 * stability is verified against are the same list.
 */
export function applyEquityTiebreak(
  animalsById: Map<string, Animal>,
  order: string[],
  scoreOf: (animalId: string) => number,
  equityWeight: number,
): string[] {
  return [...order]
    .map((id) => {
      const animal = animalsById.get(id);
      const boost = animal ? equityBoost(animal, equityWeight) : 0;
      return { id, score: scoreOf(id) + boost };
    })
    .sort((x, y) => y.score - x.score || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))
    .map((entry) => entry.id);
}
