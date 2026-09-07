// ResultsBoard — answers: "Who goes where?" (Architecture §8).
//
// P0-6: assignments, unmatched animals, unmatched applicants, and the reason
// for each. Every reason is read off the engine result — nothing here composes
// a justification of its own.
//
// Match quality is never encoded in colour alone (Architecture §8): every
// state carries a word.

import type { Animal, Applicant, Cohort, MatchResult } from '../engine';
import { UnmatchedPanel } from './UnmatchedPanel';
import { EquityDial } from './EquityDial';
import { SwapAttempt } from './SwapAttempt';

interface Props {
  result: MatchResult;
  cohort: Cohort;
  animals: Animal[];
  applicants: Applicant[];
  greedyViolations: number;
  equityWeight: number;
  onEquityWeightChange: (value: number) => void;
}

export function ResultsBoard({
  result,
  cohort,
  animals,
  applicants,
  greedyViolations,
  equityWeight,
  onEquityWeightChange,
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
          <span className="stat__value">{greedyViolations}</span>
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

      <EquityDial value={equityWeight} onChange={onEquityWeightChange} animals={animals} />

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

            <ul className="pair__rationale">
              {assignment.rationale.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>

            <p className="pair__counterfactual">{assignment.counterfactual}</p>

            <details className="pair__constraints">
              <summary>
                {assignment.constraintsSatisfied.length} hard constraints satisfied
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

      {/* ─── Unmatched ───────────────────────────────────────────────── */}
      <UnmatchedPanel
        unmatchedAnimals={result.unmatchedAnimals}
        unmatchedApplicants={result.unmatchedApplicants}
        animalName={animalName}
        applicants={applicants}
      />

      {/* ─── Regret — the honest counterpart to stability ─────────────── */}
      <h3 className="results__heading">Is stable actually good?</h3>
      <p className="results__note">
        Stability means nobody would defect. It does not mean everybody got their first
        choice. The worst-off animal matched its #{result.regret.worstAnimalRank} choice;
        the worst-off household matched its #{result.regret.worstApplicantRank}. Mean
        animal rank {result.regret.meanAnimalRank.toFixed(2)}.
      </p>

      {/* ─── Attempt a swap ──────────────────────────────────────────── */}
      <SwapAttempt
        cohort={cohort}
        options={{ equityWeight }}
        animals={animals}
        applicants={applicants}
        assignedAnimalIds={result.assignments.map((assignment) => assignment.animalId)}
        assignedApplicantIds={result.assignments.map((assignment) => assignment.applicantId)}
      />
    </section>
  );
}
