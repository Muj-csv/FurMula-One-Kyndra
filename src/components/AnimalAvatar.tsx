// The stand-in shown for an animal with no sourced photograph.
//
// ─── WHY A TINTED INITIAL AND NOT A PICTURE OF AN ANIMAL ───────────────────
//
// PRD §3.1: THE ANIMALS ARE SIMULATED, and their imagery "must never imply
// otherwise". A stock photograph of a real dog captioned "Bruno, 340 days in
// shelter" implies exactly that to everyone who sees it, whatever the
// provenance line further up the page says. A letter cannot.
//
// Species silhouettes were tried and rejected. A cat reads fine at this size —
// pointed ears are an unambiguous signal — but no solid dog-head shape does:
// drooping ears on a round skull render as a three-lobed clover at 48px,
// whether drawn as separate shapes or as one continuous outline. Four
// variations were rendered and compared, and all of them were less
// informative than the letter they would have replaced. The species is already
// stated in words directly beside this ("Dog · 7 years · 41kg"), so the
// drawing was carrying no information the card did not already have.
//
// The tint is the part that survived. It is derived from the animal's id, so
// two dogs are still distinguishable on a wall of sixteen, and it is stable —
// the same animal gets the same colour on every render.
//
// Hue is confined to a green–teal band so sixteen cards read as one product
// rather than a bag of skittles. Lightness is NOT set here: the card's letter
// is `var(--paper)`, which flips between near-white and near-black with the
// theme, so the disc has to flip with it. That lives in index.css, where the
// theme already does.
//
// Real photographs remain fully supported — set `photo` and add the credit in
// `src/data/photoCredits.ts`. This is the fallback, not a ceiling.

/** FNV-1a, 32-bit — deterministic across engines, and six lines of it. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Green through teal. Narrow on purpose — see the note above. */
const HUE_START = 140;
const HUE_RANGE = 60;

/** The hue this animal always gets. Exported so a test can pin the spread. */
export function avatarHue(id: string): number {
  return HUE_START + (hash(id) % HUE_RANGE);
}

export function AnimalAvatar({ id, name }: { id: string; name: string }) {
  return (
    <div
      className="animal__avatar"
      // The name is right beside it; announcing the initial too is noise.
      aria-hidden="true"
      style={{ '--avatar-hue': avatarHue(id) } as React.CSSProperties}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}
