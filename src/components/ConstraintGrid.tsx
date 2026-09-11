// ConstraintGrid — answers: "How big is this really?" (Architecture §8).
//
// P2. Animals × applicants, green/red, in one image — the combinatorial
// scale a coordinator faces under time pressure. Every cell is computed with
// the engine's own `evaluatePair`; nothing here re-implements a constraint.
//
// Match quality is never encoded in colour alone (Architecture §8): every
// cell carries a glyph and a hover title, not just a colour.
//
// Redesign Phase 6, §24/§25/§27 — the reason used to live ONLY in the native
// `title` attribute, which never fires on a touch device and is inconsistent
// across screen readers and keyboard focus. Clicking (or pressing Enter/
// Space on) a cell now also pins the same reason into a persistent,
// aria-live status line below the grid, so tapping it on a phone or tabbing
// to it with a keyboard gets the same answer a mouse hover already did. The
// hover title stays, for desktop users who prefer it.

import { useState } from 'react';
import { evaluatePair, type Animal, type Applicant } from '../engine';

interface Props {
  animals: Animal[];
  applicants: Applicant[];
}

interface Selected {
  animalName: string;
  applicantName: string;
  viable: boolean;
  failures: string[];
}

export function ConstraintGrid({ animals, applicants }: Props) {
  const total = animals.length * applicants.length;
  let viableCount = 0;
  const [selected, setSelected] = useState<Selected | null>(null);

  return (
    <section className="grid-section" aria-label="ConstraintGrid">
      <h3 className="results__heading">How big is this really?</h3>
      <p className="results__note">
        {animals.length} animals × {applicants.length} households is {total} pairwise
        judgements. Green means every hard constraint clears; red means at least one
        eliminates the pair — click a cell for which one.
      </p>

      <div className="grid-wrap">
        <table className="constraint-grid">
          <thead>
            <tr>
              <th aria-hidden="true" />
              {applicants.map((applicant) => (
                <th key={applicant.id} className="constraint-grid__col" title={applicant.name}>
                  <span>{applicant.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {animals.map((animal) => (
              <tr key={animal.id}>
                <th className="constraint-grid__row" title={animal.name}>
                  {animal.name}
                </th>
                {applicants.map((applicant) => {
                  const failures = evaluatePair(animal, applicant);
                  const viable = failures.length === 0;
                  if (viable) viableCount += 1;
                  const title = viable
                    ? `${animal.name} × ${applicant.name}: every hard constraint clears.`
                    : `${animal.name} × ${applicant.name}: eliminated — ${failures[0]?.label}.`;
                  const select = () =>
                    setSelected({
                      animalName: animal.name,
                      applicantName: applicant.name,
                      viable,
                      failures: failures.map((failure) => failure.label),
                    });

                  return (
                    <td
                      key={applicant.id}
                      className={`constraint-grid__cell${viable ? ' constraint-grid__cell--ok' : ' constraint-grid__cell--blocked'}`}
                      title={title}
                      tabIndex={0}
                      role="button"
                      aria-label={title}
                      onClick={select}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          select();
                        }
                      }}
                    >
                      {viable ? '✓' : '✕'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="results__note" role="status" aria-live="polite">
        {selected === null ? (
          <>
            Click any cell above to see why it's eligible or not.
          </>
        ) : selected.viable ? (
          <>
            <strong>
              {selected.animalName} × {selected.applicantName}
            </strong>{' '}
            — every hard constraint clears.
          </>
        ) : (
          <>
            <strong>
              {selected.animalName} × {selected.applicantName}
            </strong>{' '}
            — eliminated: {selected.failures.join('; ')}.
          </>
        )}
      </p>

      <p className="results__note">
        {viableCount} of {total} pairs clear every hard constraint ({((viableCount / total) * 100 || 0).toFixed(0)}%).
      </p>
    </section>
  );
}
