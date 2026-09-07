// The greedy→stable transition — Architecture §8's ResultsBoard row: "cards
// move, violation badges vanish." CSS transitions only, per Architecture §2
// ("the greedy→stable transition needs no library").
//
// Both panels are always mounted, stacked in the same grid cell, and
// cross-fade via opacity/transform — so a violation badge doesn't just
// disappear, it visibly fades out as the stable panel fades in.

import { useState } from 'react';
import type { Animal, Applicant, GreedyResult, MatchResult } from '../engine';

interface Props {
  greedy: GreedyResult;
  stable: MatchResult;
  animals: Animal[];
  applicants: Applicant[];
}

export function GreedyStableTransition({ greedy, stable, animals, applicants }: Props) {
  const [revealed, setRevealed] = useState(false);
  const animalName = (id: string) => animals.find((a) => a.id === id)?.name ?? id;
  const applicantName = (id: string) => applicants.find((p) => p.id === id)?.name ?? id;

  const violatingKeys = new Set(
    greedy.violatingPairs.map((pair) => `${pair.animalId}/${pair.applicantId}`),
  );

  return (
    <section className="transition" aria-label="GreedyStableTransition">
      <h3 className="results__heading">Watch it happen</h3>
      <p className="results__note">
        First-come-first-served, the way a coordinator matches under time pressure — then
        the same cohort, stabilised.
      </p>

      <button type="button" className="button button--primary" onClick={() => setRevealed((v) => !v)}>
        {revealed ? 'Show first-come-first-served again' : 'Reveal the stable assignment'}
      </button>

      <div className="transition__stage">
        <div className={`transition__panel${!revealed ? ' transition__panel--active' : ''}`}>
          <p className="transition__caption">
            First-come-first-served — {greedy.constraintViolations} hard-constraint violation
            {greedy.constraintViolations === 1 ? '' : 's'}
          </p>
          <ul className="transition__pairs">
            {[...greedy.matching.entries()].map(([animalId, applicantId]) => (
              <li key={animalId} className="transition__pair">
                <span>{animalName(animalId)}</span>
                <span aria-hidden="true"> → </span>
                <span>{applicantName(applicantId)}</span>
                {violatingKeys.has(`${animalId}/${applicantId}`) ? (
                  <span className="transition__badge">violates a hard constraint</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>

        <div className={`transition__panel${revealed ? ' transition__panel--active' : ''}`}>
          <p className="transition__caption">Stable assignment — 0 hard-constraint violations</p>
          <ul className="transition__pairs">
            {stable.assignments.map((assignment) => (
              <li key={assignment.animalId} className="transition__pair">
                <span>{animalName(assignment.animalId)}</span>
                <span aria-hidden="true"> → </span>
                <span>{applicantName(assignment.applicantId)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
