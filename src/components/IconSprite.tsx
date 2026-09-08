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

        {/* Generic UI glyphs — nav-bar placeholders (Phase 1). Plain
            currentColor line icons, not animal imagery, so the species-
            silhouette concern above does not apply to these. */}
        <symbol id="bell-icon" viewBox="0 0 24 24">
          <path
            d="M12 3.5c-3 0-5 2.2-5 5.3v3.1c0 .7-.3 1.7-.8 2.4l-.9 1.2c-.5.7 0 1.7.9 1.7h11.6c.9 0 1.4-1 .9-1.7l-.9-1.2c-.5-.7-.8-1.7-.8-2.4V8.8c0-3.1-2-5.3-5-5.3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M9.8 19.5a2.3 2.3 0 0 0 4.4 0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </symbol>
        <symbol id="profile-icon" viewBox="0 0 24 24">
          <circle cx="12" cy="8.3" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M5 19c1-3.2 3.8-5 7-5s6 1.8 7 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}
