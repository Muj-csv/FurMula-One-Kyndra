// The Kyndra mark and the status glyphs, as one inline SVG sprite.
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
        {/* ─── The Kyndra mark ───────────────────────────────────────────
            Flat, one colour, drawn in `currentColor` so the nav and the
            footer can tint it from tokens and dark mode needs no second
            asset.

            It replaces a 3D glassmorphic render in teal-green and orange —
            a colour pair that appears nowhere in the Terracotta / Chile /
            Olive / Sunset palette, that read as generated art, and that
            shipped as a 697x855 PNG to be displayed at 32px.

            Two symbols (paw-icon, paw-icon-light) used to live here, one
            hardcoded near-black and one hardcoded white, because a fixed
            fill cannot follow a theme. currentColor makes both unnecessary.

            Four toes, not the three the old sprite drew. */}
        <symbol id="kyndra-mark" viewBox="0 0 32 32">
          <ellipse cx="6.6" cy="15" rx="3.3" ry="4.3" fill="currentColor" transform="rotate(-24 6.6 15)" />
          <ellipse cx="12.6" cy="9.2" rx="3.4" ry="4.6" fill="currentColor" transform="rotate(-9 12.6 9.2)" />
          <ellipse cx="19.4" cy="9.2" rx="3.4" ry="4.6" fill="currentColor" transform="rotate(9 19.4 9.2)" />
          <ellipse cx="25.4" cy="15" rx="3.3" ry="4.3" fill="currentColor" transform="rotate(24 25.4 15)" />
          <ellipse cx="16" cy="23.2" rx="7.6" ry="6.4" fill="currentColor" />
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
