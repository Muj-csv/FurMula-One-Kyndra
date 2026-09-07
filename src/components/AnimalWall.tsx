// AnimalWall — answers: "Who is waiting?" (Architecture §8).
// Landing state. Photos, names, days-in-shelter badges. NOT a form.
//
// P0-1: animal profiles — requirements, days-in-shelter, name, photo.

import type { Animal } from '../engine';

function initials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

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

  return (
    <article className={`animal${selected === true ? ' animal--selected' : ''}`}>
      <div className="animal__head">
        {animal.photo === '' ? (
          <div className="animal__avatar" aria-hidden="true">
            {initials(animal.name)}
          </div>
        ) : (
          <img className="animal__photo" src={animal.photo} alt="" />
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
    </section>
  );
}
