// JourneyTrack — "look here first": a small, consistent marker that tells
// whoever lands on a page where it sits in Kyndra's story (PRD-style flow:
// understand → see an example → run the matching → understand the results →
// learn more), so wayfinding doesn't rely on the nav alone. Five dots, one
// filled/active, the rest either done or upcoming — no animation, no extra
// chrome, just an orientation cue at the top of the page's primary content.

const STEPS = [
  'Understand',
  'See a realistic example',
  'Run the matching',
  'Understand the results',
  'Learn more',
] as const;

export function JourneyTrack({ step }: { step: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="journey">
      <ol className="journey__dots" aria-hidden="true">
        {STEPS.map((_, index) => {
          const position = index + 1;
          const state = position === step ? 'active' : position < step ? 'done' : '';
          return <li key={position} className={state} />;
        })}
      </ol>
      <span className="journey__label">
        Part {step} of {STEPS.length} — {STEPS[step - 1]}
      </span>
    </div>
  );
}
