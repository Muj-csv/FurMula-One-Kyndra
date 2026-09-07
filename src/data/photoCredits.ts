// Attribution for any real photograph used in the cohort — PRD §3.1.
//
// ─── THE RULE THIS FILE ENFORCES ───────────────────────────────────────────
//
// A photograph may appear ONLY if its credit is recorded here. `cohort.ts`
// says "source free-licence images, attribute them" and PRD §3 makes the
// source render on screen wherever the value appears; an unattributed image is
// a licence breach on a public URL, and a shelter-adjacent project getting
// that wrong is a worse look than having no photographs at all.
//
// `tests/photos.test.ts` fails the build if an animal has a `photo` with no
// credit here, or a credit with a field left blank. It is not possible to ship
// a photograph and forget the attribution.
//
// ─── WHY THIS IS NOT IN THE ANIMAL TYPE ────────────────────────────────────
//
// `Animal` lives in `src/engine/types.ts`, and `src/engine/README.md` gives
// that directory a single owner that nobody else commits to. Photo provenance
// is also not something the matching engine has any use for — it is
// presentation metadata. So it lives here, keyed by animal id, and the engine
// boundary stays intact.
//
// ─── HOW TO ADD ONE ────────────────────────────────────────────────────────
//
//   1. Source an image under a licence that permits commercial use and
//      modification with attribution — Unsplash, Pexels, Wikimedia Commons
//      (check the specific file's licence, not the site's general terms).
//   2. Put the file in `public/animals/` and set the animal's `photo` to
//      `/animals/<file>` in cohort.ts.
//   3. Add the credit below. Every field is required.
//
// ⚠ NOTHING IS LISTED YET, ON PURPOSE. Every animal renders a generated
// silhouette (see AnimalPortrait.tsx), which carries no licence burden and
// cannot be mistaken for a photograph of a real shelter animal. Adding
// photographs is a deliberate choice with a licence attached, not a default.

export interface PhotoCredit {
  /** Where it came from, as it should read on screen. e.g. "Unsplash". */
  source: string;
  /** The photographer, as the licence requires them to be named. */
  author: string;
  /** The licence's short name. e.g. "CC BY 4.0", "Unsplash Licence". */
  licence: string;
  /** Link to the licence text. */
  licenceUrl: string;
  /** Link to the original image page, so the claim can be checked. */
  sourceUrl: string;
}

/** animalId → credit. An animal with a `photo` MUST have an entry here. */
export const PHOTO_CREDITS: Record<string, PhotoCredit> = {};

/** The credit for an animal, or undefined when it has no photograph. */
export function photoCredit(animalId: string): PhotoCredit | undefined {
  return PHOTO_CREDITS[animalId];
}

/**
 * True when this animal's photograph may be rendered.
 *
 * Both halves are required: a path with no credit is a licence problem, and a
 * credit with no path is a dangling record. Either way the card falls back to
 * the generated portrait, which is always safe to show.
 */
export function hasCreditedPhoto(animalId: string, photo: string): boolean {
  return photo.trim() !== '' && photoCredit(animalId) !== undefined;
}
