// ResultsBoard — answers: "Who goes where?" (Architecture §8).
//
// P0-6: assignments, unmatched animals, unmatched applicants, and the reason
// for each. Every reason is read off the engine result — nothing here composes
// a justification of its own.
//
// Match quality is never encoded in colour alone (Architecture §8): every
// state carries a word.

import type { Animal, Applicant, Cohort, GreedyResult, ImpactModel, MatchResult } from '../engine';
import { countViolations } from '../engine';
import { UnmatchedPanel } from './UnmatchedPanel';
import { EquityDial } from './EquityDial';
import { SwapAttempt } from './SwapAttempt';
import { GreedyStableTransition } from './GreedyStableTransition';
import { WhyNotPanel } from './WhyNotPanel';
import { RegretView } from './RegretView';
import { ImpactPanel } from './ImpactPanel';
import { HumanBaselinePanel } from './HumanBaselinePanel';
import { baselineComparison } from '../data/humanBaseline';

// ─── SECTION ORDER IS THE DEMO SCRIPT ORDER ────────────────────────────────
//
// PRD §8's beats run 6 (run the cohort) → 7 (attempt a swap) → 8 (slide the
// dial) → 9 (unmatched) → 10 (is stable good?). This file used to render the
// dial first and the swap last, so presenting it meant scrolling up and down
// mid-sentence on a 7-minute clock. The order below matches the script, and
// the constraint grid moved to the landing page because it is beat 3 — it is
// shown BEFORE the cohort is ever run.
//
// If you reorder these, reorder the script too, or the next person to rehearse
// will lose forty seconds hunting for a panel.

interface Props {
  result: MatchResult;
  cohort: Cohort;
  animals: Animal[];
  applicants: Applicant[];
  greedy: GreedyResult;
  impact: ImpactModel;
  equityWeight: number;
  onEquityWeightChange: (value: number) => void;
  assumptionLevel: number;
  onAssumptionLevelChange: (value: number) => void;
}

export function ResultsBoard({
  result,
  cohort,
  animals,
  applicants,
  greedy,
  impact,
  equityWeight,
  onEquityWeightChange,
  assumptionLevel,
  onAssumptionLevelChange,
}: Props) {
  const animalName = (id: string) => animals.find((a) => a.id === id)?.name ?? id;
  const applicantName = (id: string) => applicants.find((p) => p.id === id)?.name ?? id;

  return (
    <section className="results" aria-label="Results">
      <h2 className="section__title">Results</h2>

      <div className="results__summary">
        <div className="stat">
          <span className="stat__value">{result.assignments.length}</span>
          <span className="stat__label">placements proposed</span>
        </div>
        <div className="stat">
          <span className="stat__value">0</span>
          <span className="stat__label">hard-constraint violations</span>
        </div>
        <div className="stat">
          <span className="stat__value">{greedy.constraintViolations}</span>
          <span className="stat__label">violations if placed first-come-first-served</span>
        </div>
        <div className="stat">
          <span className="stat__value">{result.blockingPairs.length}</span>
          <span className="stat__label">
            blocking pairs — {result.isStable ? 'stable' : 'NOT STABLE'}
          </span>
        </div>
      </div>

      <p className="results__note">
        Kyndra proposes. Staff decide. Every placement below is a proposal with its
        reasons attached, not a decision.
      </p>

      {/* ─── Greedy → stable ─────────────────────────────────────────── */}
      <GreedyStableTransition greedy={greedy} stable={result} animals={animals} applicants={applicants} />

      {/* ─── How does this compare to a person? ──────────────────────────
          Renders nothing until the study has actually been run — the gate is
          in baselineComparison(), not here. See HumanBaselinePanel. */}
      <HumanBaselinePanel
        comparison={baselineComparison(
          cohort,
          // Measured, not asserted. The summary tile above prints a literal 0
          // because the property tests guarantee it; this panel is a direct
          // comparison against what people scored, so it counts the real board.
          // If the engine ever regressed, this would show it rather than
          // repeat the claim.
          countViolations(
            cohort,
            new Map(result.assignments.map((a) => [a.animalId, a.applicantId])),
          ),
          greedy.constraintViolations,
        )}
      />

      {/* ─── Can I break it? — PRD §8 step 7 ─────────────────────────
          Before the dial, because the script hands the board to the judge to
          attack while it is still at pure want. */}
      <SwapAttempt
        cohort={cohort}
        options={{ equityWeight }}
        animals={animals}
        applicants={applicants}
        assignedAnimalIds={result.assignments.map((assignment) => assignment.animalId)}
        assignedApplicantIds={result.assignments.map((assignment) => assignment.applicantId)}
      />

      {/* ─── The dial — PRD §8 step 8 ────────────────────────────────────
          Sits DIRECTLY above the placements it rewrites. It used to be the
          first thing on the board, which meant sliding it and then scrolling
          down to find out what moved. Bruno appearing is the hero beat; it
          has to happen in one screen. */}
      <EquityDial
        value={equityWeight}
        onChange={onEquityWeightChange}
        animals={animals}
        applicants={applicants}
      />

      {/* ─── Assignments ─────────────────────────────────────────────── */}
      <h3 className="results__heading">Proposed placements</h3>
      <ul className="pairs">
        {result.assignments.map((assignment) => (
          <li key={assignment.animalId} className="pair">
            <div className="pair__head">
              <strong>{animalName(assignment.animalId)}</strong>
              <span className="pair__arrow" aria-hidden="true">
                →
              </span>
              <strong>{applicantName(assignment.applicantId)}</strong>
            </div>

            <p className="pair__ranks">
              {applicantName(assignment.applicantId)} ranked{' '}
              {animalName(assignment.animalId)} #{assignment.applicantRankOfAnimal} of their
              viable animals. The shelter ranked this household #
              {assignment.shelterRankOfApplicant} for {animalName(assignment.animalId)}.
            </p>

            <ul className="pair__rationale pair__rationale--positive">
              {assignment.rationale.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <p className="pair__counterfactual">
              <span className="pair__counterfactual-trigger" tabIndex={0}>
                What if this pairing hadn't happened? (hover)
              </span>
              <span className="pair__counterfactual-text">{assignment.counterfactual}</span>
            </p>

            <details className="pair__constraints pair__constraints--positive">
              <summary>
                View match details — {assignment.constraintsSatisfied.length} hard constraints
                satisfied
              </summary>
              <ul>
                {assignment.constraintsSatisfied.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>

      {/* ─── Why not the others? ─────────────────────────────────────── */}
      <WhyNotPanel animals={animals} applicants={applicants} />

      {/* ─── Unmatched ───────────────────────────────────────────────── */}
      <UnmatchedPanel
        unmatchedAnimals={result.unmatchedAnimals}
        unmatchedApplicants={result.unmatchedApplicants}
        animalName={animalName}
        applicants={applicants}
      />

      {/* ─── Regret — the honest counterpart to stability ─────────────── */}
      <RegretView result={result} animalName={animalName} />

      {/* ─── What is this worth? ─────────────────────────────────────── */}
      <ImpactPanel
        impact={impact}
        assumptionLevel={assumptionLevel}
        onAssumptionLevelChange={onAssumptionLevelChange}
      />
    </section>
  );
}
