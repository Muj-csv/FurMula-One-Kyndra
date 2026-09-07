// Cohort generator — powers BOTH property tests and the 500-cohort randomised
// aggregate (Architecture §7). Seeded, so a failing case is reproducible from
// its seed alone rather than from a stack trace.
//
// Generated cohorts are deliberately unkind: strictness is drawn wide enough
// that some cohorts strand animals and others place everyone. A generator that
// only produced comfortable cohorts would prove nothing.

import type { Animal, Applicant, Cohort } from './types';

/** mulberry32 — small, fast, and reproducible across engines. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Rng {
  private readonly next: () => number;

  constructor(seed: number) {
    this.next = mulberry32(seed);
  }

  float(): number {
    return this.next();
  }

  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  bool(probability = 0.5): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    const item = items[Math.floor(this.next() * items.length)];
    if (item === undefined) throw new Error('Rng.pick: empty list');
    return item;
  }
}

type Level = 1 | 2 | 3 | 4 | 5;
const LEVELS: readonly Level[] = [1, 2, 3, 4, 5];

export function randomCohort(seed = 0): Cohort {
  const rng = new Rng(seed + 1);

  const animalCount = rng.int(3, 12);
  const applicantCount = rng.int(3, 16);

  const animals: Animal[] = [];
  for (let i = 0; i < animalCount; i++) {
    const species = rng.bool(0.65) ? 'dog' : 'cat';
    animals.push({
      id: `a${String(i).padStart(3, '0')}`,
      name: `Animal ${i}`,
      photo: '',
      species,
      ageYears: rng.int(0, 14),
      sizeKg: species === 'dog' ? rng.int(3, 45) : rng.int(2, 9),
      energy: rng.pick(LEVELS),
      behaviouralDifficulty: rng.pick(LEVELS),
      okWithChildren: rng.bool(0.6),
      okWithOtherPets: rng.bool(0.6),
      needsYard: rng.bool(0.3),
      needsQuietHome: rng.bool(0.25),
      dailyMedication: rng.bool(0.2),
      specialNeeds: rng.bool(0.25) ? ['ongoing care'] : [],
      daysInShelter: rng.int(1, 500),
    });
  }

  const applicants: Applicant[] = [];
  for (let i = 0; i < applicantCount; i++) {
    const homeType = rng.bool(0.5) ? 'house' : 'apartment';
    applicants.push({
      id: `p${String(i).padStart(3, '0')}`,
      name: `Household ${i}`,
      surveyed: false,
      homeType,
      hasYard: homeType === 'house' ? rng.bool(0.75) : rng.bool(0.1),
      hoursAwayPerDay: rng.int(0, 12),
      hasChildren: rng.bool(0.4),
      hasOtherPets: rng.bool(0.4),
      experience: rng.pick(LEVELS),
      canDoDailyMeds: rng.bool(0.6),
      maxSizeKg: rng.int(5, 50),
      specificAnimalId: null,
      prefersSpecies: rng.bool(0.7) ? (rng.bool(0.6) ? 'dog' : 'cat') : null,
      prefersAge: rng.bool(0.6) ? rng.pick(['young', 'adult', 'senior'] as const) : null,
      prefersEnergy: rng.bool(0.6) ? rng.pick(LEVELS) : null,
    });
  }

  // A minority of households arrive for a named animal — the case that must
  // never be overridden by a derived score.
  for (const applicant of applicants) {
    if (rng.bool(0.15) && animals.length > 0) {
      applicant.specificAnimalId = rng.pick(animals).id;
    }
  }

  return { animals, applicants };
}

export function randomWeight(seed = 0): number {
  return new Rng(seed + 1_000_003).float();
}
