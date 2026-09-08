// EvidencePage — "What's real, what's simulated." Ported from
// Frontend/evidence.html's citation-panel + honesty-note + explainer.
//
// Architecture §5, rule 1: every number displayed anywhere resolves through
// RESEARCH — no numeric literals in components. That is why this page does
// NOT reproduce the prototype's "78.4% vs 70.9%" stability figures: those are
// real (Wu et al. 2025), but they are not in RESEARCH, and this file cannot
// add them — src/data/ is out of scope for this change. The stability
// argument below is made in words instead, same conclusion, no invented
// literal.

import type { Cohort, GreedyResult, ImpactModel, MatchResult } from '../engine';
import { countViolations } from '../engine';
import { RESEARCH, COHORT_SIZING_NOTE } from '../data/researchConstants';
import { provenanceLabel } from '../data/cohort';
import { baselineComparison } from '../data/humanBaseline';
import { HumanBaselinePanel } from './HumanBaselinePanel';
import type { Page } from './NavBar';

interface Outcome {
  greedy: GreedyResult;
  stable: MatchResult;
  impact: ImpactModel;
}

export function EvidencePage({
  cohort,
  outcome,
  onNavigate,
}: {
  cohort: Cohort;
  outcome: Outcome | null;
  onNavigate: (page: Page) => void;
}) {
  const comparison =
    outcome === null
      ? null
      : baselineComparison(
          cohort,
          countViolations(
            cohort,
            new Map(outcome.stable.assignments.map((a) => [a.animalId, a.applicantId])),
          ),
          outcome.greedy.constraintViolations,
        );

  return (
    <main className="page">
      <section>
        <div className="section-head">
          <div>
            <h2>What&rsquo;s real, what&rsquo;s simulated.</h2>
            <p>
              The cohort in this prototype is invented. The constraints it enforces are not —
              each one maps to a documented cause of adoption return.
            </p>
          </div>
          <div className="proof">Verified matching rules</div>
        </div>

        <div className="citation-panel">
          <h4>What&rsquo;s real, what&rsquo;s simulated</h4>
          <div className="citation-item">
            <b>The cohort is simulated.</b> {provenanceLabel(cohort)} {COHORT_SIZING_NOTE}
          </div>
          <div className="citation-item">
            <b>The constraints are real.</b> {RESEARCH.dogReturnRate.label} —{' '}
            {RESEARCH.behaviouralShareOfReturns.label}, {RESEARCH.householdPetConflictShare.label}
            . Every hard constraint in the matching engine maps to one of those two documented
            causes. <i>{RESEARCH.dogReturnRate.source}</i>
          </div>
          <div className="citation-item">
            <b>The compounding cost is real.</b> {RESEARCH.readoptionRate.label}, and{' '}
            {RESEARCH.behaviouralReturnerPenalty.label.toLowerCase()}.{' '}
            <i>{RESEARCH.readoptionRate.source}</i>
          </div>
          <div className="citation-item">
            <b>Why stability, not pure optimisation.</b> A pure optimiser can raise average fit
            across a cohort, but Gale–Shapley deferred acceptance guarantees no shelter–applicant
            pair would rather defect from their assignment. For a placement a household might
            return, Kyndra chooses the guarantee over the higher average score.
          </div>
          <div className="honesty-note">
            <b>Kyndra proposes; it doesn&rsquo;t decide.</b> Framed as odds, not outcomes: this
            reduces the odds staff overlook a bad pairing under time pressure, not &ldquo;prevents
            returns.&rdquo;
          </div>
        </div>

        {outcome !== null ? <HumanBaselinePanel comparison={comparison} /> : null}

        <div className="explainer">
          <div>
            <p style={{ marginTop: 0, maxWidth: '44ch', color: 'var(--ink-soft)' }}>
              Every constraint the engine enforces is inspectable from the results board. Run
              the cohort and open the details on any placement to see which households were
              eliminated, and on what documented grounds.
            </p>
            <div className="reason">
              <b>Read it yourself</b>
              The citation behind each elimination is printed alongside the reason, not buried
              in a footnote.
            </div>
            <div className="hero-actions">
              <button type="button" className="primary" onClick={() => onNavigate('match')}>
                Run the matching engine
              </button>
              <button type="button" className="secondary" onClick={() => onNavigate('cohort')}>
                Explore the cohort
              </button>
            </div>
          </div>
          <div className="steps">
            <div className="step">
              <b>01</b>
              <div>
                <strong>Behavioural incompatibility</strong>
                <br />
                <span>
                  {RESEARCH.behaviouralShareOfReturns.label}. Maps to the experience, energy and
                  young-children constraints.
                </span>
              </div>
            </div>
            <div className="step">
              <b>02</b>
              <div>
                <strong>Conflict with a resident pet</strong>
                <br />
                <span>
                  {RESEARCH.householdPetConflictShare.label}. Maps to the existing-pet
                  constraints.
                </span>
              </div>
            </div>
            <div className="step">
              <b>03</b>
              <div>
                <strong>Stability over average fit</strong>
                <br />
                <span>
                  A guarantee that no pair would rather defect, chosen deliberately over a
                  higher mean score.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
