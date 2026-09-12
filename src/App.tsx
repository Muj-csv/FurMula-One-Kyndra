// App.tsx — thin router shell. Owns the shared state every page reads and
// switches between the four pages. No routing library: Architecture §2
// restricts dependencies to React/Vite/TypeScript/Vitest/styling, so this is
// a plain state switch synced to location.hash — back/forward and reload
// still work, nothing new installed.
//
// Phase 3 (Frontend/REVISION-PHASES.md): two SEPARATE cohorts, not one
// shared between pages:
//
//   demoCohort  — Explore Cohort's own dataset. Starts as the preset COHORT
//                 and stays that way across navigation; Phase 2's add/remove
//                 operate on this one. Never run through the engine.
//   matchCohort — Try Matching's own dataset. Starts EMPTY — no preset data
//                 leaks into it — and the visitor builds it from scratch
//                 with the animal/household intake forms on that page. This
//                 is the cohort that actually gets matched.
//
// The UI never reaches into engine internals — it calls compare()/runMatch()
// and reads the result. That is the whole contract (Architecture §3).

import { useEffect, useMemo, useState } from 'react';
import { ASSUMPTION_CONSERVATIVE, compare, type Animal, type Applicant, type Cohort } from './engine';
import { COHORT, provenanceLabel } from './data/cohort';
import { COHORT_SIZING_NOTE } from './data/researchConstants';
import { IconSprite } from './components/IconSprite';
import { NavBar, type Page, type Theme } from './components/NavBar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { CohortPage } from './components/CohortPage';
import { MatchPage } from './components/MatchPage';
import { EvidencePage } from './components/EvidencePage';
import './index.css';

const EMPTY_COHORT: Cohort = { animals: [], applicants: [] };

/** Where the remembered theme lives. Must match the bootstrap in index.html. */
const THEME_KEY = 'kyndra-theme';

/**
 * The theme the page is ALREADY showing.
 *
 * Read back off the document rather than re-derived from storage: the inline
 * bootstrap in index.html has already applied it before first paint, and two
 * pieces of code deciding the same thing independently is how they end up
 * disagreeing. This one just asks what happened.
 */
function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** The page ground for each theme, mirrored into the browser chrome. */
const THEME_COLOR: Record<Theme, string> = { light: '#f8f3e8', dark: '#2a2118' };

function pageFromHash(): Page {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'cohort' || hash === 'match' || hash === 'evidence') return hash;
  return 'home';
}

// Counting is not enough on its own: remove-then-add, or a preset id that
// already looks generated, and the new record silently collides with an
// existing one. Step past anything taken.
function freeId(prefix: string, taken: Set<string>): string {
  let n = taken.size + 1;
  while (taken.has(`${prefix}${String(n).padStart(2, '0')}`)) n += 1;
  return `${prefix}${String(n).padStart(2, '0')}`;
}

export function App() {
  const [page, setPage] = useState<Page>(pageFromHash);

  const [demoCohort, setDemoCohort] = useState<Cohort>(COHORT);
  const [matchCohort, setMatchCohort] = useState<Cohort>(EMPTY_COHORT);

  const [hasRun, setHasRun] = useState(false);
  const [showApplicantIntake, setShowApplicantIntake] = useState(false);
  const [showAnimalIntake, setShowAnimalIntake] = useState(false);
  // Starts at 0 — PURE WANT — on purpose. The demo's hero beat (PRD §8 step 8)
  // is "slide the dial, Bruno matches", and Bruno is only unmatched below 0.30.
  const [equityWeight, setEquityWeight] = useState(0);
  const [assumptionLevel, setAssumptionLevel] = useState(ASSUMPTION_CONSERVATIVE);

  const [theme, setTheme] = useState<Theme>(currentTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Private mode, or site data blocked. The theme still applies for this
      // visit; it just will not be remembered for the next one. Not a reason
      // to break the page.
    }
  }, [theme]);

  const outcome = useMemo(
    () => (hasRun ? compare(matchCohort, { equityWeight, assumptionLevel }) : null),
    [matchCohort, hasRun, equityWeight, assumptionLevel],
  );

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: Page) => {
    window.location.hash = next === 'home' ? '' : next;
    setPage(next);
  };

  // ─── Explore Cohort (demo dataset) ───────────────────────────────────────

  const addDemoAnimal = (animal: Animal) => {
    setDemoCohort((previous) => ({
      animals: [...previous.animals, animal],
      applicants: previous.applicants,
    }));
  };

  const removeDemoAnimal = (animalId: string) => {
    setDemoCohort((previous) => ({
      animals: previous.animals.filter((animal) => animal.id !== animalId),
      applicants: previous.applicants,
    }));
  };

  const nextDemoAnimalId = freeId('a', new Set(demoCohort.animals.map((a) => a.id)));

  // Phase 3.2 (Kyndra_UI_UX_Refinement_Prompt.md) — undo any add/remove and
  // return to the original preset cohort.
  const resetDemoCohort = () => setDemoCohort(COHORT);

  // ─── Try Matching (blank-start dataset) ──────────────────────────────────

  const addMatchAnimal = (animal: Animal) => {
    setMatchCohort((previous) => ({
      animals: [...previous.animals, animal],
      applicants: previous.applicants,
    }));
    setHasRun(false);
  };

  const addApplicant = (applicant: Applicant) => {
    setMatchCohort((previous) => ({
      animals: previous.animals,
      applicants: [...previous.applicants, applicant],
    }));
    setHasRun(false);
  };

  const nextMatchAnimalId = freeId('a', new Set(matchCohort.animals.map((a) => a.id)));
  const nextApplicantId = freeId('p', new Set(matchCohort.applicants.map((a) => a.id)));

  // Phase 4.2 (Kyndra_UI_UX_Refinement_Prompt.md) — the empty-state's fast
  // path. Loads the same preset used by Cohort Demo, as its own copy, so
  // editing it here never touches demoCohort.
  const loadDemoCohort = () => {
    setMatchCohort({ animals: [...COHORT.animals], applicants: [...COHORT.applicants] });
    setHasRun(false);
  };

  // Cohort Demo's "Run this cohort →" CTA (Phase 1.2): carries whatever is
  // currently on Explore Cohort — preset plus any edits — into Try Matching
  // as its own copy, then jumps there. matchCohort stays independently
  // editable afterwards; this is a one-time copy, not a live link.
  const runDemoCohortInMatch = () => {
    setMatchCohort({ animals: [...demoCohort.animals], applicants: [...demoCohort.applicants] });
    setHasRun(false);
    window.location.hash = 'match';
    setPage('match');
  };

  const reset = () => {
    // Back to blank, not to the demo preset — Try Matching never had preset
    // data to return to (Phase 3).
    setMatchCohort(EMPTY_COHORT);
    setHasRun(false);
    setShowApplicantIntake(false);
    setShowAnimalIntake(false);
  };

  // The provenance line is PRD §3.1's "wherever the cohort appears" — with
  // two cohorts now, it describes whichever one the current page is
  // actually showing: the demo dataset on Explore Cohort, the visitor's own
  // build everywhere else (Home has no cohort content yet; Match/Evidence
  // both concern the dataset actually being matched).
  const provenanceCohort = page === 'cohort' ? demoCohort : matchCohort;

  return (
    <>
      <IconSprite />
      <NavBar
        page={page}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      />

      {/* Redesign Phase 3, §22: the same disclosure, made scannable. It was
          a justified full-width paragraph that read as boilerplate and got
          skipped; the badge is what a visitor actually registers, and PRD
          §3.1 needs this seen, not merely present. Layout moved to CSS.

          Polish Phase 6, audit F10 — NOT shown on Overview.

          It used to sit above the hero on every page, so the first thing a
          judge met was a compliance notice, before they knew what the
          product was. The fix is not to shrink it or move it down the page:
          PRD §3.1 asks for this disclosure "wherever the cohort appears",
          and no cohort appears on Overview. That page is presentational —
          no animals, no households, no counts, nothing drawn from the data.
          A disclaimer about data that is not on screen is not transparency,
          it is noise, and noise is what gets people to stop reading the
          notices that DO matter.

          It stays exactly as prominent on Cohort Demo, Matching and About,
          which are the three pages where cohort data is actually shown. */}
      {page === 'home' ? null : (
        <p className="provenance">
          <span className="provenance__badge">Simulated cohort</span>
          <span>
            {provenanceLabel(provenanceCohort)} {COHORT_SIZING_NOTE}
          </span>
        </p>
      )}

      {page === 'home' ? <HomePage onNavigate={navigate} /> : null}
      {page === 'cohort' ? (
        <CohortPage
          animals={demoCohort.animals}
          nextAnimalId={nextDemoAnimalId}
          onAddAnimal={addDemoAnimal}
          onRemoveAnimal={removeDemoAnimal}
          onResetDemo={resetDemoCohort}
          onRunCohort={runDemoCohortInMatch}
        />
      ) : null}
      {page === 'match' ? (
        <MatchPage
          cohort={matchCohort}
          outcome={outcome}
          onRun={() => setHasRun(true)}
          showAnimalIntake={showAnimalIntake}
          onToggleAnimalIntake={() => setShowAnimalIntake((v) => !v)}
          nextAnimalId={nextMatchAnimalId}
          onAddAnimal={addMatchAnimal}
          showIntake={showApplicantIntake}
          onToggleIntake={() => setShowApplicantIntake((v) => !v)}
          nextApplicantId={nextApplicantId}
          onAddApplicant={addApplicant}
          onReset={reset}
          onLoadDemo={loadDemoCohort}
          onNavigate={navigate}
          equityWeight={equityWeight}
          onEquityWeightChange={setEquityWeight}
          assumptionLevel={assumptionLevel}
          onAssumptionLevelChange={setAssumptionLevel}
        />
      ) : null}
      {page === 'evidence' ? <EvidencePage cohort={matchCohort} outcome={outcome} onNavigate={navigate} /> : null}

      <Footer />
    </>
  );
}
