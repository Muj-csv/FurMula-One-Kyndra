# Applicant survey — P1-1

PRD §5: "Five-minute intake with ~20 real households — classmates, ACM
members, family. Home type, hours away, children, other pets, experience,
openness to a senior animal."

Send this questionnaire (as-is, or as a form) to ~20 real people. Every
question maps directly to an `Applicant` field in `src/engine/types.ts`, so
answers convert into a cohort record with no interpretation in between.

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
