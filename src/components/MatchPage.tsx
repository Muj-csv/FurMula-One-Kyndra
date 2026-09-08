// MatchPage — "Run the cohort yourself." Ported from Frontend/match.html's
// layout (intake card, results board, tool grid, stability check), wired to
// the real engine via App.tsx's shared state. Every panel below is an
// existing, already-working component — ResultsBoard alone composes the
// greedy→stable transition, the human-baseline comparison, attempt-a-swap,
// the equity dial, why-not, unmatched, regret, and impact panels, each in
// PRD §8's demo-script order (see the comment in ResultsBoard.tsx). Nothing
// here recomputes what the engine already returned.

import type { Applicant, Cohort, GreedyResult, ImpactModel, MatchResult } from '../engine';
import { ThroughLine } from './ThroughLine';
import { JudgeChallenge } from './JudgeChallenge';
import { ConstraintGrid } from './ConstraintGrid';
import { ApplicantIntake } from './ApplicantIntake';
import { ResultsBoard } from './ResultsBoard';

/** Matches engine.compare()'s return shape exactly — see src/engine/index.ts. */
interface Outcome {
  greedy: GreedyResult;
  stable: MatchResult;
  impact: ImpactModel;
}

export function MatchPage({
  cohort,
  outcome,
  onRun,
  showIntake,
  onToggleIntake,
  nextApplicantId,
  onAddApplicant,
  onReset,
  equityWeight,
  onEquityWeightChange,
  assumptionLevel,
  onAssumptionLevelChange,
}: {
  cohort: Cohort;
  outcome: Outcome | null;
  onRun: () => void;
  showIntake: boolean;
  onToggleIntake: () => void;
  nextApplicantId: string;
  onAddApplicant: (applicant: Applicant) => void;
  onReset: () => void;
  equityWeight: number;
  onEquityWeightChange: (value: number) => void;
  assumptionLevel: number;
  onAssumptionLevelChange: (value: number) => void;
}) {
  return (
    <main className="page">
      <section id="demo">
        <div className="section-head">
          <div>
            <h2>Run the cohort yourself.</h2>
            <p>
              This runs live, in your browser, over today&rsquo;s cohort. Answer the same
              question a coordinator would ask an applicant, and Kyndra will filter, derive,
              and settle a stable assignment for the whole cohort.
            </p>
          </div>
        </div>

        {/* PRD §8 beat 1 — one animal, one sentence, before anything else.
            Only shown before a run: once the board is up, the board is the
            subject. */}
        {outcome === null ? <ThroughLine animals={cohort.animals} applicants={cohort.applicants} /> : null}

        {outcome === null ? (
          <>
            {/* PRD §8 beats 2 and 3: the judge tries it by hand, then sees the
                size of what they just attempted — before the machine answers
                anything. */}
            <JudgeChallenge animals={cohort.animals} applicants={cohort.applicants} />
            <ConstraintGrid animals={cohort.animals} applicants={cohort.applicants} />
          </>
        ) : null}

        <div className="demo-layout" style={{ display: 'grid', gap: '22px', marginTop: '28px' }}>
          <div className="intake-card" style={{ padding: 0 }}>
            <div className="actions" style={{ marginTop: 0 }}>
              <button type="button" className="primary" onClick={onRun}>
                Run the matching engine →
              </button>
              <button type="button" className="secondary" onClick={onToggleIntake}>
                {showIntake ? 'Hide household form' : 'Add a household'}
              </button>
              <button type="button" className="button" onClick={onReset}>
                Reset to preset cohort
              </button>
            </div>

            <p className="results__note" style={{ marginTop: '12px' }}>
              {cohort.animals.length} animals · {cohort.applicants.length} households ·{' '}
              {cohort.animals.length * cohort.applicants.length} pairwise judgements to make by
              hand
            </p>

            {showIntake ? (
              <ApplicantIntake animals={cohort.animals} nextId={nextApplicantId} onSubmit={onAddApplicant} />
            ) : null}
          </div>
        </div>

        {outcome === null ? (
          <div className="results-empty" style={{ marginTop: '22px', padding: '28px', border: '1px dashed var(--line)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--ink-soft)' }}>
            Fill in the intake above and run the engine to see where the whole cohort lands —
            not just the household you just added.
          </div>
        ) : (
          <>
            <ResultsBoard
              result={outcome.stable}
              cohort={cohort}
              animals={cohort.animals}
              applicants={cohort.applicants}
              greedy={outcome.greedy}
              impact={outcome.impact}
              equityWeight={equityWeight}
              onEquityWeightChange={onEquityWeightChange}
              assumptionLevel={assumptionLevel}
              onAssumptionLevelChange={onAssumptionLevelChange}
            />

            {/* Dedicated stability affirmation — Frontend/match.html's
                "Verify: no blocking pairs exist" button. The number is
                already in the board summary above; this restates it as the
                proof-stamp pattern used everywhere else in the design. */}
            <div className="stability">
              <h4>Verify: no blocking pairs exist</h4>
              <p className="results__note" style={{ marginTop: '6px' }}>
                Scans every animal–household pair not matched to each other. A blocking pair
                would mean both sides prefer each other over their current assignment.
              </p>
              <p style={{ marginTop: '12px' }}>
                {outcome.stable.isStable ? (
                  <span className="proof-stamp stable">Stable</span>
                ) : (
                  <span className="proof-stamp blocked">Check failed</span>
                )}
                <span style={{ marginLeft: '10px', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
                  {outcome.stable.isStable
                    ? 'No blocking pair exists across the full cohort.'
                    : `${outcome.stable.blockingPairs.length} blocking pair(s) found — this should not happen.`}
                </span>
              </p>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
