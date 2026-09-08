# Applicant survey — P1-1

PRD §5: "Five-minute intake with ~20 real households — classmates, ACM
members, family. Home type, hours away, children, other pets, experience,
openness to a senior animal."

Send this questionnaire (as-is, or as a form) to ~20 real people. Every
question maps directly to an `Applicant` field in `src/engine/types.ts`, so
answers convert into a cohort record with no interpretation in between.

**The full pipeline, participant to deployed cohort, is diagrammed in
Architecture §12** — this document is the operational how-to; that one is the
authoritative "why does this not reopen no-server/no-database" argument and
the end-to-end data-flow. Read it first if anything here seems to imply the
external collector IS the app's data — it isn't; a response sits in the
collector until a person reviews it and pastes it into `cohort.ts`.

**Before sending:** tell each respondent this is for a hackathon demo using a
simulated cohort of animals — they are not applying to adopt a real animal.

---

## Questions

1. **Is there a specific animal you're here for?** (No — for the survey,
   answer "no" unless you're deliberately testing the specific-animal path.)
   → `specificAnimalId: null`

2. **Home type** — apartment or house?
   → `homeType: 'apartment' | 'house'`

3. **Do you have a yard?** (yes/no)
   → `hasYard: boolean`

4. **On a typical day, how many hours is the home empty?** (0–14)
   → `hoursAwayPerDay: number`

5. **Do you have children living at home?** (yes/no)
   → `hasChildren: boolean`

6. **Do you have other pets?** (yes/no)
   → `hasOtherPets: boolean`

7. **Pet experience, 1–5** (1 = never owned a pet, 5 = extensive
   experience, e.g. fostering or working with animals)
   → `experience: 1 | 2 | 3 | 4 | 5`

8. **Could you administer daily medication to a pet if needed?** (yes/no)
   → `canDoDailyMeds: boolean`

9. **What's the largest animal (in kg) your home could comfortably take?**
   Roughly: cat ≈ 3–6kg, small dog ≈ 5–15kg, medium dog ≈ 15–30kg, large
   dog ≈ 30–55kg.
   → `maxSizeKg: number`

10. **Preferred species?** dog / cat / no preference
    → `prefersSpecies: 'dog' | 'cat' | null`

11. **Preferred age?** young / adult / senior / no preference — and *would
    you be open to a senior animal?* (PRD explicitly wants this captured)
    → `prefersAge: 'young' | 'adult' | 'senior' | null`

12. **Preferred energy level, 1–5, or no preference?**
    → `prefersEnergy: 1 | 2 | 3 | 4 | 5 | null`

---

## Two ways to collect — pick one, both land in the same place

**Route A — the deployed app.** Send people the Vercel URL. They open "Add
a household", fill the real intake form, and tick *"Share this household
with the Kyndra team for our research cohort"*. The submission is POSTed to
a collector you own; export it as CSV and it feeds the converter below
unchanged.

Turning this on is one edit: paste the endpoint URL into `SURVEY_ENDPOINT`
in `src/data/surveyCapture.ts`, set `SURVEY_TRANSPORT` to match it, and
redeploy. **While that constant is empty the checkbox does not render at
all** — a share box that silently drops data would be exactly the sort of
claim PRD §3 forbids. Flip the expectation in
`tests/survey-capture.test.ts` when you enable it.

Either way the URL is a write-only collection address that ships in the
client bundle, so it is not a secret: no env var, no serverless function,
and Vercel still serves a pure static build.

### A1 — Google Apps Script (recommended: no vendor, so nothing to paywall)

**Zero cost by construction.** No signup, no card, no free-tier ceiling, and
no third party who can change their pricing the week of the demo. Uses a
Google account the team already has.

1. New Google Sheet. Name the first tab `Responses`.
2. Paste this as row 1, one header per cell. The first 13 are exactly the
   columns `csv-to-applicants.mjs` requires, so the export needs no editing;
   the last three (`responseId`, `surveyVersion`, `consent`) are integrity
   metadata the app sends automatically — add the columns so the Sheet
   actually captures them, but the converter ignores any column it doesn't
   need, so leaving them off costs nothing either:

   ```
   name  specificAnimalId  homeType  hasYard  hoursAwayPerDay  hasChildren
   hasOtherPets  experience  canDoDailyMeds  maxSizeKg  prefersSpecies
   prefersAge  prefersEnergy  submittedAt  responseId  surveyVersion  consent
   ```

   `responseId` lets you spot an accidental duplicate submission without
   anything that identifies who sent it. `surveyVersion` (currently
   `2026-09-v1`, from `SURVEY_VERSION` in `surveyCapture.ts`) tells you which
   version of the questions a row answered, in case they change later.
   `consent` is always `yes` on a row that exists at all — the app only
   builds a payload after the checkbox is ticked.

3. **Extensions → Apps Script**, and paste:

   ```js
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Responses');
     const data = JSON.parse(e.postData.contents);
     const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
     sheet.appendRow(headers.map((h) => (data[h] === undefined ? '' : data[h])));
     return ContentService.createTextOutput('ok');
   }
   ```

4. **Deploy → New deployment → Web app.** Execute as *Me*; Who has access
   *Anyone*. Copy the `/exec` URL.
5. Put that URL in `SURVEY_ENDPOINT` and leave `SURVEY_TRANSPORT` as
   `'beacon'`. Deploy. **File → Download → CSV** gives the converter its
   input.

**The one trade-off.** Apps Script returns no CORS headers, so the browser
cannot read the response. The app therefore says *"Sent — thank you"* and
never claims the row was written. Watch the Sheet fill up as you send the
link out — that, not the UI, is your confirmation. If the first test
submission does not appear, the usual cause is step 4: access must be
*Anyone*, not *Anyone with a Google account*.

### A2 — a hosted form service (if you would rather not touch Apps Script)

Free tiers with **no credit card**, verified September 2026: **Formspree**
(50 submissions/month), **Basin** (~100–500/month depending on plan
details), **Getform** (~50/month). Any of them covers ~20 responses. Set
`SURVEY_TRANSPORT` to `'json'` for these — they return CORS headers, so
the app can confirm receipt and will say *"Shared with the team"* instead of
*"Sent"*.

*(Formspark is **not** in this list: it is paid-only, around $25 one-time.
Do not use it for this project.)*

**Route B — a Google Form (zero code, the fallback).** Rebuild the twelve
questions above as a Form with column headers matching
`research/templates/applicant-survey-template.csv`, and export to CSV.
Use this if the endpoint wiring is eating time you do not have. Getting
twenty responses matters more than which instrument collected them.

**The consent rule either way.** Respondents must be told, before they
answer, that this is a hackathon project on a simulated cohort and that
they are not applying to adopt a real animal. Route A puts that disclosure
next to the checkbox. Route B needs it in the form's description — do not
rely on having said it in the message you sent.

**And the flag.** `surveyed: true` belongs only on a record from someone
who deliberately opted in. Judges and passers-by testing the live app add
households too; those stay in their own browser session and never reach
you, which is the point. Review every record before committing it.

## Converting responses into cohort records — the fast way

Collect responses into a CSV matching
`research/templates/applicant-survey-template.csv` (a Google Form's "Export
to CSV" or Sheets download works directly, as long as the column headers
match), then run:

```bash
node scripts/csv-to-applicants.mjs path/to/responses.csv
```

This prints ready-to-paste `Applicant` object literals — `surveyed: true`
baked in, ids assigned starting after whatever's already in `cohort.ts`,
yes/no columns converted to booleans, blanks converted to `null` for the
optional preference fields. Review the output, then paste it into the
`APPLICANTS` array in `src/data/cohort.ts`. The script never touches
`cohort.ts` itself — you paste, so you always see exactly what's being
added.

## Converting a response into a cohort record by hand

If you'd rather not use a CSV, each respondent becomes one `Applicant` in
`src/data/cohort.ts`. Template:

```ts
{
  id: 'p23',                 // next sequential id after the existing p01–p22
  name: 'Household 23',      // or a first name/initial if they're OK naming themselves
  surveyed: true,             // ONLY true for a record that came from this survey
  homeType: 'house',
  hasYard: true,
  hoursAwayPerDay: 6,
  hasChildren: false,
  hasOtherPets: true,
  experience: 4,
  canDoDailyMeds: true,
  maxSizeKg: 30,
  specificAnimalId: null,
  prefersSpecies: 'dog',
  prefersAge: 'adult',
  prefersEnergy: 3,
},
```

**Rules, from `cohort.ts`'s own header comment:**
- Set `surveyed: true` **only** on records that actually came from a real
  respondent. Never backfill it onto a placeholder.
- Don't delete the placeholder `p01`–`p22` records unless you have enough
  real respondents to replace the whole cohort — partial replacement is
  fine and is what `provenanceLabel()` is built to describe honestly
  ("13 of 22 households are real people we surveyed").
- Keep `id`s sequential and unique.

Once real records are in, `provenanceLabel()` in `cohort.ts` updates itself
automatically — no other file needs to change.
