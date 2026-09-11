// SwapAttempt — answers: "Can I break it?" (Architecture §8).
//
// P1-4. A judge picks an animal and a household who are not currently matched
// to each other and asks whether they would rather be. The same evaluator that
// powers stability verification (engine/stability.ts) answers — this is not a
// separate, weaker check.

import { useState } from 'react';
import { attemptSwap, type Animal, type Applicant, type Cohort, type MatchOptions } from '../engine';
import { StatusGlyph } from './StatusGlyph';

interface Props {
  cohort: Cohort;
  options: MatchOptions;
  animals: Animal[];
  applicants: Applicant[];
  assignedAnimalIds: string[];
  assignedApplicantIds: string[];
}

export function SwapAttempt({
  cohort,
  options,
  animals,
  applicants,
  assignedAnimalIds,
  assignedApplicantIds,
}: Props) {
  const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));
  const animalsById = byId(animals);
  const applicantsById = byId(applicants);

  const [animalId, setAnimalId] = useState(assignedAnimalIds[0] ?? '');
  const [applicantId, setApplicantId] = useState(
    assignedApplicantIds.find((id) => id !== assignedApplicantIds[0]) ??
      assignedApplicantIds[1] ??
      assignedApplicantIds[0] ??
      '',
  );
  const [verdict, setVerdict] = useState<{ succeeds: boolean; reason: string } | null>(null);

  if (assignedAnimalIds.length < 2 || assignedApplicantIds.length < 2) {
    return (
      <section className="swap" aria-label="SwapAttempt">
        <h3 className="results__heading">Can I break it?</h3>
        <p className="results__note">
          This cohort placed fewer than two households — there is no second pairing to try
          reshuffling against.
        </p>
      </section>
    );
  }

  const run = () => {
    if (animalId === '' || applicantId === '') return;
    setVerdict(attemptSwap(cohort, options, animalId, applicantId));
  };

  return (
    <section className="swap" aria-label="SwapAttempt">
      <h3 className="results__heading">Can I break it?</h3>
      <p className="results__note">
        Pick a placed animal and a placed household who are not matched to each other. If
        they would both rather have each other than what they have, the assignment is not
        stable — try it and see.
      </p>

      <div className="swap__row">
        <label>
          Animal
          <select value={animalId} onChange={(event) => setAnimalId(event.target.value)}>
            {assignedAnimalIds.map((id) => (
              <option key={id} value={id}>
                {animalsById.get(id)?.name ?? id}
              </option>
            ))}
          </select>
        </label>

        <label>
          Household
          <select value={applicantId} onChange={(event) => setApplicantId(event.target.value)}>
            {assignedApplicantIds.map((id) => (
              <option key={id} value={id}>
                {applicantsById.get(id)?.name ?? id}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="button" onClick={run}>
          Attempt swap
        </button>
      </div>

      {verdict !== null ? (
        // Redesign Phase 5, §18 — "never rely only on colour": an icon and a
        // literal label ("Swap works"/"Swap blocked") both carry the verdict,
        // not just the tint.
        <p className={`swap__verdict${verdict.succeeds ? ' swap__verdict--succeeds' : ''}`}>
          <StatusGlyph kind={verdict.succeeds ? 'fail' : 'ok'} />
          <strong>{verdict.succeeds ? 'Swap works — not stable: ' : 'Swap blocked — stable: '}</strong>
          {verdict.reason}
        </p>
      ) : null}
    </section>
  );
}
