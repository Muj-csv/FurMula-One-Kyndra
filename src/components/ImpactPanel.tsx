// ImpactPanel — answers: "What is this worth?" (Architecture §8).
//
// P2. STEP 8 in the engine (impact.ts) already computes two numbers that
// must NEVER be combined: effort saved (provable, ours) and projected
// welfare effect (a labelled projection, scaled by the assumption toggle).
// This component renders exactly what the engine hands back — no number
// here is invented in the UI layer.

import type { ImpactModel } from '../engine';
import { ASSUMPTION_CONSERVATIVE, ASSUMPTION_OPTIMISTIC } from '../engine';

interface Props {
  impact: ImpactModel;
  assumptionLevel: number;
  onAssumptionLevelChange: (value: number) => void;
}

export function ImpactPanel({ impact, assumptionLevel, onAssumptionLevelChange }: Props) {
  const isOptimistic = assumptionLevel >= (ASSUMPTION_CONSERVATIVE + ASSUMPTION_OPTIMISTIC) / 2;

  return (
    <section className="impact" aria-label="ImpactPanel">
      <h3 className="results__heading">What is this worth?</h3>
      <p className="impact__simulated">Simulated cohort — these numbers describe this run, not a measured shelter outcome.</p>

      <div className="impact__numbers">
        <div className="impact__number">
          <span className="impact__label">Effort saved this run</span>
          <span className="stat__value">{impact.effortSaved.pairwiseJudgementsAvoided}</span>
          <p className="results__note">{impact.effortSaved.note} Provable — no research constant needed.</p>
        </div>

        <div className="impact__number impact__number--projected">
          <span className="impact__label">Projected welfare effect</span>
          <span className="stat__value">
            {impact.projectedWelfare.projectedReturnsAverted.toFixed(1)}
          </span>
          <p className="results__note">
            returns averted, projected — which keeps an estimated{' '}
            <strong>{impact.projectedWelfare.projectedAdoptersRetained.toFixed(1)}</strong>{' '}
            adopters from being lost (~9 in 10 who return never adopt again).
          </p>

          <div className="impact__toggle">
            <button
              type="button"
              className={`button${isOptimistic ? '' : ' button--primary'}`}
              onClick={() => onAssumptionLevelChange(ASSUMPTION_CONSERVATIVE)}
            >
              Conservative ({ASSUMPTION_CONSERVATIVE})
            </button>
            <button
              type="button"
              className={`button${isOptimistic ? ' button--primary' : ''}`}
              onClick={() => onAssumptionLevelChange(ASSUMPTION_OPTIMISTIC)}
            >
              Optimistic ({ASSUMPTION_OPTIMISTIC})
            </button>
          </div>

          <p className="impact__caveat">{impact.projectedWelfare.caveat}</p>

          <details className="pair__constraints">
            <summary>Every constant this projection uses</summary>
            <ul>
              {impact.projectedWelfare.constants.map((constant) => (
                <li key={constant.label}>
                  {constant.label} — {constant.source}
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </section>
  );
}
