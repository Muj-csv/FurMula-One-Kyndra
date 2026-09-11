// UnmatchedPanel — answers: "Who did this fail, and what now?" (Architecture §8).
//
// P1-6. Every reason and every recruitment profile is read off the engine
// result — this component composes no justification of its own.

import type { Applicant, UnmatchedAnimal } from '../engine';
import { StatusGlyph } from './StatusGlyph';

interface Props {
  unmatchedAnimals: UnmatchedAnimal[];
  unmatchedApplicants: { id: string; reason: string }[];
  animalName: (id: string) => string;
  applicants: Applicant[];
}

export function UnmatchedPanel({
  unmatchedAnimals,
  unmatchedApplicants,
  animalName,
  applicants,
}: Props) {
  const applicantName = (id: string) => applicants.find((p) => p.id === id)?.name ?? id;

  return (
    <section className="unmatched" aria-label="UnmatchedPanel">
      <h3 className="results__heading">
        Animals this cohort could not place ({unmatchedAnimals.length})
      </h3>
      {unmatchedAnimals.length === 0 ? (
        <p className="results__note">Every animal in this cohort was placed.</p>
      ) : (
        <ul className="pairs">
          {unmatchedAnimals.map((unmatched) => (
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
              <p className="pair__counterfactual">
                Recruitment profile: {unmatched.recruitmentProfile}
              </p>
              <details className="pair__constraints">
                <summary>Which constraint eliminated each household</summary>
                <ul className="pair__rationale--negative">
                  {unmatched.blockedBy.map((blocked) => (
                    <li key={blocked.applicantId}>
                      <StatusGlyph kind="fail" />
                      <span>
                        {applicantName(blocked.applicantId)} — {blocked.failedConstraint}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ul>
      )}

      <h3 className="results__heading">
        Households not placed this round ({unmatchedApplicants.length})
      </h3>
      {unmatchedApplicants.length === 0 ? (
        <p className="results__note">Every household in this cohort was placed.</p>
      ) : (
        <ul className="pairs">
          {unmatchedApplicants.map((unmatched) => (
            <li key={unmatched.id} className="pair pair--unmatched">
              <div className="pair__head">
                <strong>{applicantName(unmatched.id)}</strong>
              </div>
              <p className="pair__ranks">{unmatched.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
