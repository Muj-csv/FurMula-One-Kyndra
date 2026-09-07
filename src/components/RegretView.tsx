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
  // ANIMAL SIDE. `shelterRankOfApplicant` is where the ANIMAL ranked the
  // household it got; `applicantRankOfAnimal` is the mirror — where the
  // HOUSEHOLD ranked the animal. Every tile and sentence below is labelled
  // animal side, so every one of them must read the former.
  //
  // Reading the latter is what made this panel print "worst matched rank,
  // animal side: 12" directly above "the worst-off animal ... matched its #5
  // choice" — two numbers about the same thing, disagreeing in public, on the
  // one panel whose whole job is being honest about match quality.
  //
  // engine.test.ts pins max(shelterRankOfApplicant) === regret.worstAnimalRank,
  // so the headline tile and this sentence cannot drift apart again.
  const ranked = [...result.assignments].sort(
    (a, b) => b.shelterRankOfApplicant - a.shelterRankOfApplicant,
  );
  const worst = ranked[0];
  const firstChoiceCount = result.assignments.filter(
    (a) => a.shelterRankOfApplicant === 1,
  ).length;

  // The household-side mirror. Worth showing rather than dropping: this panel
  // already pairs the two sides for "worst matched rank", and the two first-
  // choice figures are very far apart — the animals mostly do NOT get their
  // top-ranked household, while most households DO get their top-ranked animal.
  // That asymmetry is the honest shape of an animal-proposing match over
  // incomplete lists, and hiding the half that flatters us would be the same
  // mistake in the other direction.
  const householdFirstChoiceCount = result.assignments.filter(
    (a) => a.applicantRankOfAnimal === 1,
  ).length;

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
        <div className="stat">
          <span className="stat__value">
            {householdFirstChoiceCount}/{result.assignments.length}
          </span>
          <span className="stat__label">households matched to their #1 choice</span>
        </div>
      </div>

      {worst !== undefined && worst.shelterRankOfApplicant > 1 ? (
        <p className="results__note">
          The worst-off animal was {animalName(worst.animalId)}, matched its #
          {worst.shelterRankOfApplicant} choice of viable households — still stable, because
          no pair on this board would rather have each other than what they got.
        </p>
      ) : null}

      <p className="results__note">
        The two first-choice figures are meant to be read against each other. Animals
        propose here, so a household that receives a proposal is being asked by an animal
        that already ranked it — most households end up with the animal they wanted most,
        while most animals settle further down their own list. Stability is a guarantee
        that nobody would defect, not a promise that everybody won.
      </p>
    </section>
  );
}
