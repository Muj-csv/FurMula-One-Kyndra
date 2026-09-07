// Visible attribution for every photograph on screen — PRD §3.1.
//
// Licences like CC BY and the Unsplash Licence want the credit visible to the
// person looking at the image, not buried in a source file. A single list
// under the wall is the conventional way to do that without putting a byline
// on every card, and it keeps all the claims in one place where they can be
// checked against `photoCredits.ts` at a glance.
//
// It renders NOTHING when no animal has a credited photograph, which is the
// current state — a heading saying "Image credits" above an empty list would
// be a claim about work nobody has done.

import type { Animal } from '../engine';
import { photoCredit, hasCreditedPhoto } from '../data/photoCredits';

interface Props {
  animals: Animal[];
}

export function PhotoCredits({ animals }: Props) {
  const credited = animals
    .filter((animal) => hasCreditedPhoto(animal.id, animal.photo))
    .map((animal) => ({ animal, credit: photoCredit(animal.id) }))
    .filter(
      (entry): entry is { animal: Animal; credit: NonNullable<ReturnType<typeof photoCredit>> } =>
        entry.credit !== undefined,
    );

  if (credited.length === 0) return null;

  return (
    <section className="credits" aria-label="Image credits">
      <h3 className="results__heading">Image credits</h3>
      <p className="results__note">
        These animals are simulated. The photographs are free-licence stock images
        standing in for them, and are not pictures of animals at any shelter.
      </p>
      <ul className="credits__list">
        {credited.map(({ animal, credit }) => (
          <li key={animal.id}>
            {animal.name} —{' '}
            <a href={credit.sourceUrl} target="_blank" rel="noreferrer noopener">
              photograph
            </a>{' '}
            by {credit.author} on {credit.source},{' '}
            <a href={credit.licenceUrl} target="_blank" rel="noreferrer noopener">
              {credit.licence}
            </a>
            .
          </li>
        ))}
      </ul>
    </section>
  );
}
