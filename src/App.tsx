// P0 end-to-end flow: cohort → intake → derive → match → results.
//
// Architecture §8: a preset button loads the cohort in one click. Never type
// during the presentation. The intake form exists and works, but the demo path
// must not depend on it.
//
// The UI never reaches into engine internals — it calls runMatch() and reads
// the result. That is the whole contract (Architecture §3).

import { useMemo, useState } from 'react';
import { ASSUMPTION_CONSERVATIVE, compare, type Applicant, type Cohort } from './engine';
import { COHORT, provenanceLabel } from './data/cohort';
import { RESEARCH, COHORT_SIZING_NOTE } from './data/researchConstants';
import { AnimalWall } from './components/AnimalWall';
import { ApplicantIntake } from './components/ApplicantIntake';
import { JudgeChallenge } from './components/JudgeChallenge';
import { ResultsBoard } from './components/ResultsBoard';
import './index.css';

export function App() {
  const [cohort, setCohort] = useState<Cohort>(COHORT);
  const [hasRun, setHasRun] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [equityWeight, setEquityWeight] = useState(0.5);
  const [assumptionLevel, setAssumptionLevel] = useState(ASSUMPTION_CONSERVATIVE);

  const outcome = useMemo(
    () => (hasRun ? compare(cohort, { equityWeight, assumptionLevel }) : null),
    [cohort, hasRun, equityWeight, assumptionLevel],
  );

  const addApplicant = (applicant: Applicant) => {
    setCohort((previous) => ({
      animals: previous.animals,
      applicants: [...previous.applicants, applicant],
    }));
    setHasRun(false);
  };

  const reset = () => {
    setCohort(COHORT);
    setHasRun(false);
    setShowIntake(false);
  };

  const nextId = `p${String(cohort.applicants.length + 1).padStart(2, '0')}`;

  return (
    <main className="shell">
      <header className="shell__header">
        <h1>Kyndra</h1>
        <p className="shell__tagline">Where the right homes meet the right animals.</p>
      </header>

      {/* PRD §3.1 — provenance, derived from the data, wherever the cohort appears. */}
      <p className="provenance">
        {provenanceLabel(cohort)} {COHORT_SIZING_NOTE}
      </p>

      <section className="shell__status">
        <p>
          <strong>{RESEARCH.dogReturnRate.label}.</strong>{' '}
          {RESEARCH.behaviouralShareOfReturns.label};{' '}
          {RESEARCH.householdPetConflictShare.label}. These are compatibility failures,
          not bad luck — and {RESEARCH.readoptionRate.label.toLowerCase()}.
        </p>
        <p className="shell__note">
          {RESEARCH.dogReturnRate.source} · {RESEARCH.readoptionRate.source}
        </p>
      </section>

      <div className="actions">
        <button type="button" className="button button--primary" onClick={() => setHasRun(true)}>
          Run this cohort
        </button>
        <button type="button" className="button" onClick={() => setShowIntake((v) => !v)}>
          {showIntake ? 'Hide intake' : 'Add a household'}
        </button>
        <button type="button" className="button" onClick={reset}>
          Reset to preset cohort
        </button>
      </div>

      <p className="shell__note">
        {cohort.animals.length} animals · {cohort.applicants.length} households ·{' '}
        {cohort.animals.length * cohort.applicants.length} pairwise judgements to make by
        hand
      </p>

      {showIntake ? (
        <ApplicantIntake animals={cohort.animals} nextId={nextId} onSubmit={addApplicant} />
      ) : null}

      {outcome === null ? (
        <>
          <JudgeChallenge animals={cohort.animals} applicants={cohort.applicants} />
          <AnimalWall animals={cohort.animals} title="Who is waiting" />
        </>
      ) : (
        <ResultsBoard
          result={outcome.stable}
          cohort={cohort}
          animals={cohort.animals}
          applicants={cohort.applicants}
          greedy={outcome.greedy}
          impact={outcome.impact}
          equityWeight={equityWeight}
          onEquityWeightChange={setEquityWeight}
          assumptionLevel={assumptionLevel}
          onAssumptionLevelChange={setAssumptionLevel}
        />
      )}
    </main>
  );
}
