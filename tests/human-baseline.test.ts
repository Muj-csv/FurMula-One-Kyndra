// Guards the human-baseline seam — PRD P1-2, research/human-baseline-protocol.md.
//
// Three distinct failures live here, and they fail in different directions.
//
// ─── FAILURE 1: the panel shows a number nobody measured ───────────────────
//
// `humanBaseline.ts` ships `recorded: false` with null results specifically so
// that an unrun study cannot render as "five people made 0 violations". That
// rule is only worth anything if it is enforced somewhere testable, so the
// gate lives in `baselineStatus()` and is checked below — including the case
// nobody thinks about, where someone flips `recorded: true` at 1am without
// pasting a result in.
//
// ─── FAILURE 2: the number is real but describes a cohort that is gone ─────
//
// The study measures people placing whatever board was live when they sat
// down. `cohort.ts` changed on 8 Sept, so a session run on the 7th scores a
// board that no longer exists. A stale result looks exactly like a fresh one,
// which is why the cohort fingerprint exists and why it is checked here.
//
// ─── FAILURE 3: the study runs and the result will not go in ───────────────
//
// Five people give up an evening, the sessions are scored, and then
// `csv-to-baseline.mjs` emits an object shaped differently from what the panel
// reads — so the number cannot be published without hand-editing under time
// pressure. The last block reads the converter's own output template out of
// its source, so the two sides of that seam cannot drift apart silently.

import { describe, it, expect } from 'vitest';
import converterSource from '../scripts/csv-to-baseline.mjs?raw';
import {
  baselineComparison,
  baselineStatus,
  HUMAN_BASELINE,
} from '../src/data/humanBaseline';
import type { HumanBaselineRecord } from '../src/data/humanBaseline';
import { cohortFingerprint } from '../src/data/cohortFingerprint';
import { COHORT } from '../src/data/cohort';

/** A record as it would look after a real study on the current cohort. */
const recorded: HumanBaselineRecord = {
  recorded: true,
  participants: 5,
  method: 'Same cohort, 2-minute timer, first-come-first-served placement',
  meanViolations: 2.6,
  range: [1, 4],
  caveat: 'Informal exercise with 5 participants, not a controlled study.',
  cohortFingerprint: cohortFingerprint(COHORT),
};

// ─── The number the study runner needs ─────────────────────────────────────

describe('cohort fingerprint', () => {
  it('prints the current fingerprint for whoever is about to run the study', () => {
    const fingerprint = cohortFingerprint(COHORT);
    console.log(
      `\nCOHORT FINGERPRINT — ${fingerprint}\n` +
        `  ${COHORT.animals.length} animals, ${COHORT.applicants.length} households.\n` +
        `  Pass this to the converter when you publish the study:\n` +
        `    node scripts/csv-to-baseline.mjs sessions.csv ${fingerprint}\n`,
    );
    expect(fingerprint).toMatch(/^[0-9a-f]{8}$/);
  });

  it('ignores fields a participant is never shown', () => {
    // The protocol gives participants household FACTS and not stated
    // preferences, so changing a preference cannot change anyone's pairing or
    // its violation count. Removing p21's named request on 8 Sept must not
    // invalidate a study; changing Bruno's size must.
    const before = cohortFingerprint(COHORT);

    const preferencesChanged = {
      animals: COHORT.animals,
      applicants: COHORT.applicants.map((p) => ({
        ...p,
        specificAnimalId: null,
        prefersSpecies: null,
        prefersAge: null,
        prefersEnergy: null,
      })),
    };
    expect(cohortFingerprint(preferencesChanged)).toBe(before);
  });

  it('changes when anything that decides a placement changes', () => {
    const before = cohortFingerprint(COHORT);

    const sizeChanged = {
      animals: COHORT.animals.map((a) => (a.id === 'bruno' ? { ...a, sizeKg: 32 } : a)),
      applicants: COHORT.applicants,
    };
    expect(cohortFingerprint(sizeChanged)).not.toBe(before);

    const ceilingChanged = {
      animals: COHORT.animals,
      applicants: COHORT.applicants.map((p) =>
        p.id === 'p14' ? { ...p, maxSizeKg: 45 } : p,
      ),
    };
    expect(cohortFingerprint(ceilingChanged)).not.toBe(before);

    // A household leaving the cohort changes the board people placed.
    const oneFewer = {
      animals: COHORT.animals,
      applicants: COHORT.applicants.slice(0, -1),
    };
    expect(cohortFingerprint(oneFewer)).not.toBe(before);
  });

  it('does not depend on the order the cohort is written in', () => {
    const reversed = {
      animals: [...COHORT.animals].reverse(),
      applicants: [...COHORT.applicants].reverse(),
    };
    expect(cohortFingerprint(reversed)).toBe(cohortFingerprint(COHORT));
  });
});

// ─── The render gate ───────────────────────────────────────────────────────

describe('the panel refuses to render a study it cannot stand behind', () => {
  it('returns null while the study has not been run', () => {
    expect(baselineStatus(COHORT)).toBe('not-run');
    expect(baselineComparison(COHORT, 0, 5)).toBeNull();
  });

  it('still ships unrun, so the check above is live and not vestigial', () => {
    // When the study is recorded this flips — and that is the moment to delete
    // this test, not to loosen it. Until then it documents that the committed
    // state really is "no result", which is what the null-instead-of-zero
    // decision in humanBaseline.ts exists to protect.
    expect(HUMAN_BASELINE.recorded).toBe(false);
    expect(HUMAN_BASELINE.meanViolations).toBeNull();
    expect(HUMAN_BASELINE.cohortFingerprint).toBe('');
  });

  it('returns null when recorded is flipped without a result pasted in', () => {
    const halfEdited: HumanBaselineRecord = { ...recorded, meanViolations: null };
    expect(baselineStatus(COHORT, halfEdited)).toBe('no-result');
    expect(baselineComparison(COHORT, 0, 5, halfEdited)).toBeNull();
  });

  it('returns null when the cohort has changed since the sessions ran', () => {
    // The failure this whole mechanism exists for: a real, correctly recorded
    // number that has quietly stopped describing the board on screen.
    const stale: HumanBaselineRecord = { ...recorded, cohortFingerprint: '00000000' };
    expect(baselineStatus(COHORT, stale)).toBe('stale-cohort');
    expect(baselineComparison(COHORT, 0, 5, stale)).toBeNull();
  });

  it('returns null for a result recorded before fingerprints existed', () => {
    const legacy: HumanBaselineRecord = { ...recorded, cohortFingerprint: '' };
    expect(baselineStatus(COHORT, legacy)).toBe('stale-cohort');
    expect(baselineComparison(COHORT, 0, 5, legacy)).toBeNull();
  });

  it('renders once the result is real and matches the cohort on screen', () => {
    expect(baselineStatus(COHORT, recorded)).toBe('ready');

    const comparison = baselineComparison(COHORT, 0, 5, recorded);
    expect(comparison).not.toBeNull();
    expect(comparison?.meanViolations).toBe(2.6);
    expect(comparison?.range).toEqual([1, 4]);
    expect(comparison?.participants).toBe(5);
    expect(comparison?.kyndraViolations).toBe(0);
    expect(comparison?.greedyViolations).toBe(5);
    // The caveat is not optional — PRD §3.4 makes it a permanent label.
    expect(comparison?.caveat).toMatch(/not a controlled study/);
  });
});

// ─── The converter seam ────────────────────────────────────────────────────
//
// The script's emitted object is read out of the script itself rather than
// duplicated here, the same way tests/survey-capture.test.ts reads its header
// list out of csv-to-applicants.mjs.
//
// This inspects the source rather than executing it on purpose:
// `tsconfig.app.json` typechecks `tests`, and this project has no
// `@types/node`, so a test that spawned the converter would break
// `npm run build` over a dependency the repo has deliberately done without.

describe('scripts/csv-to-baseline.mjs feeds the panel', () => {
  /** The object literal the converter prints for pasting into humanBaseline.ts. */
  function emittedObject(): string {
    const pattern = /export const HUMAN_BASELINE = \{([\s\S]*?)\} as const;/;
    const body = pattern.exec(converterSource)?.[1];
    if (body === undefined) {
      throw new Error('HUMAN_BASELINE template not found in csv-to-baseline.mjs');
    }
    return body;
  }

  it('emits every field the panel reads, and forgets none of them', () => {
    // Keyed off a real record, so adding a field to HumanBaselineRecord without
    // teaching the converter to emit it fails here rather than on Day 4.
    const required = Object.keys({
      recorded: true,
      participants: 5,
      method: '',
      meanViolations: 0,
      range: [0, 0],
      caveat: '',
      cohortFingerprint: '',
    } satisfies HumanBaselineRecord);

    const emitted = emittedObject();
    for (const key of required) {
      expect({ key, emitted: emitted.includes(`${key}:`) }).toEqual({ key, emitted: true });
    }
  });

  it('emits recorded: true, or pasting its output leaves the panel dark', () => {
    expect(emittedObject()).toMatch(/recorded:\s*true/);
  });

  it('interpolates the measured figures rather than hardcoding them', () => {
    // A literal here would publish the template's example numbers as though
    // five people had actually produced them.
    const emitted = emittedObject();
    expect(emitted).toMatch(/meanViolations:\s*\$\{/);
    expect(emitted).toMatch(/range:\s*\[\$\{/);
    expect(emitted).toMatch(/cohortFingerprint:\s*'\$\{/);
  });

  it('refuses to run without a fingerprint argument', () => {
    // Belt and braces on the workflow: the converter must not be able to
    // produce a publishable record that has no cohort attached to it.
    expect(converterSource).toMatch(/fingerprint === undefined/);
    expect(converterSource).toMatch(/\[0-9a-f\]\{8\}/);
  });
});
