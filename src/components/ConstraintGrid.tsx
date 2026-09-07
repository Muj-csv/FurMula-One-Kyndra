// ConstraintGrid — answers: "How big is this really?" (Architecture §8).
//
// P2. Animals × applicants, green/red, in one image — the combinatorial
// scale a coordinator faces under time pressure. Every cell is computed with
// the engine's own `evaluatePair`; nothing here re-implements a constraint.
//
// Match quality is never encoded in colour alone (Architecture §8): every
// cell carries a glyph and a hover title, not just a colour.

import { evaluatePair, type Animal, type Applicant } from '../engine';

interface Props {
  animals: Animal[];
  applicants: Applicant[];
}

export function ConstraintGrid({ animals, applicants }: Props) {
  const total = animals.length * applicants.length;
  let viableCount = 0;

  return (
    <section className="grid-section" aria-label="ConstraintGrid">
      <h3 className="results__heading">How big is this really?</h3>
      <p className="results__note">
        {animals.length} animals × {applicants.length} households is {total} pairwise
        judgements. Green means every hard constraint clears; red means at least one
        eliminates the pair — hover a cell for which one.
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

                  return (
                    <td
                      key={applicant.id}
                      className={`constraint-grid__cell${viable ? ' constraint-grid__cell--ok' : ' constraint-grid__cell--blocked'}`}
                      title={title}
                      tabIndex={0}
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

      <p className="results__note">
        {viableCount} of {total} pairs clear every hard constraint ({((viableCount / total) * 100 || 0).toFixed(0)}%).
      </p>
    </section>
  );
}
