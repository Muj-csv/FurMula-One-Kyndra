// Recorded results of the manual-placement study — Architecture §7, PRD §5.
//
// PHASE 0: NOT YET RUN. The study is a Day 3–4 deliverable.
//
// The result fields are `null` on purpose. Architecture §7 sketches them as
// zeroes with a "fill in after running it" comment, but a literal 0 renders as
// "five people made zero violations" — a plausible fake result, which Phase 0
// explicitly forbids. `null` cannot be mistaken for a finding, and the UI must
// refuse to render this panel until `recorded` is true.
//
// ─── HOW TO FILL THIS IN ───────────────────────────────────────────────────
//
//   1. Run the study: research/human-baseline-protocol.md.
//   2. Score each session with the engine's own evaluatePair (snippet in the
//      protocol) — never by eye, or the comparison is not like-for-like.
//   3. node scripts/csv-to-baseline.mjs sessions.csv
//   4. Paste its output over the HUMAN_BASELINE export below, verbatim.
//
// The panel appears on its own the moment `recorded` is true. Nothing else
// needs changing.
//
// ⚠ THE STUDY IS COHORT-SPECIFIC. Participants place the cohort that is live
// when they sit down. `src/data/cohort.ts` changed on 8 Sept (Bruno's size,
// p14's size ceiling, p21's named request), so any session run before that
// date is scoring a board that no longer exists and must be re-run. If you
// edit the cohort again after recording, this number goes stale and the honest
// move is to set `recorded: false` until you re-run it.

import type { Cohort } from '../engine';
import { cohortFingerprint } from './cohortFingerprint';

export const HUMAN_BASELINE = {
  recorded: false,
  participants: 5,
  method: 'Same cohort, 2-minute timer, first-come-first-served placement',
  meanViolations: null as number | null,
  range: null as [number, number] | null,
  caveat: 'Informal exercise with 5 participants, not a controlled study.',
  // The cohort the sessions were actually run against. Empty until recorded;
  // see cohortFingerprint.ts for why a result without one cannot be trusted.
  cohortFingerprint: '',
} as const;

/**
 * The shape `scripts/csv-to-baseline.mjs` emits.
 *
 * Declared structurally, and deliberately NOT used to annotate HUMAN_BASELINE
 * above — the script's output is meant to be pasted over that export verbatim,
 * so the export must stay a bare object literal.
 */
export interface HumanBaselineRecord {
  recorded: boolean;
  participants: number;
  method: string;
  meanViolations: number | null;
  range: readonly [number, number] | null;
  caveat: string;
  /** Fingerprint of the cohort these sessions were measured against. */
  cohortFingerprint: string;
}

/** What the panel renders. Only ever built from a study that actually ran. */
export interface BaselineComparison {
  participants: number;
  method: string;
  meanViolations: number;
  range: readonly [number, number] | null;
  caveat: string;
  /** Hard-constraint violations in Kyndra's assignment. Expected: 0. */
  kyndraViolations: number;
  /** Violations from the simulated first-come-first-served baseline. */
  greedyViolations: number;
}

/** Why the panel is dark, when it is. Useful to a teammate, never to a judge. */
export type BaselineStatus = 'not-run' | 'no-result' | 'stale-cohort' | 'ready';

/**
 * Why `baselineComparison` returned what it returned.
 *
 * Split out so a teammate can tell "we never ran it" from "we ran it and then
 * changed the cohort underneath it" — two very different problems with the
 * same blank space on screen. Nothing renders this to a judge.
 */
export function baselineStatus(
  cohort: Cohort,
  record: HumanBaselineRecord = HUMAN_BASELINE,
): BaselineStatus {
  if (!record.recorded) return 'not-run';
  if (record.meanViolations === null) return 'no-result';
  if (
    record.cohortFingerprint === '' ||
    record.cohortFingerprint !== cohortFingerprint(cohort)
  ) {
    return 'stale-cohort';
  }
  return 'ready';
}

/**
 * The panel's data, or `null` when there is no study we can honestly report.
 *
 * This is the "refuse to render" rule, in one tested place rather than in a
 * component's JSX. It returns null on THREE conditions:
 *
 *   - the study has not been run;
 *   - `recorded` was flipped true without a result being pasted in — which
 *     would otherwise render "five people averaged null violations", precisely
 *     the failure the null-instead-of-zero decision above exists to prevent,
 *     and exactly the kind of edit made at 1am the night before a demo;
 *   - the cohort has changed since the sessions were run, so "five people
 *     placed THIS cohort" is no longer a true sentence.
 *
 * The third is the one that fails silently without help. A stale number looks
 * exactly like a fresh one.
 */
export function baselineComparison(
  cohort: Cohort,
  kyndraViolations: number,
  greedyViolations: number,
  record: HumanBaselineRecord = HUMAN_BASELINE,
): BaselineComparison | null {
  if (baselineStatus(cohort, record) !== 'ready') return null;
  if (record.meanViolations === null) return null; // narrowing; unreachable above

  return {
    participants: record.participants,
    method: record.method,
    meanViolations: record.meanViolations,
    range: record.range,
    caveat: record.caveat,
    kyndraViolations,
    greedyViolations,
  };
}
