# Kyndra — Architecture

**Where the right homes meet the right animals.**

**Companion to `kyndra-prd-final.md` · v4.0 · Sept 6, 2026 · Final**

*Renamed from FitFirst. The rename changes no technical decision in this document: stack, boundaries, data model, pipeline, and tests are unchanged.*

---

# 1. System shape

```
Browser — static SPA on Vercel Hobby
│
├── DATA (bundled JSON, compiled into the build)
│     cohort.ts              seeded animals + surveyed applicants
│     researchConstants.ts   every cited figure — one source of truth
│     humanBaseline.ts       recorded results of the manual-placement study
│
├── ENGINE (pure TypeScript · synchronous · zero dependencies)
│     constraints.ts   → eliminate impossible pairs, each with a citation
│     derive.ts        → build BOTH preference orders (must stay independent)
│     deferred.ts      → Gale–Shapley deferred acceptance
│     stability.ts     → blocking-pair verifier + swap-attempt evaluator
│     greedy.ts        → first-come-first-served baseline
│     equity.ts        → long-stay tie-breaking weight
│     regret.ts        → distributional quality of the assignment
│     impact.ts        → two-number model with assumption toggle
│     explain.ts       → rationale + counterfactual strings
│     random.ts        → cohort generator (property tests AND the aggregate)
│
├── UI (React)
└── PERSISTENCE  none — React state only, see §12

No server. No database. No required API calls. No device permissions. No key.
```

**Design consequence:** there is no network path in the critical flow — the matching experience (intake → derive → match → results) never depends on a network call succeeding. The demo cannot fail on a rate limit, a cold start, a down third-party service, or an expired token. The only live failure mode is a browser crash.

**Amendment (P1-1):** one optional, participant-consented exception exists — §12 documents it. It is additive and never sits in the critical path: with no endpoint configured the statement above is exactly true, and with one configured, the core matching flow still does not depend on it succeeding, or on it existing at all.

# 2. Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Vite + React + TypeScript | Lightest static build; Vercel autodetects; no Expo output-mode complexity |
| Engine | Pure TS, zero deps | Testable in isolation; the property tests *are* the correctness claim |
| Tests | Vitest | Randomised property tests, demoable |
| State | React state only | No server, no store library needed. Nothing persists across a refresh — see §12 for why that is intentional, not a gap |
| Styling | Tailwind or plain CSS | Either. Don't spend time here |
| Animation | CSS transitions | The greedy→stable transition needs no library |
| Host | Vercel Hobby | Free; personal non-commercial use — a hackathon entry qualifies |
| PWA | `public/manifest.json` + `<link rel="manifest">` | Trivial with Vite |

**Cost: $0. Cards on file: 0. Env vars: none.**

# 3. Repository layout

```
kyndra/
├── src/
│   ├── engine/                   ← SINGLE OWNER. Nobody else commits here.
│   │   ├── constraints.ts
│   │   ├── derive.ts
│   │   ├── deferred.ts
│   │   ├── stability.ts
│   │   ├── greedy.ts
│   │   ├── equity.ts
│   │   ├── regret.ts
│   │   ├── impact.ts
│   │   ├── explain.ts
│   │   ├── random.ts
│   │   └── index.ts              ← the ONLY public surface: runMatch()
│   ├── data/
│   │   ├── cohort.ts
│   │   ├── researchConstants.ts
│   │   └── humanBaseline.ts
│   ├── components/
│   │   ├── AnimalWall.tsx        ← landing: faces, not forms
│   │   ├── JudgeChallenge.tsx    ← the judge places animals first
│   │   ├── ApplicantIntake.tsx   ← incl. "specific animal?" question
│   │   ├── ConstraintGrid.tsx    ← animals × applicants, green/red
│   │   ├── ResultsBoard.tsx
│   │   ├── MatchDetail.tsx
│   │   ├── WhyNotPanel.tsx
│   │   ├── SwapAttempt.tsx
│   │   ├── EquityDial.tsx
│   │   ├── UnmatchedPanel.tsx
│   │   ├── RegretView.tsx
│   │   └── ImpactPanel.tsx
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   └── engine.test.ts            ← BOTH property tests
├── public/
│   ├── manifest.json
│   └── icon-192.png, icon-512.png
└── vite.config.ts
```

**Phase 0 of the PRD (§2) establishes this repository foundation before feature implementation begins.** This layout is authoritative; the PRD does not restate it.

**`engine/index.ts` exposes one function.** The UI never reaches into engine internals. That keeps the engine independently testable and means a Wednesday-night UI rewrite cannot break correctness.

**One person owns `src/engine/`.** State this on Saturday. Six people on a small codebase in six days is a merge-conflict machine, and the one directory that must be correct is the one that must not be contended.

# 4. Data model

```ts
// ─── Domain ────────────────────────────────────────────────────────────────

export interface Animal {
  id: string;
  name: string;                    // used in every UI string — never animal_07
  photo: string;                   // free-licence source, attributed
  species: 'dog' | 'cat';
  ageYears: number;
  sizeKg: number;
  energy: 1 | 2 | 3 | 4 | 5;
  behaviouralDifficulty: 1 | 2 | 3 | 4 | 5;
  okWithChildren: boolean;
  okWithOtherPets: boolean;
  needsYard: boolean;
  needsQuietHome: boolean;
  dailyMedication: boolean;
  specialNeeds: string[];
  daysInShelter: number;           // drives the equity dial and the story
}

export interface Applicant {
  id: string;
  name: string;
  surveyed: boolean;               // true for the ~20 real households

  // Household facts — the SHELTER side ranks on these
  homeType: 'apartment' | 'house';
  hasYard: boolean;
  hoursAwayPerDay: number;
  hasChildren: boolean;
  hasOtherPets: boolean;
  experience: 1 | 2 | 3 | 4 | 5;
  canDoDailyMeds: boolean;
  maxSizeKg: number;

  // Wants — the APPLICANT side ranks on these, and only these
  specificAnimalId: string | null;      // the animal they came for
  prefersSpecies: 'dog' | 'cat' | null;
  prefersAge: 'young' | 'adult' | 'senior' | null;
  prefersEnergy: 1 | 2 | 3 | 4 | 5 | null;
}
```

**Two fields carry unusual weight.**

`specificAnimalId` is the difference between a derived fiction and a real human choice, and it is what makes the two preference orders genuinely independent (§6).

`surveyed` is what lets the UI say *"simulated animals, real applicants"* truthfully and per-record.

```ts
// ─── Constraints ───────────────────────────────────────────────────────────

export interface Constraint {
  id: string;
  label: string;                                   // shown in "why not?"
  test: (a: Animal, p: Applicant) => boolean;      // true = pair viable
  preventsReturnCause: string;                     // shown in the UI
  citationKey: keyof typeof RESEARCH;
}
```

```ts
// ─── Results ───────────────────────────────────────────────────────────────

export interface Assignment {
  animalId: string;
  applicantId: string;
  constraintsSatisfied: string[];
  applicantRankOfAnimal: number;
  shelterRankOfApplicant: number;
  equityBoostApplied: number;      // 0 when the dial changed nothing
  rationale: string[];
  counterfactual: string;          // "without Marie, Bruno goes unmatched"
}

export interface UnmatchedAnimal {
  animalId: string;
  blockedBy: { applicantId: string; failedConstraint: string }[];
  recruitmentProfile: string;      // generated: "house with yard, no young children"
}

export interface MatchResult {
  assignments: Assignment[];
  unmatchedAnimals: UnmatchedAnimal[];
  unmatchedApplicants: { id: string; reason: string }[];
  isStable: boolean;
  blockingPairs: [string, string][];   // expected: empty
  equityWeight: number;
  regret: {
    worstAnimalRank: number;       // how far down its list the worst-off matched
    worstApplicantRank: number;
    meanAnimalRank: number;
  };
}
```

`recruitmentProfile` is generated, not authored — it falls out of data the filter already produced. `regret` is the honest answer to "stable isn't the same as good."

# 5. Research constants

```ts
export const RESEARCH = {
  dogReturnRate: {
    value: 0.163,
    label: '16.3% of adopted dogs returned',
    source: 'Powell et al. 2021, Scientific Reports (n=23,932, UPenn / Charleston Animal Society)',
  },
  behaviouralShareOfReturns: {
    value: 0.35,
    label: '~35% of returns are behavioural incompatibility',
    source: 'Powell et al. 2021, Scientific Reports',
  },
  householdPetConflictShare: {
    value: 0.18,
    label: '~18% of returns are conflict with existing household pets',
    source: 'Powell et al. 2021, Scientific Reports',
  },
  readoptionRate: {
    value: 0.10,
    label: '~1 in 10 returning owners adopt again',
    source: 'Powell et al. 2022, Scientific Reports',
  },
  behaviouralReturnerPenalty: {
    value: 4,
    label: 'Behavioural returners 4× less likely to adopt again than medical returners',
    source: 'Powell et al. 2022, Scientific Reports',
  },
} as const;
```

**Rules:**
1. Every number displayed anywhere resolves through `RESEARCH`. **No numeric literals in components.**
2. `source` renders on screen wherever the value appears.
3. **Powell 2021 only** for return composition. Do not add the 32.8% / 21.5% figures from a separate analysis — mixing studies looks like cherry-picking.
4. Cohort size is described as *"sized consistent with Shelter Animals Count's published per-organisation averages,"* never as sourced from their dataset.

# 6. The matching pipeline

```
runMatch(cohort, { equityWeight, assumptionLevel })

STEP 1 — FILTER
  For each (animal, applicant): evaluate every Constraint.
  Any failure → pair REMOVED from both preference lists.
  Record which constraint failed → feeds "why not?", the constraint
  grid, and the recruitment diagnostic.
  Never down-rank. Elimination is total.

STEP 2 — DERIVE   ⚠ THE TWO SIDES MUST NOT SHARE A SCORING FUNCTION

  APPLICANT ORDER — ranks on WANT
    if specificAnimalId is set → that animal is rank 1, unconditionally
    then: prefersSpecies, prefersAge, prefersEnergy, size within maxSizeKg
    Household-fit fields MUST NOT appear here.

  SHELTER ORDER — ranks on NEED
    behaviouralDifficulty vs experience
    energy vs hoursAwayPerDay
    needsYard / needsQuietHome vs home
    okWithChildren / okWithOtherPets vs household composition
    dailyMedication vs canDoDailyMeds
    then: equity tie-break (STEP 3)
    Applicant preference fields MUST NOT appear here.

  TIEBREAK: discrete profiles produce frequent exact ties, and tie
  handling changes which stable matching you land on — which silently
  breaks the "unique and order-independent" claim. Use a deterministic
  documented tiebreak (ascending id) applied consistently on both
  sides. DECIDE THIS DAY 3.

STEP 3 — EQUITY  (tie-break only)
  Within the shelter's order, when two applicants score within a
  narrow band, the weight advances the animal with more daysInShelter
  or a special need.
  HARD RULE: equity operates only on candidates that already passed
  STEP 1. It can never introduce, reinstate, or advance a pair that
  failed a constraint. Property test #2 enforces this.

STEP 4 — MATCH
  Gale–Shapley deferred acceptance, ANIMALS PROPOSING.
  Rationale: deferred acceptance is optimal for the proposing side,
  and the shelter is the party accountable for the outcome — so the
  assignment should be optimal from the animals' side.
  The proposer-optimal stable matching is unique, so with a
  deterministic tiebreak the result is independent of input order.

STEP 5 — VERIFY
  Scan every (animal, applicant) pair not matched to each other.
  Blocking pair := both would prefer each other over their current
  assignment. A correct implementation returns zero.
  The same evaluator powers "attempt a swap" — a judge's proposed
  reshuffle is just a candidate blocking pair, evaluated and explained.

STEP 6 — EXPLAIN
  Per assignment: constraints satisfied, top contributing factors on
  each side, and the counterfactual (recompute without that applicant;
  report what changes).

STEP 7 — MEASURE
  regret: worst and mean matched rank on each side.

STEP 8 — MODEL
  Two separate numbers, never combined:
    (a) EFFORT SAVED — pairwise reviews avoided on this cohort.
        Provable, ours, no research needed.
    (b) PROJECTED WELFARE EFFECT — apply RESEARCH constants to the
        constraint violations present in the greedy baseline and absent
        in the stable assignment, scaled by assumptionLevel (0.4–0.6).
        Labelled a projection, every constant and source shown.
```

**Why the two sides must not share a scoring function.** If both preference orders derive from the same fit score, the orders become near-identical, blocking pairs are impossible by construction, and stability is vacuous — at which point a Hungarian assignment would produce strictly better total welfare and the choice of algorithm is indefensible. Independence is not a design preference; it is what makes this the right algorithm. See PRD §4.

Complexity: O(n²) worst case. At shelter scale it completes in single-digit milliseconds in the browser.

# 7. Tests and measurement

Written **Day 3, alongside the algorithm — not after it.** A test written Thursday against code that already passed by luck proves nothing. Phase 0 stands up the Vitest harness only; the property tests below belong to the matching-engine phase.

```ts
// PROPERTY TEST 1 — stability
test('produces no blocking pairs across randomised cohorts', () => {
  for (let i = 0; i < 500; i++) {
    const cohort = randomCohort();
    const result = runMatch(cohort, { equityWeight: randomWeight() });
    expect(result.blockingPairs).toHaveLength(0);
  }
});

// PROPERTY TEST 2 — equity safety
test('equity weight never breaches a hard constraint', () => {
  for (let i = 0; i < 500; i++) {
    const cohort = randomCohort();
    for (const w of [0, 0.25, 0.5, 0.75, 1]) {
      const result = runMatch(cohort, { equityWeight: w });
      for (const a of result.assignments) {
        expect(allConstraintsPass(a, cohort)).toBe(true);
      }
    }
  }
});
```

**Test 1 proves the algorithm is right. Test 2 proves the equity dial cannot undermine the thesis.** They are the project's correctness argument — show them running.

**Randomised aggregate** reuses `random.ts`: run `greedy()` and `runMatch()` across 500 generated cohorts, report mean hard-constraint violations for each. This is nearly free and it kills the "your demo cohort is rigged by construction" objection.

**Human baseline** is recorded by hand into `humanBaseline.ts`:

```ts
export const HUMAN_BASELINE = {
  participants: 5,
  method: 'Same cohort, 2-minute timer, first-come-first-served placement',
  meanViolations: 0,     // fill in after running it
  range: [0, 0],
  caveat: 'Informal exercise with 5 participants, not a controlled study.',
} as const;
```

# 8. UI architecture

**Principle: the interface's job is to make the algorithm inspectable.** Every screen answers a question a sceptic would ask.

| Component | Question it answers | Notes |
|---|---|---|
| `AnimalWall` | Who is waiting? | Landing state. Photos, names, days-in-shelter badges. **Not a form.** |
| `JudgeChallenge` | Can *you* do this? | Judge places 3–4 animals on a timer, then sees what they got wrong. **Strongest opening available.** |
| `ConstraintGrid` | How big is this really? | Animals × applicants, green/red. 16 × 22 = 352 judgements on the demo cohort, in one image |
| `ApplicantIntake` | What does this household look like? | Opens with "is there a specific animal you're here for?" |
| `ResultsBoard` | Who goes where? | Animated greedy→stable transition: cards move, violation badges vanish |
| `MatchDetail` | Why this pairing? | Rationale + counterfactual |
| `WhyNotPanel` | Why *not* the others? | Eliminated applicants + constraint + citation |
| `SwapAttempt` | Can I break it? | Judge picks two pairs, tries to reshuffle, sees the exact failure |
| `EquityDial` | What should this optimise for? | Hero interaction. Large, top-level, visibly reshuffles the board |
| `UnmatchedPanel` | Who did this fail, and what now? | Recruitment diagnostic |
| `RegretView` | Is stable actually *good*? | Worst-off matched rank — the honest counterpart to stability |
| `ImpactPanel` | What is this worth? | Two numbers, assumption toggle, permanent "simulated" label |

**Presentation constraints — treat as requirements:**
- Designed for a Zoom screen share: large type, high contrast, few elements per screen, no dense tables. **Test by shrinking the browser to a quarter of the screen.**
- A preset button loads the cohort in one click. **Never type during the presentation.**
- Never encode match quality in colour alone.
- Animal names in every string.
- Cohort wall stacks cleanly on mobile.

# 9. Deployment

- **Build:** `vite build` → `dist/`. Vercel autodetects; no config file required.
- **Env vars:** none. **Functions:** none.
- **PWA:** `public/manifest.json` with 192/512 icons, linked from `index.html`.
- **Deploy Day 1**, before features exist, so "it works on Vercel" is never a Thursday discovery.

# 10. Known failure modes

| Failure | Effect | Handling |
|---|---|---|
| **Mass ties from discrete profiles** | Non-deterministic output; breaks the uniqueness claim | Deterministic documented tiebreak, decided Day 3 |
| **Constraints too strict → most of cohort unmatched** | Looks like failure | Tune strictness Day 2 against the real cohort |
| **Bruno narrative doesn't hold in real output** | The demo's spine breaks | Verify Day 5. Adjust the cohort, never the story |
| **Equity dial produces no visible change** | Hero interaction falls flat | Verify Day 5; widen the tie band if fit scores are too separated |
| Engine bug producing instability | Severe | Property test 1 |
| Equity breaching a constraint | Severe — undermines the thesis | Property test 2 |
| Photo licensing | Credibility / legal | Free-licence sources, attributed, Day 1 |
| Network drops mid-demo | None | Nothing fetches at runtime |
| Vercel down | Fatal | Recorded demo video (Day 6) |
| Browser crash | Fatal for that run | Preset button reloads state in one click |
| Merge conflicts in engine | Moderate | Single owner, stated Saturday |
| Unsourced number on screen | Credibility | All numbers resolve through `RESEARCH` |

# 11. Deferred architecture — the roadmap slide

**Petfinder API.** Free key, OAuth client credentials. Its per-animal fields — `good_with_children`, `good_with_dogs`, `good_with_cats`, `house_trained`, `special_needs`, plus age, size, breed, photos and a live listing URL — map almost exactly onto the constraint model above, because the same compatibility questions that drive returns are the ones shelters are asked to record. Integration = one Edge function to hold the secret plus a normaliser into `Animal`. **Real animals, real photos, clickable listings.** Deferred only because it conflicts with the single-cohort decision; check their caching terms before building one.

**Bonded pairs.** Animals adopted together turn this into matching with couples, NP-hard in general — worth saying, worth a documented heuristic later.

**Rolling mode.** Re-run against unmatched animals when one applicant arrives mid-cycle. Same engine, different call.

**Staff-verified flags.** Self-reported fields like experience level would carry a verification flag the ranking weights more heavily.

# 12. Optional research capture (P1-1)

**No persistence exists anywhere in the core app, and that is deliberate, not an oversight.**
`cohort` lives in one `useState` in `App.tsx`. A refresh, a closed tab, or a browser
restart loses every local edit — added households, added animals, removed records —
and returns to the bundled `COHORT` from `src/data/cohort.ts`. This is intentional:
the property tests prove things about *that* committed cohort, and the board rehearsed
before the demo has to be the board presented during it. A visitor's edit is a demo
feature that lives in memory for their visit, not a database write. `localStorage` is
not used anywhere in `src/` — an earlier draft of this document said it was; it wasn't,
and the claim has been corrected here rather than implemented, per the same
inspectable-over-convenient bias as the rest of this document.

**One narrow, optional exception sits beside this, never inside it: research capture.**
A household filling in "Add a household" on the *deployed* app may tick a consent
checkbox to share their answers with the team for the applicant survey (PRD P1-1). When
they do, the browser fires a single POST to an external, team-owned collector (a Google
Apps Script web app, or a free-tier hosted form service). Full implementation:
`src/data/surveyCapture.ts`; UI: `src/components/ApplicantIntake.tsx`; operational
walkthrough: `research/applicant-survey.md`.

**Why this does not reopen "no server, no database":**
- The core matching flow (intake → derive → match → results) never awaits this request,
  never branches on its result, and works identically whether it succeeds, fails, or
  never fires at all — because no endpoint is configured by default.
- There is still no server *Kyndra operates*. The collector is a third-party address the
  client POSTs to; Vercel still serves a static build with no serverless function.
- There is still no database *the app reads from*. The external collector is
  write-only from the app's perspective — nothing the app shows a user is ever read back
  from it. It is a research collection mechanism, not a data source.
- There is still no env var and no secret. The endpoint is a public constant
  (`SURVEY_ENDPOINT` in `surveyCapture.ts`) shipped in the client bundle by design: it is
  a write-only collection address, not a credential.
- **Consent-gated:** the sharing checkbox exists only when `SURVEY_ENDPOINT` is
  non-empty, and even then only submits when the household explicitly ticks it.

**The data flow, end to end — external submissions never touch the deployed app automatically:**

```
Participant fills "Add a household" on the deployed app
  → ticks the optional consent checkbox (only rendered if capture is configured)
  → browser POSTs a research payload to the external collector
  → collector appends one row to a Sheet/table the team owns
  → [nothing here changes the live site — the deployed cohort is still the
     committed src/data/cohort.ts, unaffected by what the Sheet contains]
  → researcher reviews the Sheet by hand, at a time of their choosing
  → responses normalised where needed (typos, out-of-range values)
  → node scripts/csv-to-applicants.mjs converts approved rows to Applicant
    object literals, with surveyed: true baked in
  → a person pastes the reviewed literals into APPLICANTS in cohort.ts
  → commit, redeploy — NOW the real data is in the bundled build
```

A response existing in the external collector is not the same thing as a response being
in the app. Nothing makes that promotion automatic, and nothing should: an unreviewed
row could carry a typo (`"experience": 50`) or bad-faith input, and the property tests
are a guarantee about the *committed* cohort, not about whatever a stranger last typed
into a form.

**`specificAnimalId` is not flattened into a general preference.** A respondent who says
they came for a named animal (`specificAnimalId: 'bruno'`) is recording a different kind
of signal than one who states `prefersSpecies`/`prefersAge`/`prefersEnergy` — Architecture
§6 STEP 2 already treats a stated specific animal as an unconditional rank-1, never a
score. The survey payload preserves this distinction exactly: `specificAnimalId` travels
as its own field, empty string standing in for `null` (never conflated with "no
preference" on species/age/energy, which are three separate fields of their own).

**Payload integrity, without inventing infrastructure.** Every submission carries:
- `responseId` — a client-generated UUID, so a researcher can spot an accidental
  double-submission without anything that identifies the person.
- `surveyVersion` — a dated string (`SURVEY_VERSION` in `surveyCapture.ts`), bumped
  whenever a question's meaning or structure changes, so a later analysis never silently
  mixes two incompatible instruments.
- `consent: 'yes'` — the payload is only ever constructed after the checkbox is ticked,
  and this field records that fact on the row itself, not just in the code path that
  produced it.

No name, email, or other identifying field is collected beyond whatever the respondent
volunteers in the free-text "Household name" box, which is not required.

**What is deliberately not built.** No account system, no database the app queries, no
server-side validation, no analytics platform, no dashboard beyond the Sheet/table itself.
The researcher reviewing responses and pasting approved ones into `cohort.ts` *is* the
review step — adding software to automate it would be exactly the kind of infrastructure
this architecture exists to avoid for a ~20-response survey.
