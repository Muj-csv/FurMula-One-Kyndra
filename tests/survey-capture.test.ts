// Not an engine test — this guards the seam between the deployed intake form
// and scripts/csv-to-applicants.mjs (PRD P1-1).
//
// The failure this exists to prevent: twenty real households submit through
// the live app, the export comes back on Day 4, and the converter rejects it
// because a field was renamed on one side of the seam and not the other. By
// then the responses are collected and the people have moved on.
//
// So the header list is read out of the converter itself rather than
// duplicated here. Change either side without the other and this fails.

import { describe, it, expect } from 'vitest';
import converterSource from '../scripts/csv-to-applicants.mjs?raw';
import {
  buildSurveyPayload,
  isSurveyCaptureEnabled,
  SURVEY_VERSION,
} from '../src/data/surveyCapture';
import { APPLICANTS } from '../src/data/cohort';

function converterHeaders(): string[] {
  const body = /const REQUIRED_HEADERS = \[([\s\S]*?)\];/.exec(converterSource)?.[1];
  if (body === undefined) throw new Error('REQUIRED_HEADERS not found in csv-to-applicants.mjs');
  return [...body.matchAll(/'([^']+)'/g)]
    .map((match) => match[1])
    .filter((header): header is string => header !== undefined);
}

const sample = APPLICANTS[0];
if (sample === undefined) throw new Error('cohort has no applicants to shape a payload from');

describe('survey capture and the CSV converter agree', () => {
  const payload = buildSurveyPayload(sample);

  it('sends every column the converter requires, in the same order', () => {
    const required = converterHeaders();
    expect(required.length).toBeGreaterThan(0);
    expect(Object.keys(payload).slice(0, required.length)).toEqual(required);
  });

  it('never sends id or surveyed — the converter owns both', () => {
    expect(Object.keys(payload)).not.toContain('id');
    expect(Object.keys(payload)).not.toContain('surveyed');
  });

  it('encodes booleans as yes/no and absent preferences as blank', () => {
    const noPreferences = buildSurveyPayload({
      ...sample,
      hasYard: true,
      hasChildren: false,
      specificAnimalId: null,
      prefersSpecies: null,
      prefersAge: null,
      prefersEnergy: null,
    });
    expect(noPreferences.hasYard).toBe('yes');
    expect(noPreferences.hasChildren).toBe('no');
    expect(noPreferences.specificAnimalId).toBe('');
    expect(noPreferences.prefersSpecies).toBe('');
    expect(noPreferences.prefersAge).toBe('');
    expect(noPreferences.prefersEnergy).toBe('');
  });

  it('is enabled now that SURVEY_ENDPOINT points at a real collector', () => {
    // This flipped from false to true the moment a real Apps Script URL was
    // set in src/data/surveyCapture.ts — updating this expectation IS the
    // deliberate act of turning capture on for real submissions.
    expect(isSurveyCaptureEnabled()).toBe(true);
  });

  it('carries integrity metadata after the required columns, never inside them', () => {
    const required = converterHeaders();
    // submittedAt is the one existing extra column (also ignored by the
    // converter); the new metadata is appended after it, not interleaved —
    // the seam test above only checks the first N keys, so this pins the
    // rest of the same contract.
    expect(Object.keys(payload).slice(required.length)).toEqual([
      'submittedAt',
      'responseId',
      'surveyVersion',
      'consent',
    ]);
  });

  it('generates a distinct response id per submission, without identifying the respondent', () => {
    const a = buildSurveyPayload(sample);
    const b = buildSurveyPayload(sample);
    expect(a.responseId).not.toBe(b.responseId);
    expect(a.responseId.length).toBeGreaterThan(0);
    expect(a.responseId).not.toContain(sample.name);
  });

  it('tags every submission with the current survey version', () => {
    expect(payload.surveyVersion).toBe(SURVEY_VERSION);
  });

  it('never flattens a named animal claim into a general preference', () => {
    const named = buildSurveyPayload({ ...sample, specificAnimalId: 'bruno', prefersSpecies: 'cat' });
    // Both signals travel independently — a claim on Bruno does not overwrite
    // or get overwritten by an unrelated stated species preference.
    expect(named.specificAnimalId).toBe('bruno');
    expect(named.prefersSpecies).toBe('cat');
  });

  it('records consent on the row itself, since this is only ever built after opt-in', () => {
    expect(payload.consent).toBe('yes');
  });
});
