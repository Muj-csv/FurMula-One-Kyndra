// PHASE 0 — test infrastructure only.
//
// This file exists to prove Vitest is installed, configured, and running.
// It is NOT an algorithmic test.
//
// The two property tests (stability; equity safety), the 500-cohort randomised
// aggregate, and the human-baseline record are written alongside the matching
// engine in P0 — never before it. Architecture §7: a test written after the
// fact against code that already passed by luck proves nothing, and a green
// suite over unimplemented code is the one result this project cannot afford
// to show a judge.
//
// Accordingly, the only behaviour asserted below is that the engine correctly
// reports itself as unimplemented.

import { describe, it, expect } from 'vitest';
import { runMatch } from '../src/engine';

describe('Phase 0 — harness', () => {
  it('runs a trivial passing test', () => {
    expect(true).toBe(true);
  });
});

describe('Phase 0 — engine boundary', () => {
  it('exposes runMatch from the engine public surface', () => {
    expect(typeof runMatch).toBe('function');
  });

  it('throws rather than returning a fabricated result', () => {
    expect(() => runMatch({ animals: [], applicants: [] }, { equityWeight: 0 }))
      .toThrow(/not implemented/);
  });
});
