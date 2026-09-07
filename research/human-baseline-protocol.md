# Human baseline study — P1-2

PRD §5: "Give five people the same cohort. Two-minute timer. Place animals
first-come-first-served, as a coordinator would. Count hard-constraint
violations."

Result target: *"Five people placed this cohort by hand. They averaged N
violations. Kyndra produces zero, provably."*

---

## Before you start: record the cohort fingerprint

Run this and keep the 8-character value it prints:

```bash
npx vitest run tests/human-baseline.test.ts
```

```
COHORT FINGERPRINT — 2d2b069c
  16 animals, 22 households.
```

**Why.** This study measures people placing *the board that was live when they
sat down*. `src/data/cohort.ts` already changed once mid-week (8 Sept: Bruno's
size, p14's size ceiling, p21's named request), and a session run before that
scores a cohort that no longer exists. The fingerprint travels with the
recorded result, and the app refuses to show the number once it stops matching
the cohort on screen — so a stale claim goes quiet instead of going on stage.

Take it **before** the sessions, and if anyone edits the cohort mid-study,
stop and start over. A study spanning two different cohorts is not a study.

The fingerprint deliberately ignores stated preferences (`prefersSpecies`,
`prefersAge`, `prefersEnergy`, `specificAnimalId`) — participants are never
shown those, so changing one cannot alter anybody's pairing or its violation
count. See `src/data/cohortFingerprint.ts`.

## What you need

- 5 participants, one at a time (or in parallel if you have proctors for
  each).
- The demo cohort's animal profiles and applicant profiles, printed or on
  screen — **not** the constraint rules. The whole point is that a human
  under time pressure doesn't have the hard-constraint list memorized, the
  same way a real coordinator doesn't.
- A 2-minute timer.
- This scoring sheet.

Use the same cohort every time — `src/data/cohort.ts`'s `ANIMALS` and
`APPLICANTS` (or whatever is live when you run the study). Same cohort
across all 5 participants is what makes the comparison fair.

## Running one session

1. Hand the participant the animal list (name, species, age, size, energy,
   behavioural difficulty, "ok with children," "ok with other pets," needs
   yard, needs quiet home, daily medication, special needs, days in
   shelter) and the applicant list (household facts only — not their
   stated preferences, since a real coordinator matching first-come-first-
   served is matching to *need*, arrival-order, not want).
2. Start the 2-minute timer.
3. Instruct: "Place each animal with one household, first-come-first-
   served — go in the order the households are listed, and give each one
   the best animal still available for their situation. Go."
4. Stop at 2 minutes, whatever state the board is in.
5. Record their final animal→household pairing on the scoring sheet below.

## Scoring a session

For every pairing the participant made, check it against the hard
constraints in `src/engine/constraints.ts` (`CONSTRAINTS` — each one has a
citation). A pairing that fails **any** constraint counts as **one
violation**, regardless of how many constraints it fails.

You can score this by hand against the constraint list, or — faster and
consistent with how Kyndra itself checks — feed the participant's pairing
through the engine's own checker:

```ts
import { evaluatePair } from '../src/engine';
import { ANIMALS, APPLICANTS } from '../src/data/cohort';

// participant's pairing, animalId -> applicantId
const participantPairing: Record<string, string> = {
  bruno: 'p03',
  barnaby: 'p07',
  // ...
};

let violations = 0;
for (const [animalId, applicantId] of Object.entries(participantPairing)) {
  const animal = ANIMALS.find((a) => a.id === animalId);
  const applicant = APPLICANTS.find((p) => p.id === applicantId);
  if (!animal || !applicant) continue;
  if (evaluatePair(animal, applicant).length > 0) violations += 1;
}
console.log(violations);
```

This uses the exact same constraint evaluator Kyndra's own pipeline runs,
so "zero, provably" and "N, by hand" are directly comparable numbers.

## Scoring sheet

| Participant | Pairings made | Violations | Notes |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

## Recording the result — the fast way

Put each participant's final violation count into a CSV matching
`research/templates/baseline-scoring-template.csv` (`participant,violations`,
one row per person), then run:

```bash
node scripts/csv-to-baseline.mjs path/to/sessions.csv <cohort-fingerprint>
```

The fingerprint is the one you took before the sessions. It is **required** —
the converter refuses to produce a record without it, because a result with no
cohort attached cannot be checked for staleness later.

This prints a ready-to-paste `HUMAN_BASELINE` object with the mean and
range computed for you, and `recorded: true` only because you gave it real
numbers. Paste the output over the existing export in
`src/data/humanBaseline.ts`.

## Recording the result by hand

Once all 5 are scored, fill in `src/data/humanBaseline.ts` yourself:

```ts
export const HUMAN_BASELINE = {
  recorded: true,
  participants: 5,
  method: 'Same cohort, 2-minute timer, first-come-first-served placement',
  meanViolations: /* mean of the 5 violation counts */,
  range: [/* min */, /* max */],
  caveat: 'Informal exercise with 5 participants, not a controlled study.',
  cohortFingerprint: /* the value you took before the sessions */,
} as const;
```

**Do not** set `recorded: true` until real numbers are in — the file's own
header comment explains why a placeholder `0` would read as a fabricated
result. The panel stays dark on any of three conditions: not run, flag flipped
without a result, or a fingerprint that no longer matches the live cohort. `meanViolations`/`range` are typed `number | null` / `[number,
number] | null` for exactly this reason; only replace `null` once you have
the real numbers.

Report honestly per PRD §3: n=5, described as an informal exercise, not a
controlled study — never framed as if it were.
