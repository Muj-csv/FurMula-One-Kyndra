// MatchPage — "Run the cohort yourself." Ported from Frontend/match.html's
// layout (intake card, results board, tool grid, stability check), wired to
// the real engine via App.tsx's shared state. Every panel below is an
// existing, already-working component — ResultsBoard alone composes the
// greedy→stable transition, the human-baseline comparison, attempt-a-swap,
// the equity dial, why-not, unmatched, regret, and impact panels, each in
// PRD §8's demo-script order (see the comment in ResultsBoard.tsx). Nothing
// here recomputes what the engine already returned.
//
// Phase 3 (Frontend/REVISION-PHASES.md): this page's cohort starts EMPTY —
// no preset animals or households. The visitor builds it themselves with
// the animal/household intake forms below. That's a real behaviour change
// from before, so the pre-run demo beats (ThroughLine/JudgeChallenge/
// ConstraintGrid — all built around "here's a cohort, look at it") only make
// sense once there is at least one animal to show; before that, a plain
// "build your cohort" prompt takes their place.

import { useState } from 'react';
import type { Animal, Applicant, Cohort, GreedyResult, ImpactModel, MatchResult } from '../engine';
import { ThroughLine } from './ThroughLine';
import { JudgeChallenge } from './JudgeChallenge';
import { ConstraintGrid } from './ConstraintGrid';
import { AnimalIntake } from './AnimalIntake';
import { ApplicantIntake } from './ApplicantIntake';
import { ResultsBoard } from './ResultsBoard';
import { JourneyTrack } from './JourneyTrack';
import { MatchingTransition } from './MatchingTransition';
import type { Page } from './NavBar';

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
  showAnimalIntake,
  onToggleAnimalIntake,
  nextAnimalId,
  onAddAnimal,
  showIntake,
  onToggleIntake,
  nextApplicantId,
  onAddApplicant,
  onReset,
  onLoadDemo,
  onNavigate,
  equityWeight,
  onEquityWeightChange,
  assumptionLevel,
  onAssumptionLevelChange,
}: {
  cohort: Cohort;
  outcome: Outcome | null;
  onRun: () => void;
  showAnimalIntake: boolean;
  onToggleAnimalIntake: () => void;
  nextAnimalId: string;
  onAddAnimal: (animal: Animal) => void;
  showIntake: boolean;
  onToggleIntake: () => void;
  nextApplicantId: string;
  onAddApplicant: (applicant: Applicant) => void;
  onReset: () => void;
  onLoadDemo: () => void;
  onNavigate: (page: Page) => void;
  equityWeight: number;
  onEquityWeightChange: (value: number) => void;
  assumptionLevel: number;
  onAssumptionLevelChange: (value: number) => void;
}) {
  const isEmpty = cohort.animals.length === 0 && cohort.applicants.length === 0;
  const hasAnimals = cohort.animals.length > 0;

  // Phase 5 (Kyndra_UI_UX_Redesign_Prompt.md §13) — a brief, honest "checking
  // the rules" narration plays once per run. The real outcome is already
  // computed synchronously by the time this flips true (see App.tsx's
  // useMemo) — this never gates or delays the actual match, it only delays
  // how soon the results fade into view, so a judge sees the engine "work"
  // instead of results simply appearing mid-click.
  const [isRevealing, setIsRevealing] = useState(false);
  const handleRun = () => {
    onRun();
    setIsRevealing(true);
  };

  return (
    <main className="page">
      <section id="demo">
        <JourneyTrack step={outcome === null ? 3 : 4} />
        <div className="section-head">
          <div>
            <h2>Matching</h2>
            {/* The five-step paragraph that used to sit here is gone — see the
                note on the stage strip below. */}
          </div>
        </div>

        {/* Phase 3.5 — a simple stage indicator, not an animation. Filter and
            Derive light up once there is a cohort to run; Match and Results
            light up once the engine has actually run.
            ──────────────────────────────────────────────────────────────
            Punch list item 3: this page carried THREE step systems between
            the heading and any content — a five-step paragraph about the
            interface, this four-stage strip about the engine's pipeline,
            and a second four-step paragraph about the interface again. They
            did not agree with each other, and two of the three were
            numbered sequences written as run-on prose.

            This one survives because it is the only one that reflects live
            state: it lights up as the cohort fills and the engine runs. The
            two paragraphs told visitors to press buttons that already say
            what they do, which is instruction for its own sake. */}
        <ol className="stage-flow" aria-label="Matching process stage">
          <li className={hasAnimals || outcome !== null ? 'active' : ''}>01 Filter</li>
          <li className={hasAnimals || outcome !== null ? 'active' : ''}>02 Derive</li>
          <li className={outcome !== null ? 'active' : ''}>03 Match</li>
          <li className={outcome !== null ? 'active' : ''}>04 Results</li>
        </ol>

        {isEmpty ? (
          <div className="demo-banner">
            <span className="demo-banner__badge">Empty cohort</span>
            <div>
              <p style={{ marginBottom: '10px' }}>
                Your cohort is empty — 0 animals, 0 households. Load the demo cohort to see
                Kyndra in action immediately, or build your own from scratch below.
              </p>
              <div className="actions" style={{ marginTop: 0 }}>
                <button type="button" className="primary" data-testid="load-demo-cohort" onClick={onLoadDemo}>
                  Load demo cohort
                </button>
                <button type="button" className="secondary" onClick={onToggleAnimalIntake}>
                  Build my own cohort
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* PRD §8 beat 1 — one animal, one sentence, before anything else.
            Only shown before a run, and only once there is at least one
            animal to open on. */}
        {outcome === null && hasAnimals ? (
          <ThroughLine animals={cohort.animals} applicants={cohort.applicants} />
        ) : null}

        {outcome === null && hasAnimals ? (
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
              <button type="button" className="primary" data-testid="run-match" onClick={handleRun}>
                Run the matching engine →
              </button>
              <button type="button" className="secondary" onClick={onToggleAnimalIntake}>
                {showAnimalIntake ? 'Hide animal form' : 'Add an animal'}
              </button>
              <button type="button" className="secondary" onClick={onToggleIntake}>
                {showIntake ? 'Hide household form' : 'Add a household'}
              </button>
              <button type="button" className="button button--ghost" onClick={onReset}>
                Clear and start over
              </button>
            </div>

            {/* Punch list item 4. This floated between the buttons and the
                results in body-sized text with nothing to attach to. It is a
                caption on the action row above it, so it is set as one — and
                the three figures are marked up as figures, because the last
                of them is the argument for the whole product and it is
                derived, not asserted. */}
            <p className="cohort-count">
              <strong>{cohort.animals.length}</strong> animals ·{' '}
              <strong>{cohort.applicants.length}</strong> households ·{' '}
              <strong>{cohort.animals.length * cohort.applicants.length}</strong> pairwise
              judgements to make by hand
            </p>

            {showAnimalIntake ? <AnimalIntake nextId={nextAnimalId} onSubmit={onAddAnimal} /> : null}

            {showIntake ? (
              <ApplicantIntake animals={cohort.animals} nextId={nextApplicantId} onSubmit={onAddApplicant} />
            ) : null}
          </div>
        </div>

        {outcome === null && hasAnimals ? (
          <div
            className="results-empty"
            style={{
              marginTop: '22px',
              padding: '28px',
              border: '1px dashed var(--line)',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
              color: 'var(--ink-soft)',
            }}
          >
            Fill in the intake above and run the engine to see where the whole cohort lands —
            not just the household you just added.
          </div>
        ) : null}

        {outcome !== null && isRevealing ? (
          <MatchingTransition onFinish={() => setIsRevealing(false)} />
        ) : null}

        {outcome !== null ? (
          <div className={isRevealing ? 'results-reveal results-reveal--pending' : 'results-reveal'}>
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

            <div className="hero-actions" style={{ marginTop: '24px' }}>
              <button type="button" className="secondary" onClick={onReset}>
                Explore another cohort
              </button>
              <button type="button" className="secondary" onClick={() => onNavigate('evidence')}>
                See why Kyndra works this way →
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
