// MatchingTransition — the "Run the matching engine" moment (Redesign Phase
// 5, §13). The engine itself is synchronous and near-instant (Architecture
// §2 — pure, zero-dependency TypeScript), so there is nothing to actually
// wait for. This is deliberately theatrical: a brief, honest narration of
// what the engine just did, shown for about a second while the real results
// are already mounted underneath (see MatchPage) — never a spinner blocking
// on real work, and never long enough to feel like a loading screen.
//
// Timing lives in CSS (see .matching-transition__sentinel), not a JS timer,
// so the existing global `prefers-reduced-motion` rule in index.css — which
// collapses every animation/transition to 0.01ms — collapses this one too,
// automatically, with no separate media-query check here.

const STAGES = [
  'Reviewing households',
  'Checking requirements',
  'Finding compatible homes',
  'Building stable matches',
  'Results ready',
] as const;

export function MatchingTransition({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="matching-transition" role="status" aria-live="polite">
      <p className="matching-transition__caption">
        Kyndra is checking the rules before recommending a placement.
      </p>
      <ol className="matching-transition__stages">
        {STAGES.map((label, index) => (
          <li key={label} style={{ '--stage-delay': `${index * 180}ms` } as React.CSSProperties}>
            {label}
          </li>
        ))}
      </ol>
      {/* Not visible content — its sole purpose is to fire one onAnimationEnd
          once the full staged sequence above has had time to play out. */}
      <span className="matching-transition__sentinel" aria-hidden="true" onAnimationEnd={onFinish} />
    </div>
  );
}
