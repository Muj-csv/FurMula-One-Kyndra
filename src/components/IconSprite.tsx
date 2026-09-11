// The paw-mark logo glyph, ported from Frontend/shared.js's SVG sprite.
//
// Only the paw mark is ported. shared.js also defined dog/cat/rabbit
// silhouette symbols, used there as per-animal avatars — but AnimalAvatar.tsx
// deliberately rejects species silhouettes (see the note in that file):
// PRD §3.1 requires imagery that cannot be mistaken for a real animal, and a
// dog-shaped glyph next to "Bruno, 340 days in shelter" risks exactly that.
// The tinted-initial avatar is a considered decision, not a gap to fill in —
// so those symbols are not ported here.

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="paw-icon" viewBox="0 0 32 32">
          <circle cx="16" cy="21" r="8" fill="#24231F" />
          <circle cx="7" cy="12" r="4" fill="#24231F" />
          <circle cx="16" cy="8" r="4.2" fill="#24231F" />
          <circle cx="25" cy="12" r="4" fill="#24231F" />
        </symbol>
        <symbol id="paw-icon-light" viewBox="0 0 32 32">
          <circle cx="16" cy="21" r="8" fill="#fff" />
          <circle cx="7" cy="12" r="4" fill="#fff" />
          <circle cx="16" cy="8" r="4.2" fill="#fff" />
          <circle cx="25" cy="12" r="4" fill="#fff" />
        </symbol>

        {/* Status glyphs — real iconography for the satisfied/eliminated
            checklists (ResultsBoard, WhyNotPanel, JudgeChallenge,
            UnmatchedPanel), replacing the plain "✓"/"✗" text characters
            those lists used to render. currentColor so each usage site's
            own color (var(--verified) / var(--terracotta-on-tint)) applies. */}
        <symbol id="check-icon" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M6 10.2l2.6 2.6L14.2 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="cross-icon" viewBox="0 0 20 20">
          <circle cx="10" cy="10" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>
      </defs>
    </svg>
  );
}
