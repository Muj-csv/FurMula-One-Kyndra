// Domain types — kyndra-architecture-final.md §4.
//
// These live inside the engine because the engine owns the domain, and are
// re-exported from `engine/index.ts` so that `src/data/` and
// `src/components/` can name them without importing an engine internal.

import type { RESEARCH } from '../data/researchConstants';

// ─── Domain ────────────────────────────────────────────────────────────────

export interface Animal {
  id: string;
  name: string; // used in every UI string — never animal_07
  photo: string; // free-licence source, attributed
  species: 'dog' | 'cat';
  ageYears: number;
  sizeKg: number;
  energy: 1 | 2 | 3 | 4 | 5;
  behaviouralDifficulty: 1 | 2 | 3 | 4 | 5;
  okWithChildren: boolean;
  okWithOtherPets: boolean;
  needsYard: boolean;
  needsQuietHome: boolean;
  dailyMedication: boolean;
  specialNeeds: string[];
  daysInShelter: number; // drives the equity dial and the story
}

export interface Applicant {
  id: string;
  name: string;
  surveyed: boolean; // true for the ~20 real households

  // Household facts — the SHELTER side ranks on these
  homeType: 'apartment' | 'house';
  hasYard: boolean;
  hoursAwayPerDay: number;
  hasChildren: boolean;
  hasOtherPets: boolean;
  experience: 1 | 2 | 3 | 4 | 5;
  canDoDailyMeds: boolean;
  maxSizeKg: number;

  // Wants — the APPLICANT side ranks on these, and only these
  specificAnimalId: string | null; // the animal they came for
  prefersSpecies: 'dog' | 'cat' | null;
  prefersAge: 'young' | 'adult' | 'senior' | null;
  prefersEnergy: 1 | 2 | 3 | 4 | 5 | null;
}

export interface Cohort {
  animals: Animal[];
  applicants: Applicant[];
}

// ─── Constraints ───────────────────────────────────────────────────────────

export interface Constraint {
  id: string;
  label: string; // shown in "why not?"
  test: (a: Animal, p: Applicant) => boolean; // true = pair viable
  preventsReturnCause: string; // shown in the UI
  citationKey: keyof typeof RESEARCH;
}

// ─── Results ───────────────────────────────────────────────────────────────

export interface Assignment {
  animalId: string;
  applicantId: string;
  constraintsSatisfied: string[];
  applicantRankOfAnimal: number;
  shelterRankOfApplicant: number;
  equityBoostApplied: number; // 0 when the dial changed nothing
  rationale: string[];
  counterfactual: string; // "without Marie, Bruno goes unmatched"
}

export interface UnmatchedAnimal {
  animalId: string;
  blockedBy: { applicantId: string; failedConstraint: string }[];
  recruitmentProfile: string; // generated: "house with yard, no young children"
}

export interface MatchResult {
  assignments: Assignment[];
  unmatchedAnimals: UnmatchedAnimal[];
  unmatchedApplicants: { id: string; reason: string }[];
  isStable: boolean;
  blockingPairs: [string, string][]; // expected: empty
  equityWeight: number;
  regret: {
    worstAnimalRank: number; // how far down its list the worst-off matched
    worstApplicantRank: number;
    meanAnimalRank: number;
  };
}

// ─── Engine options ────────────────────────────────────────────────────────

export interface MatchOptions {
  equityWeight: number; // 0–1, tie-break band only (Architecture §6 STEP 3)
  assumptionLevel?: number; // 0.4–0.6, projected-welfare scaling (STEP 8)
}
