# Frontend Revision — Phase Plan

**Purpose:** track the next round of frontend changes as separate, committable phases. Each phase is scoped to be its own commit/push, and — when we execute a phase — work stays strictly inside that phase's listed changes. Nothing gets pulled forward from a later phase, nothing lingers from an earlier one. This file is the progress record: check items off as they're done.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 1 — Nav & footer chrome ✅

**Goal:** restyle the top nav's four buttons, add two placeholder icon buttons beside them, and replace the footer's current bottom text.

- [x] `NavBar.tsx` — the four nav links (Overview / Explore Cohort / Try Matching / Evidence) become translucent tile-style buttons, using the existing color tokens (`--terracotta`, `--paper-warm`, `--line`, etc.) rather than the previous plain-text underline style.
- [x] `NavBar.tsx` — added two placeholder icon buttons in the nav-actions area, beside the existing "Try Matching" pill: a notification-bell icon and a profile icon (new symbols in `IconSprite.tsx`, generic UI glyphs, not animal imagery). Visual only, no click behavior — `title`/`aria-label` say "coming soon."
- [x] `Footer.tsx` — bottom text replaced with a copyright line + plain-text (non-linking, since there are no real destination pages) legal labels — the standard footer-bottom content the design's own CSS already had a `.legal-links` class for. The old line ("Simulated animals; real applicants...") is unchanged content-wise: it's still stated at the top of every page via `App.tsx`'s provenance banner (PRD §3.1), so nothing honesty-relevant was lost.

**Definition of done:** `npm run typecheck` ✅, `npm run build` ✅, `npm run test` ✅ (61/61). Files touched: `NavBar.tsx`, `Footer.tsx`, `IconSprite.tsx`, `index.css` only — confirmed via `git status`.

---

## Phase 2 — Explore Cohort: decluttered cards + add/remove ✅

**Goal:** the cohort grid shows less per card, and gains the ability to remove an animal, not just add one.

- [x] `CohortPage.tsx` — each card face now shows only: name, the picture/logo placeholder (`AnimalAvatar`), and days waiting (the status tag). The species/age line, the "Simulated shelter cohort" location line, and the "View match requirements →" footer strip were removed from the card face.
- [x] `CohortPage.tsx` — clicking a card opens the existing modal, which already carried species/age/size/days-in-shelter and the match-requirements list — that's the one place this information lives now.
- [x] `CohortPage.tsx` — added a "Remove from cohort" action inside the modal. `App.tsx` gained a `removeAnimal` handler (mirrors `addAnimal`) threaded down as `onRemoveAnimal`.

**Definition of done:** `npm run typecheck` ✅, `npm run build` ✅, `npm run test` ✅ (61/61). Files touched: `App.tsx`, `CohortPage.tsx` only — confirmed via `git status`.

---

## Phase 3 — Two starting states: blank build vs. demo cohort ✅

**Goal:** "Run the matching engine" from the Overview page starts from nothing — the visitor builds the whole dataset themselves. "Explore Cohort" keeps behaving like a demo: pre-loaded animals and households, editable.

- [x] `App.tsx` — the single shared `cohort` state split into two: `demoCohort` (starts as the preset `COHORT`, only touched by Explore Cohort's Phase 2 add/remove) and `matchCohort` (starts as `{ animals: [], applicants: [] }`, only touched by the Match page's own intake forms). `outcome`/`compare()` now run against `matchCohort` only.
- [x] `MatchPage.tsx` — gained its own "Add an animal" toggle + `AnimalIntake`, mirroring the existing household one, since a blank cohort needs both to be buildable from this page (previously animals could only be added on Explore Cohort). The pre-run demo beats (`ThroughLine`/`JudgeChallenge`/`ConstraintGrid`) only render once there's at least one animal; before that, a plain "add at least one animal" prompt takes their place. Button/copy updated to stop implying a preset cohort ("Build your cohort, then run it", "Clear and start over").
- [x] Confirmed via `node`: `compare()` on a genuinely empty cohort returns a valid (trivially stable, zero-assignment) result — clicking "Run" before adding anything doesn't crash.
- [x] Explore Cohort unaffected: `CohortPage` still reads `demoCohort`, which still starts as the preset `COHORT` — untouched by this split.
- [x] The provenance banner (`App.tsx`) now describes whichever cohort the current page actually shows: `demoCohort` on Explore Cohort, `matchCohort` everywhere else (Home has no cohort content yet; Match/Evidence both concern the dataset being matched).

**Definition of done:** `npm run typecheck` ✅, `npm run build` ✅, `npm run test` ✅ (61/61). Files touched: `App.tsx`, `MatchPage.tsx` only — confirmed via `git status`.

---

## Phase 4 — Consistency pass & verification

**Goal:** close out the round — nothing added here, only checked.

- [ ] Re-read Phases 1–3 against what actually shipped; note anything that drifted.
- [ ] `npm run typecheck`, `npm run build`, `npm run test` all green.
- [ ] Manual walkthrough of all four pages and both Phase 3 starting states.

**Definition of done:** every box above is checked, all three verification commands pass, and this file accurately reflects what was built.

---

## Execution rule

When we start work on a phase, we implement **only** what that phase lists — nothing borrowed from a later phase, nothing left unfinished from an earlier one. If something comes up mid-phase that belongs elsewhere, it gets added as a new checklist item in the right phase, not done on the spot.
