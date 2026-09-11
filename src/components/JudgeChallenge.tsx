// JudgeChallenge — answers: "Can you do this?" (Architecture §8).
//
// PRD §8 demo script, 0:30: "Hand it to the judge. 'Place these four
// animals. Two-minute timer.' Let them try." — the strongest opening
// available, run before the judge has seen any engine output.
//
// Scoring reuses the engine's own evaluatePair — the same check that later
// eliminates a pair in STEP 1 — so "what you got wrong" is never a separate,
// softer rule from what Kyndra itself enforces.

import { useEffect, useState } from 'react';
import { evaluatePair, type Animal, type Applicant } from '../engine';
import { RESEARCH } from '../data/researchConstants';
import { StatusGlyph } from './StatusGlyph';

const CHALLENGE_SIZE = 4;
const TIMER_SECONDS = 120;

interface Props {
  animals: Animal[];
  applicants: Applicant[];
}

type Status = 'idle' | 'running' | 'revealed';

export function JudgeChallenge({ animals, applicants }: Props) {
  const challengeAnimals = animals.slice(0, CHALLENGE_SIZE);

  const [status, setStatus] = useState<Status>('idle');
  const [secondsLeft, setSecondsLeft] = useState(TIMER_SECONDS);
  const [placements, setPlacements] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status !== 'running') return;
    if (secondsLeft <= 0) {
      setStatus('revealed');
      return;
    }
    const timeout = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [status, secondsLeft]);

  const start = () => {
    setPlacements({});
    setSecondsLeft(TIMER_SECONDS);
    setStatus('running');
  };

  const reveal = () => setStatus('revealed');

  const reset = () => {
    setPlacements({});
    setSecondsLeft(TIMER_SECONDS);
    setStatus('idle');
  };

  const place = (animalId: string, applicantId: string) => {
    setPlacements((previous) => {
      const next = { ...previous };
      if (applicantId === '') delete next[animalId];
      else next[animalId] = applicantId;
      return next;
    });
  };

  const placedCount = Object.keys(placements).length;

  const scored = challengeAnimals.map((animal) => {
    const applicant = applicants.find((p) => p.id === placements[animal.id]);
    const failures = applicant !== undefined ? evaluatePair(animal, applicant) : [];
    return { animal, applicant, failures };
  });
  const correctCount = scored.filter(
    (entry) => entry.applicant !== undefined && entry.failures.length === 0,
  ).length;

  return (
    <section className="challenge" aria-label="JudgeChallenge">
      <h2 className="section__title">Can you do this?</h2>
      <p className="results__note">
        Place these {challengeAnimals.length} animals with the household you think fits
        best. Two-minute timer, like a coordinator would have on a Saturday. Then see what
        you got wrong.
      </p>

      {status === 'idle' ? (
        <button type="button" className="button button--primary" onClick={start}>
          Start the timer
        </button>
      ) : null}

      {status === 'running' ? (
        <p className="challenge__timer">
          {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} remaining ·{' '}
          {placedCount}/{challengeAnimals.length} placed
        </p>
      ) : null}

      <ul className="pairs">
        {scored.map(({ animal, applicant, failures }) => (
          <li key={animal.id} className="pair">
            <div className="pair__head">
              <strong>{animal.name}</strong>
              <span className="pair__arrow" aria-hidden="true">
                →
              </span>
              {status === 'idle' || status === 'running' ? (
                <select
                  value={placements[animal.id] ?? ''}
                  onChange={(event) => place(animal.id, event.target.value)}
                  disabled={status === 'idle'}
                >
                  <option value="">— choose a household —</option>
                  {applicants.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              ) : (
                <strong>{applicant?.name ?? 'not placed in time'}</strong>
              )}
            </div>

            {status === 'revealed' && applicant !== undefined ? (
              failures.length === 0 ? (
                <p className="challenge__verdict challenge__verdict--ok">
                  Clears every hard constraint.
                </p>
              ) : (
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
              )
            ) : null}

            {status === 'revealed' && applicant === undefined ? (
              <p className="challenge__verdict">
                Not placed before time ran out — real coordinators run out of time too.
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      {status === 'running' ? (
        <button type="button" className="button" onClick={reveal}>
          Reveal what you got wrong
        </button>
      ) : null}

      {status === 'revealed' ? (
        <>
          <p className="results__note">
            {correctCount} of {challengeAnimals.length} placements cleared every hard
            constraint. {RESEARCH.dogReturnRate.label} — this is the failure mode that
            causes it.
          </p>
          <button type="button" className="button" onClick={reset}>
            Try again
          </button>
        </>
      ) : null}
    </section>
  );
}
