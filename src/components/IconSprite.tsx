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
      </defs>
    </svg>
  );
}
