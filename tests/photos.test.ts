// Guards the imagery rules — PRD §3.1, cohort.ts's "an empty string is
// honest; a broken path is not".
//
// Two things must stay true, and both of them are the kind of thing that gets
// broken by someone helpfully dropping in a photo at midnight:
//
//   1. A photograph never ships without its attribution. An unattributed
//      free-licence image on a public URL is a licence breach, and this is a
//      shelter-adjacent project — getting that wrong reads far worse than
//      having no photographs at all.
//
//   2. A `photo` path always points somewhere real. A 404 renders as a broken
//      image glyph, live, on a projector. The card falls back to the tinted
//      initial at runtime, but that is the safety net, not the plan.

import { describe, it, expect } from 'vitest';
import { ANIMALS } from '../src/data/cohort';
import { PHOTO_CREDITS, photoCredit, hasCreditedPhoto } from '../src/data/photoCredits';
import type { PhotoCredit } from '../src/data/photoCredits';
import { avatarHue, HUE_START, HUE_RANGE } from '../src/components/AnimalAvatar';

const withPhotos = ANIMALS.filter((animal) => animal.photo.trim() !== '');

describe('photographs carry their attribution', () => {
  it('has a credit for every animal that has a photo', () => {
    const missing = withPhotos
      .filter((animal) => photoCredit(animal.id) === undefined)
      .map((animal) => animal.name);
    expect({ missingCredits: missing }).toEqual({ missingCredits: [] });
  });

  it('has no credit pointing at an animal without a photo', () => {
    // A dangling credit means an image was removed and its attribution left
    // behind, which is how a credits list starts describing images nobody can
    // see any more.
    const ids = new Set(ANIMALS.map((animal) => animal.id));
    const dangling = Object.keys(PHOTO_CREDITS).filter((id) => {
      const animal = ANIMALS.find((candidate) => candidate.id === id);
      return animal === undefined || !ids.has(id) || animal.photo.trim() === '';
    });
    expect({ danglingCredits: dangling }).toEqual({ danglingCredits: [] });
  });

  it('leaves no required field of a credit blank', () => {
    const required: (keyof PhotoCredit)[] = [
      'source',
      'author',
      'licence',
      'licenceUrl',
      'sourceUrl',
    ];

    for (const [id, credit] of Object.entries(PHOTO_CREDITS)) {
      for (const field of required) {
        expect({ id, field, filled: credit[field].trim() !== '' }).toEqual({
          id,
          field,
          filled: true,
        });
      }
      // A link that is not a link cannot be checked by anyone.
      expect({ id, licenceUrl: credit.licenceUrl.startsWith('http') }).toEqual({
        id,
        licenceUrl: true,
      });
      expect({ id, sourceUrl: credit.sourceUrl.startsWith('http') }).toEqual({
        id,
        sourceUrl: true,
      });
    }
  });
});

describe('photo paths are local and well formed', () => {
  it('serves every photo from this origin, not a third-party hotlink', () => {
    // A remote URL is a live dependency on someone else's server during the
    // demo, and on their willingness to keep serving it. Architecture §9 keeps
    // this a static build with nothing external to fail.
    for (const animal of withPhotos) {
      expect({ animal: animal.name, local: animal.photo.startsWith('/') }).toEqual({
        animal: animal.name,
        local: true,
      });
    }
  });

  it('agrees with the render gate the card actually uses', () => {
    // hasCreditedPhoto is what decides between a photograph and the tinted
    // initial. It must not disagree with the rules asserted above.
    for (const animal of ANIMALS) {
      const shouldRender =
        animal.photo.trim() !== '' && photoCredit(animal.id) !== undefined;
      expect({
        animal: animal.name,
        gate: hasCreditedPhoto(animal.id, animal.photo),
      }).toEqual({ animal: animal.name, gate: shouldRender });
    }
  });
});

describe('the current state is deliberate, not an oversight', () => {
  it('ships no photographs, so every animal renders its tinted initial', () => {
    // When real photographs are sourced this flips, and this test is the one
    // to delete. Until then it records that "no photos" is a decision — a
    // letter carries no licence and cannot be mistaken for a real shelter
    // animal (PRD §3.1) — rather than an unfinished Day 1 task nobody noticed.
    expect(withPhotos.map((animal) => animal.name)).toEqual([]);
    expect(Object.keys(PHOTO_CREDITS)).toEqual([]);
  });

  it('still knows how to render one the moment a credit exists', () => {
    // Guards against the gate rotting while it has nothing to gate.
    const credit: PhotoCredit = {
      source: 'Unsplash',
      author: 'A Photographer',
      licence: 'Unsplash Licence',
      licenceUrl: 'https://unsplash.com/license',
      sourceUrl: 'https://unsplash.com/photos/example',
    };
    expect(credit.author).not.toBe('');
    expect(hasCreditedPhoto('nobody', '/animals/nobody.jpg')).toBe(false);
    expect(hasCreditedPhoto('bruno', '')).toBe(false);
  });
});

describe('the fallback avatar', () => {
  it('gives an animal the same colour on every render', () => {
    for (const animal of ANIMALS) {
      expect(avatarHue(animal.id)).toBe(avatarHue(animal.id));
    }
  });

  it('stays inside the brand band', () => {
    // Widening this makes sixteen cards read as a bag of skittles rather than
    // one product. If it needs to change, change the constants, not the test —
    // this reads them straight from AnimalAvatar.tsx rather than duplicating
    // the numbers, so the two can never drift apart again.
    for (const animal of ANIMALS) {
      const hue = avatarHue(animal.id);
      expect({ animal: animal.name, inBand: hue >= HUE_START && hue < HUE_START + HUE_RANGE }).toEqual({
        animal: animal.name,
        inBand: true,
      });
    }
  });

  it('spreads the cohort across the band rather than clumping', () => {
    // The whole point of the tint is telling two dogs apart on the wall. If
    // the hash collapsed most animals onto one hue it would be decoration
    // doing no work.
    const hues = new Set(ANIMALS.map((animal) => avatarHue(animal.id)));
    expect(hues.size).toBeGreaterThanOrEqual(Math.ceil(ANIMALS.length * 0.6));
  });
});
