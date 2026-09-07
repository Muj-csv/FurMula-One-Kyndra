// The opening beat — PRD §8 step 1: "Meet Bruno. 340 days. One sentence."
//
// ─── WHY THIS EXISTS ───────────────────────────────────────────────────────
//
// The demo opens on one animal and closes on the same one (step 11, "close on
// Bruno"). He was previously the first of sixteen identical cards on a wall,
// which is not an opening — it is a directory. Fifteen seconds in, nobody has
// been given anyone to care about, and the rest of the seven minutes is
// algorithms.
//
// ─── WHY IT IS DERIVED AND NOT WRITTEN ─────────────────────────────────────
//
// Every word below is read off the cohort. Nothing here is authored copy about
// a specific animal, for two reasons:
//
//   1. PRD §9 lists "the Bruno narrative doesn't hold in the real output" as
//      the one High/Severe risk. Hand-written prose is exactly how a story
//      drifts away from the data — it keeps saying 340 days after someone
//      edits the cohort. The tests can pin numbers; they cannot pin a
//      paragraph somebody typed.
//
//   2. The through-line is a cohort property, not a hardcoded id. This picks
//      the longest-waiting animal that some household could actually take -
//      the same rule EquityDial uses to decide who to name - so if the cohort
//      changes, the opening changes with it rather than lying.
//
// That deliberately excludes Ember, who waits longest (415 days) but has zero
// viable households. She is beat 9, the recruitment finding. Opening on an
// animal the system can never place would be opening on a defeat.

import type { Animal, Applicant } from '../engine';
import { evaluatePair } from '../engine';
import { AnimalAvatar } from './AnimalAvatar';

interface Props {
  animals: Animal[];
  applicants: Applicant[];
}

/** The animal the demo is built around: the longest wait that is placeable. */
export function throughLine(animals: Animal[], applicants: Applicant[]): Animal | undefined {
  const placeable = animals.filter((animal) =>
    applicants.some((applicant) => evaluatePair(animal, applicant).length === 0),
  );
  const byWait = (a: Animal, b: Animal) => b.daysInShelter - a.daysInShelter;
  return [...placeable].sort(byWait)[0] ?? [...animals].sort(byWait)[0];
}

export function ThroughLine({ animals, applicants }: Props) {
  const animal = throughLine(animals, applicants);
  if (animal === undefined) return null;

  const viable = applicants.filter(
    (applicant) => evaluatePair(animal, applicant).length === 0,
  ).length;
  const years = Math.floor(animal.daysInShelter / 365);
  const months = Math.round((animal.daysInShelter % 365) / 30);

  return (
    <section className="throughline" aria-label="ThroughLine">
      <div className="throughline__portrait">
        <AnimalAvatar id={animal.id} name={animal.name} />
      </div>

      <div>
        <h2 className="throughline__name">{animal.name}</h2>
        <p className="throughline__line">
          {animal.species === 'dog' ? 'A dog' : 'A cat'} of {animal.ageYears}, {animal.sizeKg}kg,
          waiting <strong>{animal.daysInShelter} days</strong>
          {years >= 1 ? (
            <> — {years} year{years === 1 ? '' : 's'}{months > 0 ? ` and ${months} months` : ''}</>
          ) : null}
          .
        </p>
        <p className="throughline__stat">
          Of the {applicants.length} households in this cohort,{' '}
          <strong>
            {viable} {viable === 1 ? 'can' : 'can'} legally take {animal.name}
          </strong>
          . Every other one fails a hard constraint that the research links to a return.
        </p>
      </div>
    </section>
  );
}
