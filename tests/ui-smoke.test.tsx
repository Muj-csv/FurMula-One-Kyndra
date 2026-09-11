// @vitest-environment jsdom
//
// UI smoke tests — the floor the redesign is allowed to move above.
//
// Before these existed the suite protected zero UI: only `avatarHue`, a pure
// function, was imported from a component, so every screen could break while
// `npm test` stayed green. That is a bad position from which to restyle every
// page, which is what the UI/UX redesign does.
//
// ─── WHAT THESE ASSERT, AND WHY IT IS NOT COPY ─────────────────────────────
//
// Phase 7 of the redesign rewrites every visible string in the application.
// A smoke test that finds a button by its label would fail on the language
// pass and teach the next person that the suite cries wolf. So these drive
// the app through `data-testid` hooks on exactly three controls, and assert
// on STRUCTURE and ENGINE AGREEMENT instead:
//
//   - each page mounts without throwing
//   - the cohort renders one card per animal in the cohort
//   - running the demo cohort renders exactly the placements the engine
//     itself returns — the UI is not allowed to drop or invent one
//
// Rename any heading, any button, any sentence: these still pass. Break a
// screen, and they don't.

import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen, fireEvent, within } from '@testing-library/react';
import { App } from '../src/App';
import { COHORT } from '../src/data/cohort';
import { runMatch } from '../src/engine';

afterEach(() => {
  cleanup();
  window.location.hash = '';
});

/** Mount the app on a given page, the same way a visitor arrives at a URL. */
function renderAt(hash: string) {
  window.location.hash = hash;
  return render(<App />);
}

describe('every page mounts', () => {
  for (const hash of ['', 'cohort', 'match', 'evidence']) {
    it(`renders "${hash === '' ? 'home' : hash}" without throwing`, () => {
      expect(() => renderAt(hash)).not.toThrow();
      // Something rendered, and it was the app shell — not an error boundary
      // or an empty root.
      expect(screen.getByRole('navigation', { name: /primary/i })).toBeTruthy();
      expect(document.querySelectorAll('h1, h2').length).toBeGreaterThan(0);
    });
  }
});

describe('cohort demo', () => {
  it('shows one card per animal in the preset cohort', () => {
    renderAt('cohort');

    const grid = screen.getByTestId('cohort-grid');
    // Cards are buttons because opening one is an action. Counting the
    // buttons inside the grid survives any restyle of the card itself.
    expect(within(grid).getAllByRole('button')).toHaveLength(COHORT.animals.length);
  });

  it('names every animal on screen — Architecture §8, "animal names in every string"', () => {
    renderAt('cohort');

    const grid = screen.getByTestId('cohort-grid');
    for (const animal of COHORT.animals) {
      expect(within(grid).getByText(animal.name)).toBeTruthy();
    }
  });
});

describe('the demo path a judge actually walks', () => {
  it('starts empty, loads the demo cohort, and places what the engine placed', () => {
    renderAt('match');

    // Try Matching starts blank on purpose (App.tsx, Phase 3) — no preset
    // data leaks into it, so there is nothing to run yet.
    expect(screen.queryByTestId('placements')).toBeNull();

    fireEvent.click(screen.getByTestId('load-demo-cohort'));
    fireEvent.click(screen.getByTestId('run-match'));

    const placements = screen.getByTestId('placements');
    // Direct children only. Each placement nests its own lists (rationale,
    // satisfied constraints), so a role query would count those too.
    const rendered = [...placements.querySelectorAll(':scope > li')];

    // The engine is the authority on how many placements exist. The dial
    // starts at 0 (pure want) — App.tsx's initial equityWeight — so this is
    // the same run the board is showing.
    const expected = runMatch(COHORT, { equityWeight: 0 });
    expect(rendered).toHaveLength(expected.assignments.length);
    expect(rendered.length).toBeGreaterThan(0);

    // And each one names its animal, so a placement can never render as an
    // anonymous row.
    for (const assignment of expected.assignments) {
      const animal = COHORT.animals.find((a) => a.id === assignment.animalId);
      expect(animal).toBeDefined();
      expect(within(placements).getAllByText(new RegExp(animal!.name)).length).toBeGreaterThan(0);
    }
  });
});
