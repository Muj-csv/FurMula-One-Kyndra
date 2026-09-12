// Palette guard — reads the real tokens out of src/index.css and measures them.
//
// ─── WHY THIS IS A TEST AND NOT A COMMENT ──────────────────────────────────
//
// The previous design pass fixed a batch of WCAG contrast failures by hand and
// recorded the measured ratios in CSS comments. Comments do not fail a build.
// The token values were then free to drift — and they had: the audit found the
// palette no longer matched the brief it was supposedly built from, and the
// page ground had become pure white in a "warm" design system.
//
// So both halves are enforced here:
//
//   1. The four brand colours and five neutrals are EXACTLY the values in
//      Kyndra_UI_UX_Redesign_Prompt.md §3. Change the brief, change this list
//      — but a value cannot quietly drift again.
//   2. Every foreground/background pair the UI actually puts together clears
//      WCAG 2.1 AA, in BOTH light and dark mode.
//
// Nothing here renders anything; it parses the stylesheet as text, which is
// why it is cheap enough to run on every commit.

import { describe, it, expect } from 'vitest';
// `?raw` rather than node:fs — the suite already reads files this way
// (tests/survey-capture.test.ts imports the converter scripts the same way),
// and it keeps this test free of @types/node.
import CSS from '../src/index.css?raw';

/** The brief's palette, §3. These are the source of truth. */
const BRIEF = {
  '--brand-terracotta': '#c66a32',
  '--brand-chile': '#a43e1e',
  '--brand-olive': '#8a8635',
  '--brand-sunset': '#eacb91',
  '--brand-ink': '#30261f',
  '--brand-background': '#f8f3e8',
  '--brand-surface': '#fff9ef',
  '--brand-muted': '#75695e',
  '--brand-border': '#dccdb8',
};

// ─── Parsing ───────────────────────────────────────────────────────────────
//
// This parser was the reason four tests failed on main, and it failed for two
// separate reasons that are both fixed below. Neither was a contrast problem;
// the palette was fine the whole time.
//
//   1. IT WAS NEWLINE-SENSITIVE. It found the end of the dark-mode block with
//      indexOf('\n}\n'). A Windows checkout has CRLF, that never matched, the
//      slice ran to end-of-file, and the "dark" map ended up holding every
//      declaration in the stylesheet.
//
//   2. IT PARSED COMMENTS AS CODE. Having over-read, it then matched `--ink:`
//      inside the prose of a CSS comment and tried to read the sentence that
//      followed as a colour.
//
// So: comments are stripped before anything else looks at the source, and
// block bounds come from brace matching rather than from a newline literal.
// Brace matching does not care what a line ends with.

/** The stylesheet with every comment removed, and newlines normalised. */
function sanitise(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\r\n/g, '\n');
}

/** Pull `--name: value;` declarations out of a block body. */
function declarations(body: string): Map<string, string> {
  const found = new Map<string, string>();
  for (const match of body.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
    const [, name, value] = match;
    if (name !== undefined && value !== undefined) found.set(name, value.trim());
  }
  return found;
}

/**
 * The body of the block whose header begins at `from`, by brace matching.
 *
 * Handles nesting, so an `@media` wrapper returns everything inside it —
 * including the `:root` block it contains — rather than stopping at the first
 * closing brace it happens to meet.
 */
function blockBody(source: string, from: number): string {
  const open = source.indexOf('{', from);
  expect(open, 'no block found after the given offset').toBeGreaterThan(-1);

  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }

  throw new Error('unbalanced braces in the stylesheet');
}

/**
 * The two token layers: `:root` and the dark-mode override.
 *
 * Dark inherits from light and replaces only what it redefines, exactly as the
 * cascade does — so a pair that only light defines is still measured in dark.
 */
function parse(source: string): { light: Map<string, string>; dark: Map<string, string> } {
  const css = sanitise(source);

  const light = declarations(blockBody(css, css.indexOf(':root')));

  // NOTE: when the theme moves off the media query and onto a `data-theme`
  // attribute, this selector is what changes — see the polish brief, Phase 3.
  const overrides = declarations(
    blockBody(css, css.indexOf('@media (prefers-color-scheme: dark)')),
  );

  const dark = new Map(light);
  for (const [name, value] of overrides) dark.set(name, value);
  return { light, dark };
}

const themes = () => parse(CSS);

/** Resolve `var(--x)` chains down to a literal hex. */
function resolve(tokens: Map<string, string>, name: string, depth = 0): string {
  const raw = tokens.get(name);
  expect(raw, `token ${name} is not defined`).toBeDefined();
  const value = (raw as string).trim();
  const alias = /^var\((--[a-z0-9-]+)\)$/i.exec(value);
  if (alias?.[1] !== undefined) {
    expect(depth, `token ${name} has a circular alias chain`).toBeLessThan(10);
    return resolve(tokens, alias[1], depth + 1);
  }
  return value;
}

// ─── Contrast ──────────────────────────────────────────────────────────────

function channels(hex: string): [number, number, number] {
  let value = hex.replace('#', '').trim();
  expect(/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value), `not a hex colour: ${hex}`).toBe(true);
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as [number, number, number];
}

/** WCAG 2.1 relative luminance. */
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

// ─── The pairs the UI actually puts together ───────────────────────────────
//
// `min` is 4.5 for body text (AA). Where a colour is literal rather than a
// token (white on a solid button fill), it is given as a hex.

const AA_TEXT = 4.5;

const PAIRS: { fg: string; bg: string; min: number; note: string }[] = [
  { fg: '--ink', bg: '--paper', min: AA_TEXT, note: 'body text on the page' },
  { fg: '--ink', bg: '--surface', min: AA_TEXT, note: 'body text on a card' },
  { fg: '--ink', bg: '--paper-warm', min: AA_TEXT, note: 'body text on the warm band' },
  { fg: '--ink-soft', bg: '--paper', min: AA_TEXT, note: 'secondary text on the page' },
  { fg: '--ink-soft', bg: '--surface', min: AA_TEXT, note: 'secondary text on a card' },
  { fg: '--ink-soft', bg: '--paper-warm', min: AA_TEXT, note: 'secondary text on the band' },
  { fg: '--ink-faint', bg: '--paper', min: AA_TEXT, note: 'metadata on the page' },
  { fg: '--ink-faint', bg: '--surface', min: AA_TEXT, note: 'metadata on a card' },

  { fg: '--terracotta-on-tint', bg: '--paper', min: AA_TEXT, note: 'brand text on the page' },
  { fg: '--terracotta-on-tint', bg: '--surface', min: AA_TEXT, note: 'brand text on a card' },
  {
    fg: '--terracotta-on-tint',
    bg: '--terracotta-tint',
    min: AA_TEXT,
    note: 'brand text on its own tint',
  },

  { fg: '--verified-readable', bg: '--paper', min: AA_TEXT, note: 'verified text on the page' },
  {
    fg: '--verified-readable',
    bg: '--verified-tint',
    min: AA_TEXT,
    note: 'verified text on its tint',
  },
  { fg: '--danger-readable', bg: '--paper', min: AA_TEXT, note: 'blocked text on the page' },
  { fg: '--danger-readable', bg: '--danger-tint', min: AA_TEXT, note: 'blocked text on its tint' },
  {
    fg: '--eliminated',
    bg: '--eliminated-tint',
    min: AA_TEXT,
    note: 'eliminated text on its tint',
  },

  // Solid fills that carry white text — the failure the "-ink" twins exist for.
  { fg: '#ffffff', bg: '--terracotta-strong', min: AA_TEXT, note: 'white on the primary button' },
  { fg: '#ffffff', bg: '--olive-strong', min: AA_TEXT, note: 'white on the olive button' },
  { fg: '#ffffff', bg: '--danger', min: AA_TEXT, note: 'white on a blocked fill' },

  // Card must separate from the page, in both modes. Not a text pair, so the
  // bar is only that it is not literally invisible.
  { fg: '--surface', bg: '--paper', min: 1.05, note: 'card lifts off the page' },
];

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('the palette matches the brief', () => {
  const { light } = themes();

  for (const [token, expected] of Object.entries(BRIEF)) {
    it(`${token} is ${expected}`, () => {
      expect(resolve(light, token).toLowerCase()).toBe(expected);
    });
  }

  it('the page ground is the warm background, not white', () => {
    // The specific regression the audit caught: a "Warm Editorial" system
    // whose page was #ffffff.
    expect(resolve(light, '--paper').toLowerCase()).toBe(BRIEF['--brand-background']);
  });
});

describe.each([
  ['light', themes().light],
  ['dark', themes().dark],
])('%s mode clears WCAG AA', (mode, tokens) => {
  for (const { fg, bg, min, note } of PAIRS) {
    it(`${note} (${fg} on ${bg})`, () => {
      const foreground = fg.startsWith('--') ? resolve(tokens, fg) : fg;
      const background = bg.startsWith('--') ? resolve(tokens, bg) : bg;
      const ratio = contrast(foreground, background);

      expect(
        ratio,
        `${mode}: ${foreground} on ${background} measured ${ratio.toFixed(2)}:1, needs ${min}:1`,
      ).toBeGreaterThanOrEqual(min);
    });
  }
});

describe('dark mode is warm, not a void', () => {
  const { dark } = themes();

  it('the dark page ground keeps a warm cast rather than going near-black', () => {
    const [r, , b] = channels(resolve(dark, '--paper'));
    // Warm means the red channel leads the blue one. A neutral or cool grey
    // would fail this, which is the point.
    expect(r).toBeGreaterThan(b);
    // And it is lifted off black — the previous ground was #211a13.
    expect(luminance(resolve(dark, '--paper'))).toBeGreaterThan(luminance('#211a13'));
  });
});

describe('the parser itself', () => {
  // Both failure modes that took this suite red on main, pinned. Neither was
  // a contrast bug — they were bugs in the thing that MEASURES contrast, which
  // is worse: a broken measuring tool reports success.
  const { light, dark } = themes();

  it('found a real token block, not a slice of the whole stylesheet', () => {
    expect(light.size).toBeGreaterThan(20);
    // Dark overrides a subset of light and adds nothing new, so the two maps
    // hold the same keys. If dark ever grows past light, the block bounds have
    // run away again and it is swallowing the rest of the file.
    expect(dark.size).toBe(light.size);
  });

  it('parses a CRLF checkout identically to an LF one', () => {
    const crlf = parse(CSS.split('\n').join('\r\n'));
    expect(crlf.light.size).toBe(light.size);
    expect(crlf.dark.size).toBe(dark.size);
    expect(crlf.dark.get('--paper')).toBe(dark.get('--paper'));
  });

  it('does not read a token name written inside a comment', () => {
    // The comment declares a token that exists NOWHERE else in the stylesheet.
    // If the parser picks it up, it can only have come from the comment.
    //
    // An earlier version of this test injected `--ink:` instead, and passed
    // even with comment-stripping disabled — because the real `--ink`
    // declaration sits further down the same block and overwrote the bogus
    // entry. It was testing nothing.
    const withComment = CSS.replace(
      ':root {',
      ':root {\n  /* --not-a-real-token: prose, not a declaration; */',
    );
    expect(parse(withComment).light.has('--not-a-real-token')).toBe(false);
  });
});
