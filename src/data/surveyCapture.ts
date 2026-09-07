// Survey capture — P1-1. One-directional: the deployed app can SEND a real
// household to the team. Nothing ever comes back.
//
// ─── WHY THIS IS NOT A DATABASE ────────────────────────────────────────────
//
// The cohort judges see is the committed array in cohort.ts, and it has to
// stay that way. The property tests prove things about THAT cohort; a cohort
// mutated at runtime by whoever opened the URL is untested by construction,
// and the board rehearsed on Thursday would not be the board presented on
// Saturday. A visitor adding a household is a demo feature — it belongs in
// React state and nowhere else.
//
// So submissions flow one way only, and the loop closes at DEPLOY time:
//
//   deployed intake form → POST → form service → CSV export
//     → scripts/csv-to-applicants.mjs → reviewed by hand → committed
//
// Vercel still serves a pure static build. No serverless function, no
// database, no secret. Architecture §9 — "Env vars: none. Functions: none."
// — survives intact, and a survey-path outage cannot touch the demo.
//
// ─── LAYOUT NOTE ───────────────────────────────────────────────────────────
//
// Architecture §3 is authoritative and does not list this file. It sits in
// src/data/ because it is part of the applicant-data pipeline that cohort.ts
// terminates. It is deliberately NOT in src/engine/: the engine forbids fetch
// (engine/README.md), and that rule is worth more than tidiness.

import type { Applicant } from '../engine';

/**
 * Where opted-in survey responses are POSTed.
 *
 * ⚠ NOT YET SET. While this is empty the capture is DISABLED and the intake
 * form hides the sharing checkbox entirely — a checkbox that promises to
 * share data and silently drops it would be exactly the kind of claim PRD §3
 * exists to prevent.
 *
 * To switch it on, paste in an endpoint URL and redeploy. THIS PROJECT COSTS
 * NOTHING AND MUST STAY THAT WAY, so the recommended collector is a Google
 * Apps Script web app bound to a Sheet: no signup, no card, no free-tier
 * ceiling, and no vendor who can change their pricing the week of the demo.
 * Hosted form services with genuinely free, no-card tiers (Formspree, Basin,
 * Getform) also work — set SURVEY_TRANSPORT to 'json' for those.
 * research/applicant-survey.md has the step-by-step for both.
 *
 * The URL is public by design: it is a write-only collection address, it goes
 * in the client bundle, and it is not a secret. That is what keeps this a
 * static build with no env vars and nothing to pay for.
 *
 * Typed as `string`, not inferred as `''`, so the enabled-check below is a
 * real runtime test rather than a comparison TypeScript folds away.
 */
export const SURVEY_ENDPOINT: string = '';

/** False until SURVEY_ENDPOINT is set. Gates every piece of sharing UI. */
export function isSurveyCaptureEnabled(): boolean {
  return SURVEY_ENDPOINT.trim() !== '';
}

export type ShareStatus = 'idle' | 'sharing' | 'shared' | 'sent' | 'failed';

/**
 * How the POST is made. This is a cost decision as much as a technical one.
 *
 *   'json'   — the endpoint returns CORS headers, so the browser can read the
 *              response and we can honestly say whether it arrived.
 *              Formspree / Basin / Getform all behave this way.
 *
 *   'beacon' — the endpoint does not return CORS headers, so the request goes
 *              out with mode 'no-cors' and comes back OPAQUE. It still lands;
 *              we simply cannot read the result. A Google Apps Script web app
 *              bound to a Sheet is this case, and it is the only route that
 *              cannot ever be paywalled, because there is no vendor in it.
 *
 * The distinction is not cosmetic: in 'beacon' mode the best we may truthfully
 * tell a respondent is "sent", never "received". Whoever runs the survey
 * confirms receipt by watching the Sheet fill up, not by trusting this UI.
 */
export type CaptureTransport = 'json' | 'beacon';

/** Match this to whatever SURVEY_ENDPOINT points at. */
export const SURVEY_TRANSPORT: CaptureTransport = 'beacon';

/**
 * One response, shaped for the CSV the converter already reads.
 *
 * ⚠ KEYS AND ORDER MUST MATCH `REQUIRED_HEADERS` in
 * scripts/csv-to-applicants.mjs. A form service exports one column per key,
 * so if these line up the export feeds the converter with no editing at all.
 * tests/survey-capture.test.ts reads that script and fails if they drift.
 *
 * Booleans go as yes/no and absent preferences as blank, because that is what
 * the converter's toBool() and toNullableEnum() accept.
 *
 * `id` and `surveyed` are deliberately absent: the converter assigns ids after
 * whatever is already in cohort.ts, and bakes in `surveyed: true` because
 * every row it reads is a real response. Sending them from here would invite
 * exactly the backfilled flag that cohort.ts warns against.
 */
export interface SurveyPayload {
  name: string;
  specificAnimalId: string;
  homeType: 'apartment' | 'house';
  hasYard: string;
  hoursAwayPerDay: number;
  hasChildren: string;
  hasOtherPets: string;
  experience: number;
  canDoDailyMeds: string;
  maxSizeKg: number;
  prefersSpecies: string;
  prefersAge: string;
  prefersEnergy: number | string;
  /** Extra column — the converter ignores headers it does not require. */
  submittedAt: string;
}

const yesNo = (value: boolean): string => (value ? 'yes' : 'no');

export function buildSurveyPayload(applicant: Applicant): SurveyPayload {
  return {
    name: applicant.name,
    specificAnimalId: applicant.specificAnimalId ?? '',
    homeType: applicant.homeType,
    hasYard: yesNo(applicant.hasYard),
    hoursAwayPerDay: applicant.hoursAwayPerDay,
    hasChildren: yesNo(applicant.hasChildren),
    hasOtherPets: yesNo(applicant.hasOtherPets),
    experience: applicant.experience,
    canDoDailyMeds: yesNo(applicant.canDoDailyMeds),
    maxSizeKg: applicant.maxSizeKg,
    prefersSpecies: applicant.prefersSpecies ?? '',
    prefersAge: applicant.prefersAge ?? '',
    prefersEnergy: applicant.prefersEnergy ?? '',
    submittedAt: new Date().toISOString(),
  };
}

/**
 * Share one household with the team. Never throws, never blocks.
 *
 * The caller adds the household to the local cohort FIRST and calls this
 * afterwards, so a dead endpoint, a blocked request or an offline visitor
 * costs nothing — the engine still runs and the board still renders.
 *
 * The status is reported back rather than swallowed, because a silent failure
 * here means discovering on Day 4 that twenty responses went nowhere.
 * `keepalive` lets the POST finish if the respondent closes the tab on submit.
 */
export async function submitSurveyResponse(applicant: Applicant): Promise<ShareStatus> {
  if (!isSurveyCaptureEnabled()) return 'idle';

  const body = JSON.stringify(buildSurveyPayload(applicant));

  try {
    if (SURVEY_TRANSPORT === 'beacon') {
      // 'text/plain' keeps this a CORS "simple request", so the browser sends
      // it straight through with no preflight — an Apps Script web app would
      // fail the preflight and the row would never be written. The response is
      // opaque by construction, so 'sent' is the honest ceiling here.
      await fetch(SURVEY_ENDPOINT, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body,
        keepalive: true,
      });
      return 'sent';
    }

    const response = await fetch(SURVEY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body,
      keepalive: true,
    });
    return response.ok ? 'shared' : 'failed';
  } catch {
    // A dead host or a blocked request still rejects in both modes.
    return 'failed';
  }
}
