// WhyNotPanel — answers: "Why not the others?" (Architecture §8).
//
// P2. Pick any animal, see every household eliminated for it, by which
// constraint, with the citation that constraint carries. Computed live with
// the engine's own `evaluatePair` — nothing here re-implements a rule.

import { useState } from 'react';
import { evaluatePair, type Animal, type Applicant } from '../engine';
import { RESEARCH } from '../data/researchConstants';
import { StatusGlyph } from './StatusGlyph';

interface Props {
  animals: Animal[];
  applicants: Applicant[];
}

export function WhyNotPanel({ animals, applicants }: Props) {
  const [animalId, setAnimalId] = useState(animals[0]?.id ?? '');
  const animal = animals.find((a) => a.id === animalId);

  const eliminated = animal
    ? applicants
        .map((applicant) => ({ applicant, failures: evaluatePair(animal, applicant) }))
        .filter((entry) => entry.failures.length > 0)
    : [];
  const viableCount = applicants.length - eliminated.length;

  return (
    <section className="why-not" aria-label="WhyNotPanel">
      <h3 className="results__heading">Why not the others?</h3>

      <label className="why-not__picker">
        Animal
        <select value={animalId} onChange={(event) => setAnimalId(event.target.value)}>
          {animals.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>

      {animal !== undefined ? (
        <>
          <p className="results__note">
            {viableCount} of {applicants.length} households clear every hard constraint for{' '}
            {animal.name}; {eliminated.length} were eliminated.
          </p>

          <ul className="pairs">
            {eliminated.map(({ applicant, failures }) => (
              <li key={applicant.id} className="pair pair--unmatched">
                <div className="pair__head">
                  <strong>{applicant.name}</strong>
                  <span className="pair__tag">eliminated</span>
                </div>
                <ul className="pair__rationale pair__rationale--negative">
                  {failures.map((failure) => (
                    <li key={failure.constraintId}>
                      <StatusGlyph kind="fail" />
                      <span>
                        {failure.label} — {failure.preventsReturnCause} (
                        {RESEARCH[failure.citationKey].source})
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
