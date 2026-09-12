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
import { ApplicantIntake } from '../src/components/ApplicantIntake';
import { COHORT } from '../src/data/cohort';
import { runMatch } from '../src/engine';

afterEach(() => {
  cleanup();
  window.location.hash = '';
  // The theme is document-level state, so it outlives an unmounted tree.
  document.documentElement.removeAttribute('data-theme');
  localStorage.clear();
});

/** Mount the app on a given page, the same way a visitor arrives at a URL. */
function renderAt(hash: string) {
  window.location.hash = hash;
  return render(<App />);
}

/**
 * Answer the one media query the hero asks about.
 *
 * jsdom has no matchMedia at all, so without this the component reads
 * "no preference expressed" and the reduced-motion branch is never reached.
 * Callers restore the original — this stubs a global.
 */
function stubReducedMotion(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reduced : false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
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

describe('households are described, not just numbered', () => {
  it('gives every placement row a household description, and they differ', () => {
    renderAt('match');
    fireEvent.click(screen.getByTestId('load-demo-cohort'));
    fireEvent.click(screen.getByTestId('run-match'));

    const rows = [...screen.getByTestId('placements').querySelectorAll(':scope > li')];
    // The description sits on the household side of the match. It was its own
    // .pair__household paragraph until Phase 7 folded it into the two-sided
    // card, where it belongs to the household rather than floating under both.
    const described = rows.map(
      (row) => row.querySelector('.pair__side--household .pair__side-meta')?.textContent ?? '',
    );

    expect(described).toHaveLength(rows.length);
    expect(described.every((text) => text.length > 0)).toBe(true);

    // The point of the descriptor is that "Household 14" and "Household 22"
    // stop being interchangeable. If every row says the same thing it has
    // added words without adding information.
    expect(new Set(described).size).toBeGreaterThan(1);
  });
});

describe('the counterfactual is reachable without a mouse', () => {
  // Audit F8. It used to be a hover-reveal, labelled "What if this pairing
  // hadn't happened? (hover)" — an instruction inside a label, with the
  // answer behind :hover and :focus-within. On a touch device there is no
  // hover, so the content simply could not be reached.
  it('lives inside a real disclosure, not behind :hover', () => {
    renderAt('match');
    fireEvent.click(screen.getByTestId('load-demo-cohort'));
    fireEvent.click(screen.getByTestId('run-match'));

    const firstRow = screen.getByTestId('placements').querySelector(':scope > li');
    expect(firstRow).toBeTruthy();

    // No trigger, and no "(hover)" anywhere in the instructions.
    expect(firstRow!.querySelector('.pair__counterfactual-trigger')).toBeNull();
    expect(firstRow!.textContent).not.toMatch(/\(hover\)/i);

    // The answer is inside a <details> the user can open — which is what
    // makes it work on a touchscreen.
    const details = firstRow!.querySelector('details');
    expect(details).toBeTruthy();
    expect(details!.querySelector('.pair__counterfactual')?.textContent ?? '').not.toBe('');
  });
});

describe('the simulated-cohort disclosure', () => {
  // PRD §3.1 wants it wherever the cohort appears — and only there. Overview
  // is presentational: no animals, no households, no counts. A disclaimer
  // about data that is not on screen is noise, and noise is what trains
  // people to skip the notices that matter.
  it('is absent on Overview, which shows no cohort', () => {
    renderAt('');
    expect(document.querySelector('.provenance')).toBeNull();
  });

  for (const hash of ['cohort', 'match', 'evidence']) {
    it(`is present on "${hash}", which does`, () => {
      renderAt(hash);
      expect(document.querySelector('.provenance')).toBeTruthy();
    });
  }
});

describe('theme', () => {
  // The brief's requirement is blunt: light is the default and the operating
  // system does not get a vote. Before this, the only dark-mode mechanism was
  // `@media (prefers-color-scheme: dark)` — so a visitor on a dark OS got
  // dark with no way back, and light was never what a first visit looked
  // like.
  const toggle = () => screen.getByRole('button', { name: /dark mode/i });

  it('is light on a first visit, with nothing remembered', () => {
    renderAt('');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(toggle().getAttribute('aria-pressed')).toBe('false');
  });

  it('switches to dark and remembers the choice', () => {
    renderAt('');
    fireEvent.click(toggle());

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
    // Remembered, so the bootstrap in index.html can apply it before the next
    // first paint rather than flashing light and repainting.
    expect(localStorage.getItem('kyndra-theme')).toBe('dark');
  });

  it('adopts the theme the pre-paint bootstrap already applied', () => {
    // What index.html does before React exists. App must READ this, not
    // re-derive it — two pieces of code deciding the same thing independently
    // is how they end up disagreeing.
    document.documentElement.setAttribute('data-theme', 'dark');
    renderAt('');
    expect(toggle().getAttribute('aria-pressed')).toBe('true');
  });
});

/**
 * The hero dog is an ambient loop, and the only thing about it worth pinning
 * is that it stays ambient: it must autoplay silently, repeat forever, never
 * demand a gesture, and never play for someone who asked for less motion.
 *
 * The cursor-tracking tests that used to live here are gone with the feature
 * — there is no pointer behaviour left to guard.
 */
describe('the hero dog loop', () => {
  const heroVideo = () => document.querySelector('.hero-dog__video') as HTMLVideoElement | null;

  it('is a muted, looping, inline autoplay video', () => {
    renderAt('');
    const video = heroVideo();
    expect(video).toBeTruthy();
    // muted + playsInline are what make autoplay permissible at all; without
    // either one, browsers refuse and the hero silently becomes a poster.
    expect(video?.hasAttribute('muted') || video?.muted).toBeTruthy();
    expect(video?.hasAttribute('playsinline')).toBe(true);
    expect(video?.hasAttribute('loop')).toBe(true);
    expect(video?.hasAttribute('autoplay')).toBe(true);
    expect(video?.hasAttribute('controls')).toBe(false);
  });

  it('carries a poster, so the box is never an empty rectangle', () => {
    renderAt('');
    // This is the whole fallback story: before the video arrives, if it never
    // arrives, and under reduced motion, the poster is what stands in.
    expect(heroVideo()?.getAttribute('poster')).toBe('/hero-dog-poster.webp');
    // Intrinsic size on the element, so the box does not reflow on decode.
    expect(heroVideo()?.getAttribute('width')).toBe('720');
    expect(heroVideo()?.getAttribute('height')).toBe('1280');
  });

  it('is described once, as a picture, not as a media player', () => {
    renderAt('');
    const stage = document.querySelector('.hero-dog');
    // A decorative autoplaying video announces nothing useful on its own, and
    // would offer media controls it does not have. The wrapper carries the
    // description; the video is hidden from assistive tech.
    expect(stage?.getAttribute('role')).toBe('img');
    expect(stage?.getAttribute('aria-label')).toMatch(/\w/);
    expect(heroVideo()?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not autoplay for a visitor who asked for reduced motion', () => {
    const realMatchMedia = window.matchMedia;
    stubReducedMotion(true);
    try {
      renderAt('');
      // The attribute is the only thing that can decide the FIRST frame,
      // before any effect has run — so it has to be absent, not merely
      // countermanded afterwards.
      expect(heroVideo()?.hasAttribute('autoplay')).toBe(false);
    } finally {
      window.matchMedia = realMatchMedia;
    }
  });

  // POSITIVE CONTROL for the test above. Without it, that assertion would
  // keep passing if the stub stopped reaching the component at all.
  it('does autoplay when no such preference is expressed', () => {
    const realMatchMedia = window.matchMedia;
    stubReducedMotion(false);
    try {
      renderAt('');
      expect(heroVideo()?.hasAttribute('autoplay')).toBe(true);
    } finally {
      window.matchMedia = realMatchMedia;
    }
  });
});

describe('household intake', () => {
  it('never lets a cleared size field become a 0kg limit', () => {
    // Number('') is 0, and maxSizeKg 0 fails the size constraint for EVERY
    // animal in the cohort — so a visitor who cleared the field to retype it
    // got "no matches" with nothing on screen explaining why. The min/max
    // attributes do not prevent this: they gate submission, not the value
    // React stores as you type.
    render(<ApplicantIntake animals={COHORT.animals} nextId="p99" onSubmit={() => {}} />);

    const size = screen.getByLabelText(/largest animal/i) as HTMLInputElement;
    fireEvent.change(size, { target: { value: '' } });
    expect(Number(size.value)).toBeGreaterThan(0);

    // And the stated ceiling holds from the other end too.
    fireEvent.change(size, { target: { value: '999' } });
    expect(Number(size.value)).toBeLessThanOrEqual(70);
  });
});
