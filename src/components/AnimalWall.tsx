// AnimalWall — answers: "Who is waiting?" (Architecture §8).
// Landing state. Photos, names, days-in-shelter badges. NOT a form.
//
// P0-1: animal profiles — requirements, days-in-shelter, name, photo.

import { useState } from 'react';
import type { Animal } from '../engine';
import { AnimalAvatar } from './AnimalAvatar';
import { PhotoCredits } from './PhotoCredits';
import { hasCreditedPhoto } from '../data/photoCredits';

/** The requirements a coordinator has to hold in their head for this animal. */
function requirements(animal: Animal): string[] {
  const needs: string[] = [];
  if (!animal.okWithChildren) needs.push('No children');
  if (!animal.okWithOtherPets) needs.push('No other pets');
  if (animal.needsYard) needs.push('Needs a yard');
  if (animal.needsQuietHome) needs.push('Needs a quiet home');
  if (animal.dailyMedication) needs.push('Daily medication');
  if (animal.behaviouralDifficulty >= 4) needs.push('Experienced adopter');
  if (animal.energy >= 4) needs.push('Not alone all day');
  return needs;
}

export function AnimalCard({ animal, selected }: { animal: Animal; selected?: boolean }) {
  const longStay = animal.daysInShelter >= 180;

  // A path that 404s renders as a broken-image glyph, which is the one outcome
  // worse than having no photograph at all — and it would happen live, on a
  // projector, with no way to fix it. If the image fails for any reason, the
  // card silently falls back to the tinted initial.
  const [imageFailed, setImageFailed] = useState(false);
  const showPhoto = hasCreditedPhoto(animal.id, animal.photo) && !imageFailed;

  return (
    <article className={`animal${selected === true ? ' animal--selected' : ''}`}>
      <div className="animal__head">
        {showPhoto ? (
          <img
            className="animal__photo"
            src={animal.photo}
            alt=""
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <AnimalAvatar id={animal.id} name={animal.name} />
        )}
        <div>
          <h3 className="animal__name">{animal.name}</h3>
          <p className="animal__meta">
            {animal.species === 'dog' ? 'Dog' : 'Cat'} · {animal.ageYears}
            {animal.ageYears === 1 ? ' year' : ' years'} · {animal.sizeKg}kg
          </p>
        </div>
      </div>

      <p className={`animal__days${longStay ? ' animal__days--long' : ''}`}>
        <strong>{animal.daysInShelter}</strong> days in shelter
        {longStay ? ' — long stay' : ''}
      </p>

      <ul className="animal__needs">
        {requirements(animal).map((need) => (
          <li key={need}>{need}</li>
        ))}
        {requirements(animal).length === 0 ? <li>No special requirements</li> : null}
      </ul>

      {animal.specialNeeds.length > 0 ? (
        <p className="animal__special">{animal.specialNeeds.join('; ')}</p>
      ) : null}
    </article>
  );
}

export function AnimalWall({ animals, title }: { animals: Animal[]; title?: string }) {
  return (
    <section aria-label="Animals waiting">
      {title !== undefined ? <h2 className="section__title">{title}</h2> : null}
      <div className="wall">
        {animals.map((animal) => (
          <AnimalCard key={animal.id} animal={animal} />
        ))}
      </div>

      {/* Renders nothing while every animal uses a generated portrait. */}
      <PhotoCredits animals={animals} />
    </section>
  );
}
