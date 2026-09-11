# Kyndra

> **Where the right homes meet the right animals.**

Kyndra is a pet-adoption matching prototype for animal shelters. It treats
placement as a **two-sided, constraint-aware stable matching problem**
instead of a simple pet-recommendation ranking: it models what an adopting
household wants *and* what an animal needs, removes pairings that violate a
hard constraint, and settles the whole cohort at once with Gale–Shapley
deferred acceptance. Every proposed placement carries its reasons, and every
elimination carries its cited cause — nothing here is an opaque score.

Kyndra proposes. Shelter staff decide.

---

## What it does

- **Cohort Demo** — a realistic, fictional preset cohort (animals + applicant
  households) you can explore immediately, with impossible pairings, multiple
  viable matches, and one animal that stays unmatched by design (a
  recruitment diagnostic, not a bug). Reset it back to the original preset at
  any time, or add your own animals on top of it.
- **Matching** — build your own cohort from scratch (or load the same demo
  preset as a starting point), then run the matching engine and watch it
  filter, derive, and settle a stable assignment.
- **Results & explainability** — every placement shows why it happened (which
  requirements were satisfied, both sides' rankings, a counterfactual, and a
  "View match details" breakdown of every hard constraint it cleared). A
  "Why not the others?" panel shows, for any animal, every household that was
  eliminated and the documented cause. An equity dial, a first-come-first-served
  comparison, a stability check, and an impact estimate round out the board.
- **About** — what's real (the constraints, the citations) and what's
  simulated (the cohort itself), with sources.

## Tech stack

- **React 19** + **TypeScript**, built with **Vite**
- **Vitest** for tests (property tests + a 500-cohort randomized aggregate)
- Plain CSS — no CSS framework, no component library, no router (a small
  `location.hash`-synced page switch in `App.tsx`)
- **Zero runtime dependencies for the matching engine itself** — pure,
  synchronous TypeScript
- Deployed as a static SPA (Vercel Hobby or any static host) — no server, no
  database, no required API calls

## Project structure

```
src/
  engine/            Pure matching engine — constraints, derive, Gale–Shapley
                      deferred acceptance, equity, regret, impact, explain.
                      index.ts is the only public surface (runMatch, types).
  components/         React UI — pages (HomePage, CohortPage, MatchPage,
                      EvidencePage) and the panels that make up the results
                      board (WhyNotPanel, UnmatchedPanel, RegretView, …).
  data/               Seeded cohort (animals + applicants), cited research
                      figures, the human-baseline study data, and the
                      (disabled-by-default) survey-capture endpoint.
  App.tsx             Thin router shell — owns the two cohorts (Cohort Demo's
                      and Try Matching's) and the shared match outcome.
  index.css           The whole design system: tokens, layout, components.
tests/                Vitest suite — engine property tests, cohort-editing,
                      narrative pins, survey capture, etc.
scripts/              CSV → committed-data converters for real survey/
                      baseline-study intake (see research/).
research/             Field-research protocol docs and CSV templates.
kyndra-architecture-final.md   System design reference (data flow, engine
                                contract, deployment constraints).
kyndra-prd-final.md            Product requirements reference.
```

## Setup

```bash
npm install
```

## Running it

```bash
npm run dev        # start the Vite dev server
npm run build       # type-check (tsc -b) then production build to dist/
npm run preview     # serve the production build locally
npm run typecheck   # tsc -b --noEmit only
npm run test        # run the Vitest suite
```

## Configuration

Kyndra is a static build with **no environment variables and no server**.
The one optional piece of configuration is survey capture:

- `src/data/surveyCapture.ts` exports `SURVEY_ENDPOINT`. When set to a real
  collector URL (e.g. a Google Apps Script web app bound to a Sheet), the
  applicant intake form's opt-in sharing checkbox becomes live and consenting
  submissions are POSTed there — one-directional, nothing is ever read back
  into the app. Leave it empty to keep the checkbox hidden and capture
  disabled. See `research/applicant-survey.md` for the collector setup.

## A note on the data

The cohort you see is **invented** — no real shelter's data. The constraints
the engine enforces are not: each one maps to a documented cause of adoption
return, cited on the About page. `src/data/cohort.ts` documents this
provenance in detail, including which values are pinned by
`tests/narrative.test.ts` because the demo's own script depends on them
holding (e.g. one animal must stay unmatched at every setting) — read that
file's header before editing any record in it.

## Architecture & product references

- `kyndra-architecture-final.md` — system shape, data flow, the engine's
  contract, and why the app has no server.
- `kyndra-prd-final.md` — product requirements and the demo script this
  build's explainability panels are ordered around.
- `src/engine/README.md` — the engine's own rules (pure, synchronous, zero
  dependencies, single public surface).
