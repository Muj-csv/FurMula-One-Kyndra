// P0 end-to-end flow: cohort → intake → derive → match → results.
//
// Architecture §8: a preset button loads the cohort in one click. Never type
// during the presentation. The intake form exists and works, but the demo path
// must not depend on it.
//
// The UI never reaches into engine internals — it calls runMatch() and reads
// the result. That is the whole contract (Architecture §3).

import { useMemo, useState } from 'react';
import { ASSUMPTION_CONSERVATIVE, compare, type Animal, type Applicant, type Cohort } from './engine';
import { COHORT, provenanceLabel } from './data/cohort';
import { RESEARCH, COHORT_SIZING_NOTE } from './data/researchConstants';
import { AnimalWall } from './components/AnimalWall';
import { ConstraintGrid } from './components/ConstraintGrid';
import { ThroughLine } from './components/ThroughLine';
import { AnimalIntake } from './components/AnimalIntake';
import { ApplicantIntake } from './components/ApplicantIntake';
import { JudgeChallenge } from './components/JudgeChallenge';
import { ResultsBoard } from './components/ResultsBoard';
import './index.css';

export function App() {
  const [cohort, setCohort] = useState<Cohort>(COHORT);
  const [hasRun, setHasRun] = useState(false);
  const [showIntake, setShowIntake] = useState(false);
  const [showAnimalIntake, setShowAnimalIntake] = useState(false);
  // Starts at 0 — PURE WANT — on purpose. The demo's hero beat (PRD §8 step 8)
  // is "slide the dial, Bruno matches", and Bruno is only unmatched below 0.30.
  // Defaulting to 0.5 meant the judge's very first board already had him placed
  // and there was nothing left to reveal. It is also the more honest default:
  // no equity thumb on the scale until someone deliberately asks for one.
  const [equityWeight, setEquityWeight] = useState(0);
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

  const addAnimal = (animal: Animal) => {
    setCohort((previous) => ({
      animals: [...previous.animals, animal],
      applicants: previous.applicants,
    }));
    setHasRun(false);
  };

  const reset = () => {
    setCohort(COHORT);
    setHasRun(false);
    setShowIntake(false);
    setShowAnimalIntake(false);
  };

  // Counting is not enough on its own: remove-then-add, or a preset id that
  // already looks generated, and the new record silently collides with an
  // existing one. A duplicate id would put two different animals in the same
  // Map key inside the engine and quietly corrupt the board, so step past
  // anything taken.
  const freeId = (prefix: string, taken: Set<string>) => {
    let n = taken.size + 1;
    while (taken.has(`${prefix}${String(n).padStart(2, '0')}`)) n += 1;
    return `${prefix}${String(n).padStart(2, '0')}`;
  };

  const nextId = freeId('p', new Set(cohort.applicants.map((a) => a.id)));
  const nextAnimalId = freeId('a', new Set(cohort.animals.map((a) => a.id)));

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

      {/* ─── PRD §8 beat 1 ───────────────────────────────────────────────
          One animal, one sentence, before anything else on the page. The demo
          opens here and closes here (step 11), so this cannot be the seventh
          thing a judge scrolls past. Only rendered on the landing state — once
          the board is up, the board is the subject. */}
      {outcome === null ? (
        <ThroughLine animals={cohort.animals} applicants={cohort.applicants} />
      ) : null}

      <div className="actions">
        <button type="button" className="button button--primary" onClick={() => setHasRun(true)}>
          Run this cohort
        </button>
        <button
          type="button"
          className="button"
          onClick={() => {
            setShowAnimalIntake((v) => !v);
            setShowIntake(false);
          }}
        >
          {showAnimalIntake ? 'Hide animal form' : 'Add an animal'}
        </button>
        <button
          type="button"
          className="button"
          onClick={() => {
            setShowIntake((v) => !v);
            setShowAnimalIntake(false);
          }}
        >
          {showIntake ? 'Hide household form' : 'Add a household'}
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

      {showAnimalIntake ? (
        <AnimalIntake nextId={nextAnimalId} onSubmit={addAnimal} />
      ) : null}

      {showIntake ? (
        <ApplicantIntake animals={cohort.animals} nextId={nextId} onSubmit={addApplicant} />
      ) : null}

      {outcome === null ? (
        <>
          {/* PRD §8 beats 2 and 3, in order: the judge tries it by hand, then
              sees the size of what they just attempted. The grid lived inside
              the results board, which meant it could only be shown AFTER the
              cohort had been run — the opposite of what the script does with
              it. It is the argument for why hand-matching fails, so it has to
              land before the machine has answered anything. */}
          <JudgeChallenge animals={cohort.animals} applicants={cohort.applicants} />
          <ConstraintGrid animals={cohort.animals} applicants={cohort.applicants} />

          {/* PRD §8 beat 4 — the stakes, AFTER the judge has failed at it by
              hand and seen the scale. Leading with the statistics asks someone
              to care about a percentage before they have met an animal or
              understood the problem; this way the number lands as the
              explanation for what they just experienced. */}
          <section className="shell__status">
            <p>
              <strong>{RESEARCH.dogReturnRate.label}.</strong>{' '}
              {RESEARCH.behaviouralShareOfReturns.label};{' '}
              {RESEARCH.householdPetConflictShare.label}. These are compatibility
              failures, not bad luck — and {RESEARCH.readoptionRate.label.toLowerCase()}.
            </p>
            <p className="shell__note">
              {RESEARCH.dogReturnRate.source} · {RESEARCH.readoptionRate.source}
            </p>
          </section>

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
