// STEP 6 — EXPLAIN. Rationale and counterfactual strings.
//
// Animal names in every string (Architecture §8) — never animal_07.
// Nothing here invents a reason: every line is read back off the constraint
// evaluation and the two scores the pipeline already computed.

import type { Animal, Applicant, Cohort } from './types';
import { ageBand } from './derive';

/** Why this pairing, in plain language, from both sides. */
export function buildRationale(animal: Animal, applicant: Applicant): string[] {
  const lines: string[] = [];

  if (applicant.specificAnimalId === animal.id) {
    lines.push(`${applicant.name} came for ${animal.name} by name — that choice was never overridden.`);
  }

  // Shelter side — what this household gives the animal.
  const margin = applicant.experience - animal.behaviouralDifficulty;
  if (margin >= 1) {
    lines.push(
      `${applicant.name}\u2019s experience is above what ${animal.name}\u2019s behavioural needs require.`,
    );
  } else if (margin >= 0) {
    lines.push(`${applicant.name}\u2019s experience meets ${animal.name}\u2019s behavioural needs.`);
  }

  const hoursAtHome = 24 - applicant.hoursAwayPerDay;
  if (animal.energy >= 4 && hoursAtHome >= 16) {
    lines.push(`${animal.name} is high-energy, and ${applicant.name} is home ${hoursAtHome} hours a day.`);
  }

  if (applicant.hasYard && animal.energy >= 4) {
    lines.push(`A yard for an animal of ${animal.name}\u2019s energy level.`);
  }

  if (animal.needsQuietHome && !applicant.hasChildren && !applicant.hasOtherPets) {
    lines.push(`${animal.name} needs a quiet home, and this household is one.`);
  }

  if (animal.dailyMedication && applicant.canDoDailyMeds) {
    lines.push(`${applicant.name} can administer ${animal.name}\u2019s daily medication.`);
  }

  if (animal.specialNeeds.length > 0 && applicant.experience >= 3) {
    lines.push(
      `${animal.name}\u2019s ongoing needs (${animal.specialNeeds.join(', ')}) are within this household\u2019s capacity.`,
    );
  }

  // Applicant side — what this animal gives the household.
  if (applicant.prefersSpecies !== null && applicant.prefersSpecies === animal.species) {
    lines.push(`${applicant.name} asked for a ${animal.species}.`);
  }

  if (applicant.prefersAge !== null && applicant.prefersAge === ageBand(animal)) {
    const article = applicant.prefersAge === 'adult' ? 'an' : 'a';
    lines.push(
      `${applicant.name} asked for ${article} ${applicant.prefersAge} animal; ${animal.name} is ${animal.ageYears}.`,
    );
  }

  if (animal.daysInShelter >= 180) {
    lines.push(`${animal.name} has been waiting ${animal.daysInShelter} days.`);
  }

  return lines;
}

/**
 * What changes if this applicant is removed from the cohort.
 *
 * Computed by re-running the pipeline without them — never asserted. The
 * re-run is explanation-free, which is what stops this recursing.
 */
export function buildCounterfactual(
  cohort: Cohort,
  animalId: string,
  applicantId: string,
  rerun: (reduced: Cohort) => Map<string, string>,
): string {
  const animal = cohort.animals.find((candidate) => candidate.id === animalId);
  const applicant = cohort.applicants.find((candidate) => candidate.id === applicantId);
  if (animal === undefined || applicant === undefined) return '';

  const reduced: Cohort = {
    animals: cohort.animals,
    applicants: cohort.applicants.filter((candidate) => candidate.id !== applicantId),
  };

  const without = rerun(reduced);
  const replacement = without.get(animalId);

  if (replacement === undefined) {
    return `Without ${applicant.name}, ${animal.name} goes unmatched.`;
  }

  const replacementName =
    cohort.applicants.find((candidate) => candidate.id === replacement)?.name ?? replacement;
  return `Without ${applicant.name}, ${animal.name} goes to ${replacementName}.`;
}

/**
 * The adopter profile this animal needs and this cohort does not contain.
 *
 * Generated, not authored — it falls out of the constraints that eliminated
 * every applicant, so it can only ever describe a real gap.
 */
export function buildRecruitmentProfile(animal: Animal): string {
  const requirements: string[] = [];

  if (animal.needsYard) requirements.push('a home with a yard');
  if (animal.needsQuietHome) requirements.push('a quiet household with no children and no other pets');
  if (!animal.okWithChildren && !animal.needsQuietHome) requirements.push('no children in the home');
  if (!animal.okWithOtherPets && !animal.needsQuietHome) requirements.push('no other pets');
  if (animal.dailyMedication) requirements.push('willing to give daily medication');
  if (animal.behaviouralDifficulty >= 4) {
    requirements.push(`experience level ${animal.behaviouralDifficulty - 1} or above`);
  }
  if (animal.energy >= 4) requirements.push('at home most of the day');
  requirements.push(`able to take an animal of ${animal.sizeKg}kg`);

  return `To place ${animal.name}, this shelter needs an adopter with: ${requirements.join('; ')}.`;
}
