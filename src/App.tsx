// App.tsx — thin router shell. Owns the shared state every page reads
// (cohort, match outcome, equity weight, assumption level) and switches
// between the four pages. No routing library: Architecture §2 restricts
// dependencies to React/Vite/TypeScript/Vitest/styling, so this is a plain
// state switch synced to location.hash — back/forward and reload still work,
// nothing new installed.
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

function pageFromHash(): Page {
  const hash = window.location.hash.replace('#', '');
  if (hash === 'cohort' || hash === 'match' || hash === 'evidence') return hash;
  return 'home';
}

export function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [cohort, setCohort] = useState<Cohort>(COHORT);
  const [hasRun, setHasRun] = useState(false);
  const [showApplicantIntake, setShowApplicantIntake] = useState(false);
  // Starts at 0 — PURE WANT — on purpose. The demo's hero beat (PRD §8 step 8)
  // is "slide the dial, Bruno matches", and Bruno is only unmatched below 0.30.
  const [equityWeight, setEquityWeight] = useState(0);
  const [assumptionLevel, setAssumptionLevel] = useState(ASSUMPTION_CONSERVATIVE);

  const outcome = useMemo(
    () => (hasRun ? compare(cohort, { equityWeight, assumptionLevel }) : null),
    [cohort, hasRun, equityWeight, assumptionLevel],
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

  const addApplicant = (applicant: Applicant) => {
    setCohort((previous) => ({
      animals: previous.animals,
      applicants: [...previous.applicants, applicant],
    }));
    setHasRun(false);
  };

  const addAnimal = (animal: Animal) => {
    setCohort((previous) => ({
      animals: [...previous.animals, animal],
      applicants: previous.applicants,
    }));
    setHasRun(false);
  };

  // Counting is not enough on its own: remove-then-add, or a preset id that
  // already looks generated, and the new record silently collides with an
  // existing one. Step past anything taken.
  const freeId = (prefix: string, taken: Set<string>) => {
    let n = taken.size + 1;
    while (taken.has(`${prefix}${String(n).padStart(2, '0')}`)) n += 1;
    return `${prefix}${String(n).padStart(2, '0')}`;
  };

  const nextApplicantId = freeId('p', new Set(cohort.applicants.map((a) => a.id)));
  const nextAnimalId = freeId('a', new Set(cohort.animals.map((a) => a.id)));

  const reset = () => {
    setCohort(COHORT);
    setHasRun(false);
    setShowApplicantIntake(false);
  };

  return (
    <>
      <IconSprite />
      <NavBar page={page} onNavigate={navigate} />

      {/* PRD §3.1 — provenance, derived from the data, wherever the cohort
          appears. Dynamic: the wording changes once the applicant survey has
          actually run (see provenanceLabel in data/cohort.ts) — never a
          static claim. */}
      <p className="provenance" style={{ margin: '0 auto', maxWidth: 'min(1180px, calc(100% - 40px))' }}>
        {provenanceLabel(cohort)} {COHORT_SIZING_NOTE}
      </p>

      {page === 'home' ? <HomePage onNavigate={navigate} /> : null}
      {page === 'cohort' ? (
        <CohortPage animals={cohort.animals} nextAnimalId={nextAnimalId} onAddAnimal={addAnimal} />
      ) : null}
      {page === 'match' ? (
        <MatchPage
          cohort={cohort}
          outcome={outcome}
          onRun={() => setHasRun(true)}
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
      {page === 'evidence' ? <EvidencePage cohort={cohort} outcome={outcome} onNavigate={navigate} /> : null}

      <Footer onNavigate={navigate} />
    </>
  );
}
