// HumanBaselinePanel — answers: "How does this compare to a person?" (PRD P1-2).
//
// The claim this panel exists to make, from PRD §5:
//
//   "Five people placed this cohort by hand. They averaged N violations.
//    Kyndra produces zero, provably."
//
// ─── IT RENDERS NOTHING UNTIL THE STUDY HAS ACTUALLY RUN ───────────────────
//
// `src/data/humanBaseline.ts` holds `null` results and `recorded: false` until
// five real sessions are scored. The gate lives in `baselineComparison()`,
// which is pure and tested, so "refuse to render" is a property of the data
// layer rather than a condition someone can accidentally delete from JSX.
//
// This panel is therefore INVISIBLE right now, on purpose, and appears by
// itself the moment a real result is pasted in. There is no placeholder, no
// greyed-out "coming soon", and no zero — PRD §3 forbids anything that could
// be read as a finding we do not have.
//
// ─── WHY THE GREEDY NUMBER IS HERE TOO ─────────────────────────────────────
//
// Human participants are asked to place first-come-first-served, which is
// exactly what `engine/greedy.ts` simulates. So the two numbers are measuring
// the same procedure, one by hand and one in code, and printing them side by
// side answers the sharpest available objection to the whole comparison —
// "your baseline is a straw man you wrote to lose." If real people land near
// the simulated baseline, the baseline is fair. If they do not, that is worth
// knowing before a judge finds it, not after.

import type { BaselineComparison } from '../data/humanBaseline';

interface Props {
  comparison: BaselineComparison | null;
}

export function HumanBaselinePanel({ comparison }: Props) {
  if (comparison === null) return null;

  const { participants, meanViolations, range, kyndraViolations, greedyViolations } =
    comparison;

  return (
    <section className="baseline" aria-label="HumanBaselinePanel">
      <h3 className="results__heading">How does this compare to a person?</h3>
      <p className="results__note">
        {participants} people placed this same cohort by hand, one at a time, on a
        two-minute timer — the constraints were not given to them, because a coordinator
        on a Saturday does not have them memorised either.
      </p>

      <div className="results__summary">
        <div className="stat">
          <span className="stat__value">{meanViolations.toFixed(1)}</span>
          <span className="stat__label">
            mean hard-constraint violations, {participants} people by hand
          </span>
        </div>
        {range !== null ? (
          <div className="stat">
            <span className="stat__value">
              {range[0]}–{range[1]}
            </span>
            <span className="stat__label">range across those {participants} sessions</span>
          </div>
        ) : null}
        <div className="stat">
          <span className="stat__value">{greedyViolations}</span>
          <span className="stat__label">
            violations from the simulated first-come-first-served baseline
          </span>
        </div>
        <div className="stat">
          <span className="stat__value">{kyndraViolations}</span>
          <span className="stat__label">violations from Kyndra, on this same cohort</span>
        </div>
      </div>

      <p className="results__note">
        Every session was scored with the engine's own <code>evaluatePair</code> — the
        same check that eliminates a pair in STEP 1 — so "what a person got wrong" is
        measured by exactly the rule Kyndra holds itself to, not a softer one.
      </p>

      <p className="impact__caveat">{comparison.caveat}</p>
    </section>
  );
}
