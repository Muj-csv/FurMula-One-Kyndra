// StatusGlyph — the app's small icon system for satisfied/failed checklist
// items (ResultsBoard's placements, WhyNotPanel, JudgeChallenge, and
// UnmatchedPanel's constraint lists). Replaces the plain "✓"/"✗" text
// characters those lists used to render. Decorative only — the list item's
// own text already says "satisfied" or names the failed constraint, so the
// glyph is aria-hidden rather than duplicated for screen readers.

export function StatusGlyph({ kind }: { kind: 'ok' | 'fail' }) {
  return (
    <svg className={`status-glyph status-glyph--${kind === 'ok' ? 'ok' : 'fail'}`} aria-hidden="true">
      <use href={kind === 'ok' ? '#check-icon' : '#cross-icon'} />
    </svg>
  );
}
