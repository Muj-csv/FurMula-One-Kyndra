// CohortEditor — the other half of runtime cohort editing.
//
// Adding was already possible (AnimalIntake, ApplicantIntake). Taking a record
// OUT was not, and removal is the edit a sceptic actually reaches for: the
// interesting question is not "what happens with one more household" but
// "what happens to Bruno when the only home that could take him walks away".
// That is a cascade you can watch, and it is the claim the board makes.
//
// ─── IT IS BEHIND A TOGGLE, AND THAT IS DELIBERATE ─────────────────────────
//
// Architecture §8: never type during the presentation. A remove button sitting
// on every card of the animal wall is one stray click away from deleting the
// animal the demo opens on, live. So the wall stays a wall, and destructive
// controls live in a panel nobody opens by accident. "Reset to preset cohort"
// undoes anything that happens here — edits are session state, never written
// back to cohort.ts.
//
// ─── WHY THE WARNING TEXT IS COMPUTED, NOT WRITTEN ─────────────────────────
//
// Removing an animal clears the named claim of any household that came for
// them (cohortEdit.ts explains why it must). That is a real consequence to a
// second record, so it is stated before the click, by name, read off the
// cohort — not discovered afterwards on a board that quietly changed.

import type { Animal, Applicant, Cohort } from '../engine';
import { claimants } from '../data/cohortEdit';
import { COHORT } from '../data/cohort';

/**
 * How many of the preset's records are missing from the cohort on screen.
 *
 * Counted by id rather than by subtracting lengths, because the visitor can
 * also ADD: a cohort of sixteen with two removed and two added is not an
 * unedited one, and length arithmetic would report it as such.
 */
function removedCount(preset: { id: string }[], current: { id: string }[]): number {
  const present = new Set(current.map((record) => record.id));
  return preset.filter((record) => !present.has(record.id)).length;
}

interface Props {
  cohort: Cohort;
  onRemoveAnimal: (id: string) => void;
  onRemoveApplicant: (id: string) => void;
}

function animalLine(animal: Animal): string {
  const kind = animal.species === 'dog' ? 'Dog' : 'Cat';
  return `${kind} · ${animal.ageYears}${animal.ageYears === 1 ? ' year' : ' years'} · ${animal.sizeKg}kg · ${animal.daysInShelter} days waiting`;
}

function applicantLine(applicant: Applicant, animals: Animal[]): string {
  const home = applicant.homeType === 'house' ? 'House' : 'Apartment';
  const came = animals.find((animal) => animal.id === applicant.specificAnimalId);
  const parts = [
    home,
    applicant.hasYard ? 'yard' : 'no yard',
    `${applicant.hoursAwayPerDay}h away`,
    `experience ${applicant.experience}`,
  ];
  if (came !== undefined) parts.push(`here for ${came.name}`);
  return parts.join(' · ');
}

export function CohortEditor({ cohort, onRemoveAnimal, onRemoveApplicant }: Props) {
  const lastAnimal = cohort.animals.length <= 1;
  const lastApplicant = cohort.applicants.length <= 1;
  const removedAnimals = removedCount(COHORT.animals, cohort.animals);
  const removedApplicants = removedCount(COHORT.applicants, cohort.applicants);

  return (
    <section className="editor" aria-label="Edit the cohort">
      <h2 className="section__title">Edit the cohort</h2>
      {/* The counts here are the PRESET's, not the current cohort's. Reading
          them off `cohort` made the sentence count down as records were
          removed — "restores all 15 animals" after deleting one of sixteen,
          which is the one thing this panel must not get wrong. */}
      <p className="editor__hint">
        Removing a record changes this session only. Nothing is written back, and
        &ldquo;Reset to preset cohort&rdquo; restores all {COHORT.animals.length} animals
        and {COHORT.applicants.length} households.
      </p>
      {removedAnimals + removedApplicants > 0 ? (
        <p className="editor__hint">
          Currently {cohort.animals.length} animals and {cohort.applicants.length}{' '}
          households — {removedAnimals} {removedAnimals === 1 ? 'animal' : 'animals'} and{' '}
          {removedApplicants} {removedApplicants === 1 ? 'household' : 'households'} removed.
        </p>
      ) : null}

      <h3 className="editor__group">Animals</h3>
      <ul className="editor__list">
        {cohort.animals.map((animal) => {
          const claimed = claimants(cohort, animal.id);
          return (
            <li key={animal.id} className="editor__row">
              <div>
                <strong>{animal.name}</strong>
                <span className="editor__meta">{animalLine(animal)}</span>
                {claimed.length > 0 ? (
                  <span className="editor__warning">
                    Removing {animal.name} drops the named claim of{' '}
                    {claimed.map((applicant) => applicant.name).join(', ')} — they stay in
                    the cohort, ranked on preference like everyone else.
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                className="button button--remove"
                disabled={lastAnimal}
                title={lastAnimal ? 'The cohort needs at least one animal' : undefined}
                onClick={() => onRemoveAnimal(animal.id)}
              >
                Remove {animal.name}
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="editor__group">Households</h3>
      <ul className="editor__list">
        {cohort.applicants.map((applicant) => (
          <li key={applicant.id} className="editor__row">
            <div>
              <strong>{applicant.name}</strong>
              <span className="editor__meta">{applicantLine(applicant, cohort.animals)}</span>
            </div>
            <button
              type="button"
              className="button button--remove"
              disabled={lastApplicant}
              title={lastApplicant ? 'The cohort needs at least one household' : undefined}
              onClick={() => onRemoveApplicant(applicant.id)}
            >
              Remove {applicant.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
