// ResultsBoard — answers: "Who goes where?" (Architecture §8).
//
// P0-6: assignments, unmatched animals, unmatched applicants, and the reason
// for each. Every reason is read off the engine result — nothing here composes
// a justification of its own.
//
// Match quality is never encoded in colour alone (Architecture §8): every
// state carries a word.

import type { Animal, Applicant, MatchResult } from '../engine';

interface Props {
  result: MatchResult;
  animals: Animal[];
  applicants: Applicant[];
  greedyViolations: number;
}

export function ResultsBoard({ result, animals, applicants, greedyViolations }: Props) {
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

      {/* ─── Unmatched animals ───────────────────────────────────────── */}
      <h3 className="results__heading">
        Animals this cohort could not place ({result.unmatchedAnimals.length})
      </h3>
      {result.unmatchedAnimals.length === 0 ? (
        <p className="results__note">Every animal in this cohort was placed.</p>
      ) : (
        <ul className="pairs">
          {result.unmatchedAnimals.map((unmatched) => (
            <li key={unmatched.animalId} className="pair pair--unmatched">
              <div className="pair__head">
                <strong>{animalName(unmatched.animalId)}</strong>
                <span className="pair__tag">unmatched</span>
              </div>
              <p className="pair__ranks">
                {unmatched.blockedBy.length} household
                {unmatched.blockedBy.length === 1 ? '' : 's'} were eliminated by a hard
                constraint.
              </p>
              <p className="pair__counterfactual">{unmatched.recruitmentProfile}</p>
              <details className="pair__constraints">
                <summary>Which constraint eliminated each household</summary>
                <ul>
                  {unmatched.blockedBy.map((blocked) => (
                    <li key={blocked.applicantId}>
                      {applicantName(blocked.applicantId)} — {blocked.failedConstraint}
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}

      {/* ─── Unmatched applicants ────────────────────────────────────── */}
      <h3 className="results__heading">
        Households not placed this round ({result.unmatchedApplicants.length})
      </h3>
      <ul className="pairs">
        {result.unmatchedApplicants.map((unmatched) => (
          <li key={unmatched.id} className="pair pair--unmatched">
            <div className="pair__head">
              <strong>{applicantName(unmatched.id)}</strong>
            </div>
            <p className="pair__ranks">{unmatched.reason}</p>
          </li>
        ))}
      </ul>

      {/* ─── Regret — the honest counterpart to stability ─────────────── */}
      <h3 className="results__heading">Is stable actually good?</h3>
      <p className="results__note">
        Stability means nobody would defect. It does not mean everybody got their first
        choice. The worst-off animal matched its #{result.regret.worstAnimalRank} choice;
        the worst-off household matched its #{result.regret.worstApplicantRank}. Mean
        animal rank {result.regret.meanAnimalRank.toFixed(2)}.
      </p>
    </section>
  );
}
