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
import { NavBar, type Page } from './components/NavBar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { CohortPage } from './components/CohortPage';
import { MatchPage } from './components/MatchPage';
import { EvidencePage } from './components/EvidencePage';
import './index.css';

const EMPTY_COHORT: Cohort = { animals: [], applicants: [] };

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
      <NavBar page={page} onNavigate={navigate} />

      <p className="provenance" style={{ margin: '1.5rem auto 0', maxWidth: 'min(1180px, calc(100% - 40px))' }}>
        {provenanceLabel(provenanceCohort)} {COHORT_SIZING_NOTE}
      </p>

      {page === 'home' ? <HomePage onNavigate={navigate} /> : null}
      {page === 'cohort' ? (
        <CohortPage
          animals={demoCohort.animals}
          nextAnimalId={nextDemoAnimalId}
          onAddAnimal={addDemoAnimal}
          onRemoveAnimal={removeDemoAnimal}
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
