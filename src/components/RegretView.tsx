// RegretView — answers: "Is stable actually good?" (Architecture §8).
//
// P2. Stability means nobody would defect. It does not mean everybody got
// their first choice. Every number here is read off `result.regret` and
// `result.assignments` — nothing is computed fresh in the UI layer.

import type { MatchResult } from '../engine';

interface Props {
  result: MatchResult;
  animalName: (id: string) => string;
}

export function RegretView({ result, animalName }: Props) {
  const ranked = [...result.assignments].sort(
    (a, b) => b.applicantRankOfAnimal - a.applicantRankOfAnimal,
  );
  const worst = ranked[0];
  const firstChoiceCount = result.assignments.filter((a) => a.applicantRankOfAnimal === 1).length;

  return (
    <section className="regret" aria-label="RegretView">
      <h3 className="results__heading">Is stable actually good?</h3>
      <p className="results__note">
        Stability means nobody would defect. It does not mean everybody got their first
        choice.
      </p>

      <div className="results__summary">
        <div className="stat">
          <span className="stat__value">{result.regret.worstAnimalRank || '—'}</span>
          <span className="stat__label">worst matched rank, animal side</span>
        </div>
        <div className="stat">
          <span className="stat__value">{result.regret.worstApplicantRank || '—'}</span>
          <span className="stat__label">worst matched rank, household side</span>
        </div>
        <div className="stat">
          <span className="stat__value">{result.regret.meanAnimalRank.toFixed(2)}</span>
          <span className="stat__label">mean matched rank, animal side</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {firstChoiceCount}/{result.assignments.length}
          </span>
          <span className="stat__label">animals matched to their #1 choice</span>
        </div>
      </div>

      {worst !== undefined && worst.applicantRankOfAnimal > 1 ? (
        <p className="results__note">
          The worst-off animal was {animalName(worst.animalId)}, matched its #
          {worst.applicantRankOfAnimal} choice of viable households — still stable, because
          no pair on this board would rather have each other than what they got.
        </p>
      ) : null}
    </section>
  );
}
