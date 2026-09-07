#!/usr/bin/env node
// Converts scored human-baseline sessions (CSV) into a pasteable
// HUMAN_BASELINE object — Architecture §7, PRD §5, research/human-baseline-protocol.md.
//
// This does not touch humanBaseline.ts. Score each participant's pairing
// against the engine's own evaluatePair first (protocol doc has the
// snippet), put their violation count in the CSV, then run this to get the
// mean/range formatted correctly.
//
// Usage:
//   node scripts/csv-to-baseline.mjs path/to/sessions.csv <cohort-fingerprint>
//
// Expected header row (see research/templates/baseline-scoring-template.csv):
//   participant,violations
//
// THE FINGERPRINT IS REQUIRED, and it is the fingerprint of the cohort the
// participants actually placed — print it before you run the sessions with:
//
//   npx vitest run tests/human-baseline.test.ts
//
// It is what lets the app notice that the cohort has changed underneath a
// recorded result and go quiet instead of publishing a stale claim. See
// src/data/cohortFingerprint.ts. This script cannot compute it for you: it is
// dependency-free plain JS and the cohort lives in TypeScript.

import { readFileSync } from 'node:fs';

function fail(message) {
  console.error(`csv-to-baseline: ${message}`);
  process.exit(1);
}

function parseCsv(text) {
  return text
    .split(/\r\n|\n|\r/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

function main() {
  const csvPath = process.argv[2];
  const fingerprint = process.argv[3];
  if (csvPath === undefined) {
    fail('usage: node scripts/csv-to-baseline.mjs path/to/sessions.csv <cohort-fingerprint>');
  }
  if (fingerprint === undefined) {
    fail(
      'missing <cohort-fingerprint>. Print the current one with "npx vitest run ' +
        'tests/human-baseline.test.ts". It records which cohort these sessions were ' +
        'run against, so a later edit to cohort.ts cannot leave a stale result on screen.',
    );
  }
  if (!/^[0-9a-f]{8}$/.test(fingerprint)) {
    fail(`<cohort-fingerprint> is "${fingerprint}" — expected 8 lowercase hex characters.`);
  }

  const rows = parseCsv(readFileSync(csvPath, 'utf8'));
  if (rows.length < 2) fail('CSV has no data rows.');

  const header = rows[0];
  const violationsIdx = header.indexOf('violations');
  const participantIdx = header.indexOf('participant');
  if (violationsIdx === -1) fail('missing required column "violations".');
  if (participantIdx === -1) fail('missing required column "participant".');

  const violations = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNumber = r + 1;
    const raw = row[violationsIdx];
    const n = Number.parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) {
      fail(`row ${rowNumber}: column "violations" is "${raw}" — expected a non-negative integer.`);
    }
    violations.push(n);
  }

  if (violations.length === 0) fail('no participant rows found.');

  const mean = violations.reduce((a, b) => a + b, 0) / violations.length;
  const min = Math.min(...violations);
  const max = Math.max(...violations);

  const object = `export const HUMAN_BASELINE = {
  recorded: true,
  participants: ${violations.length},
  method: 'Same cohort, 2-minute timer, first-come-first-served placement',
  meanViolations: ${Number(mean.toFixed(2))},
  range: [${min}, ${max}] as [number, number],
  caveat: 'Informal exercise with ${violations.length} participants, not a controlled study.',
  cohortFingerprint: '${fingerprint}',
} as const;`;

  console.log(`// Recorded from ${violations.length} real session(s): [${violations.join(', ')}] violations.`);
  console.log(`// Cohort fingerprint ${fingerprint} — re-run the study if this stops matching.`);
  console.log('// Paste this over the existing HUMAN_BASELINE export in src/data/humanBaseline.ts.');
  console.log(object);
}

main();
