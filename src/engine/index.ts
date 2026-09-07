// The ONLY public surface of the engine — kyndra-architecture-final.md §3.
//
// Nothing outside `src/engine/` may import an engine internal. The UI calls
// runMatch() and reads the MatchResult; that is the whole contract.
//
// PHASE 0: signature only. The pipeline (Architecture §6) is P0 work.

import type { Cohort, MatchOptions, MatchResult } from './types';

export type {
  Animal,
  Applicant,
  Cohort,
  Constraint,
  Assignment,
  UnmatchedAnimal,
  MatchResult,
  MatchOptions,
} from './types';

/**
 * Run the full matching pipeline over a cohort.
 *
 * Architecture §6: filter → derive → equity → match → verify → explain →
 * measure → model.
 *
 * @throws Always, until the pipeline is implemented in P0.
 */
export function runMatch(_cohort: Cohort, _options: MatchOptions): MatchResult {
  throw new Error('runMatch: not implemented — Architecture §6, P0 work');
}
