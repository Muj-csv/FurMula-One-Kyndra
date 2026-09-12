# Kyndra — UI Polish & Professional Finish Prompt

Repository:

https://github.com/Muj-csv/FurMula-One-Kyndra.git

Project: Kyndra
Tagline: "Where the right homes meet the right animals."

Baseline commit for this work: `4f300c1` (`main`, phases 5–9 merged)

---

# 0. WHAT THIS DOCUMENT IS

The nine-phase redesign in `Kyndra_UI_UX_Redesign_Prompt.md` is **complete and
merged**. This document is the pass that comes after it.

It exists because the finished interface still reads as *generated* rather
than *designed* in a set of specific, measurable ways, and because two things
in it are outright broken.

This is **not** a second redesign. Do not re-litigate the visual direction, the
palette, the information architecture, or the copy decisions made in the
previous pass. Every finding below is either a defect, a typographic
correction, a consistency correction, or one new feature (the theme toggle).

The goal in one sentence:

> Make Kyndra look like a product a design-minded team shipped, not like a
> template that was filled in.

---

# 0.1 REQUIRED COLLABORATIVE WORKFLOW

This project has more than one person working in it. Work incrementally.

For every phase:

1. Read the findings for that phase, and confirm they still reproduce.
2. State what you found and what you propose to change.
3. Name the files you will touch, and confirm no one else is in them.
4. Implement.
5. Run the full test suite and the production build.
6. Review the rendered result in **both** themes.
7. Summarize what changed.
8. Commit, push, and open a PR — with a description (§0.3).
9. **Get that PR merged before starting the next phase.**

Step 9 is not optional. It is the primary merge-conflict control in §0.2.

## Ask before

- Changing anything in `src/engine/`
- Changing anything in `src/data/`
- Changing a research claim, a citation, or a provenance statement
- Replacing the logo or any brand asset
- Adding a runtime dependency

## Decide yourself

- Spacing, type scale, weights, measure
- Radius and border usage
- Component composition and file splits
- Easing curves and animation timing
- Exact wording of a label you are already correcting

---

# 0.2 MERGE-CONFLICT AVOIDANCE — HARD RULES

`src/index.css` is a single ~2,400-line file that nearly every phase wants to
touch. It is the conflict hotspot in this repository and most of these rules
exist because of it.

## Rule 1 — One phase in flight at a time

Branch from the latest `main`. Merge before branching again.

Do not open two phase branches that both modify `src/index.css`. If two people
must work in parallel, they take phases whose file lists (§0.4) do not
intersect — and `src/index.css` belongs to exactly one of them at a time.

## Rule 2 — Short-lived branches

One phase, one branch, one PR, merged the same working session where possible.
A branch that lives for days is a branch that conflicts.

```text
fix/ui-polish-phase-1
feat/ui-polish-phase-3-theme
```

## Rule 3 — Rebase before you push

```bash
git fetch origin
git rebase origin/main
```

Resolve conflicts on your own branch, never in the merge commit.

## Rule 4 — Append, do not reshuffle

When adding CSS, **append a new clearly-labelled block** at the end of the
relevant section rather than editing scattered declarations across the file.
Git resolves additions at different offsets cleanly; it does not resolve two
people rewriting the same forty lines.

When you must edit an existing rule, edit *only* the declarations you are
changing. Do not reorder properties, re-indent, re-wrap comments, or "tidy
while you're in there". A formatting-only change to a line someone else edited
is a conflict you created for free.

## Rule 5 — No repo-wide reformatting

No Prettier run across the tree. No import reordering. No mass comment rewraps.
If the project wants a formatter, that is its own PR on an otherwise-quiet
tree, agreed in advance.

## Rule 6 — Normalise line endings FIRST

The repo currently has **no `.gitattributes`**, and files in the working tree
have CRLF endings while the same files in history have LF. That mismatch has
already caused one real failure (§2.2) and it silently inflates every future
diff — which is exactly how whole-file conflicts happen.

Phase 1 adds `.gitattributes` and renormalises. Do this **before** any other
phase, on a quiet tree, as its own commit, so the renormalisation does not
mix with real edits.

## Rule 7 — Stay out of shared hotspots you do not need

- `src/engine/**` — single-owner, off limits (Architecture §3)
- `src/data/cohort.ts` — narrative-pinned by `tests/narrative.test.ts`
- `src/App.tsx` — touched by almost everything; change it only in the phase
  that must, and keep the diff to the lines that matter

## Rule 8 — Never force-push a shared branch

If you need to rewrite history, do it on a branch only you are on, and say so
in the PR.

---

# 0.3 COMMIT AND PUSH DESCRIPTIONS — REQUIRED

**Every commit that changes code must carry a description explaining the
change. Every push must land on a PR that has a description.** A bare subject
line is not acceptable on this work.

The reason is concrete: the previous pass produced commits such as
`Phases 5-9 ui-ux-redesign`, and there is now no record of what those five
phases actually changed, what was deliberate, or what was a trade-off. That
information is gone. Do not add to that.

## Commit message shape

```text
<type>(<scope>): <what changed, imperative, one line>

<WHY it changed — the problem, with the evidence if it was measured>

<WHAT was done — the approach, and anything non-obvious about it>

<Anything deliberately NOT done, and why>

<Test and build result>
```

Types: `fix`, `feat`, `refactor`, `perf`, `test`, `docs`, `chore`.

## Worked example

```text
fix(ui): load the hero video so the cursor scrub actually runs

The hero dog has never played. The element carries preload="none" and the
scrub hook then calls video.load() to fetch it — but Chrome honours the
preload hint during the resource selection algorithm, so load() fetches
nothing. The element sits at readyState 0 / networkState 2 indefinitely,
leaving an empty rectangle under a label that reads "Move your cursor ·
guide the dog".

Sets video.preload = 'auto' immediately before load(), which is the
documented way to defer a fetch and then commit to it. The markup keeps
preload="none" so nothing is fetched during first paint.

Not changed: the idle-callback deferral and the `pointer: fine` gate, both
of which are working as intended — this was only ever the fetch itself.

136 tests pass. Build clean.
```

## PR description shape

- What this phase changed, in plain sentences
- Which findings from this document it closes, by number
- Files touched
- Tests and build result
- Screenshots — **light and dark**
- Anything left open for the next phase

## Do not

- Mix two phases in one commit
- Mix a formatting change with a behaviour change
- Write `fix: ui stuff`, `update`, `changes`, or a phase number alone

---

# 0.4 FILE OWNERSHIP PER PHASE

Use this to check whether two phases can safely run in parallel.

| Phase | Primary files |
|---|---|
| 1 | `.gitattributes`, `tests/palette.test.ts`, `src/components/HomePage.tsx` |
| 2 | `src/components/HomePage.tsx`, `public/hero-dog.mp4`, `src/index.css` |
| 3 | `index.html`, `src/App.tsx`, `src/components/NavBar.tsx`, `src/index.css`, `tests/palette.test.ts` |
| 4 | `src/index.css`, `index.html` |
| 5 | `src/index.css`, `src/components/ResultsBoard.tsx` |
| 6 | `src/components/ResultsBoard.tsx`, `src/components/EvidencePage.tsx`, `src/App.tsx`, `src/index.css` |
| 7 | `src/components/ResultsBoard.tsx`, `src/index.css` |
| 8 | verification only — no production changes expected |

`src/index.css` appears in phases 2–7. **Those phases are strictly
sequential.** Phase 1 and Phase 3 are the only pair that could overlap, and
only if Phase 1's `palette.test.ts` work has already merged.

---

# 1. WHAT IS ALREADY DONE — DO NOT REDO

- The brand palette is correct and enforced by `tests/palette.test.ts`
- A token system exists: colour, space, radius, shadow, type scale
- Contrast clears WCAG AA in both themes, and is tested
- Progressive disclosure exists (`Disclosure`), and the results board uses it
- The language pass is done — do not rewrite copy except where a finding
  explicitly names a string
- Dead components are gone; the animal card carries needs chips
- Landing-page payload is already down from 5.3 MB to ~44 KB

---

# 2. WHAT IS BROKEN

## 2.1 The hero dog never loads

`src/components/HomePage.tsx`.

The `<video>` has `preload="none"`; the scrub hook calls `video.load()` to
fetch it on idle or on first cursor movement. Chrome honours `preload` inside
the resource selection algorithm, so `load()` fetches nothing.

Observed on `main`: `readyState: 0`, `networkState: 2`, `duration: NaN`, and
zero resource-timing entries for `hero-dog.mp4`. The file itself serves fine
— `curl` returns `200`, 4,300,623 bytes, and an in-page range `fetch` returns
`206`.

**Verification note for whoever implements this:** media elements do not load
at all inside an automated browser session, so this was diagnosed from code
and platform behaviour, not from watching it play. Confirm in a normal browser
before and after your fix.

## 2.2 Four tests fail on `main`

`tests/palette.test.ts` — "dark mode clears WCAG AA" ×4.

Not a contrast regression. The test finds the end of the dark-mode block with
`CSS.indexOf('\n}\n', …)`. The stylesheet now has **CRLF** endings, so that
never matches, the slice runs to end-of-file, and the parser picks up a later
CSS *comment* containing the text `--ink:` and tries to read it as a colour.

The test is at fault, twice: it is line-ending sensitive, and it parses
comments as declarations.

## 2.3 The scrub would feel wrong even once loaded

- `mousemove` is bound to `window` and mapped across the full viewport width,
  so the dog reacts to the cursor anywhere on the page — including while the
  hero is scrolled out of view
- Every `currentTime` write cancels the previous seek, so scrubbing a 4.2 MB
  MP4 stutters
- There is no poster frame, so any failure or delay shows an empty rectangle
  beneath a label instructing the visitor to interact with it

---

# 3. THE MEASURED FINDINGS

Taken on `main`, desktop, 1521 px viewport.

| # | Finding | Measurement |
|---|---|---|
| F1 | One typeface for every role | `--font-display` and `--font-body` are both `Plus Jakarta Sans` |
| F2 | Body measure far too wide | 98–102 characters per line; comfortable is 60–75. Most paragraphs have `max-width: none` |
| F3 | Households are serial numbers | All 22 applicants in `src/data/cohort.ts` are named `Household 01` … `Household 22` |
| F4 | Sentences set in letterspaced ALL-CAPS | 7 such labels on the results screen, e.g. `VIOLATIONS IF PLACED FIRST-COME-FIRST-SERVED`, which wraps to two lines |
| F5 | Six corner radii in use | `3px`, `4px`, `6px`, `10px`, `50%`, `999px`. The token scale defines 6/10/18/26/999 — so 3 and 4 are off-scale, and 18/26 are never used |
| F6 | Everything is a bordered box | 40 bordered elements on one screen |
| F7 | Two disclosure idioms on one screen | `Disclosure` uses a circled `+`; per-placement "View match details" uses a raw native `<details>` triangle |
| F8 | An instruction inside a label | `"What if this pairing hadn't happened? (hover)"` — italic, and unreachable on touch |
| F9 | Unattributed trust badge | `✓ Verified matching rules` — verified by whom? |
| F10 | Compliance banner above the hero | The provenance strip is the first element on every page |
| F11 | Webfont via CSS `@import` | Three-hop blocking chain before any text renders |
| F12 | Display kerning | The full stop in the hero headline is visibly detached from "animals" |
| F13 | Results board density | 1,581 words, 9.6 screens, 5 headings — still a scroll, not a dashboard |

---

# 4. WHAT MUST NOT CHANGE

- The matching engine, its public surface, and its results
- Research claims, citations, sample sizes, and the simulated/real distinction
- "Kyndra proposes. Shelter staff decide."
- The narrative values pinned by `tests/narrative.test.ts`
- The brand palette values enforced by `tests/palette.test.ts`
- No new runtime dependency, no backend, no UI framework

---

# PHASE 1 — REPAIR AND STABILISE

Closes: §2.1, §2.2, and Rule 6.

Do this first. Nothing else starts until it is merged.

1. **Add `.gitattributes`** and renormalise line endings. At minimum:

   ```text
   * text=auto eol=lf
   *.png binary
   *.mp4 binary
   ```

   Commit the renormalisation **separately** from every other change in this
   phase, and say in the message that it is whitespace-only.

2. **Fix `tests/palette.test.ts`** — strip `/* … */` comments before parsing,
   and bound the dark block with a newline-agnostic match (`\r?\n`). The test
   must fail if a contrast pair regresses and must not fail because someone
   wrote a token name in a comment.

3. **Fix the video fetch** — set `video.preload = 'auto'` immediately before
   `video.load()`. Leave the markup at `preload="none"`, leave the idle
   deferral alone, leave the `pointer: fine` gate alone.

Done when: 136 tests pass, build is clean, and the dog loads and scrubs in a
real browser.

---

# PHASE 2 — MAKE THE DOG FEEL DELIBERATE

Closes: §2.3.

- Track the cursor **relative to the hero element**, not the viewport, and
  only while the hero is on screen (`IntersectionObserver`)
- Ease toward the target rather than jumping to it — the current code snaps
- Skip a frame while `video.seeking` is `true`
- Wait for enough buffering before enabling the scrub; until then, hold a
  still frame
- Add a **poster image** so the box is never empty
- Re-encode `hero-dog.mp4` with dense keyframes and `faststart`, which is what
  makes scrubbing smooth. Keep it under the current 4.2 MB
- Reconsider the label `"Move your cursor · guide the dog"` — an interaction
  that needs an instruction is usually an interaction that is not reading as
  interactive

Done when: the scrub tracks smoothly, does nothing when the hero is off
screen, and degrades to a still image rather than a hole.

---

# PHASE 3 — LIGHT DEFAULT, WITH A THEME TOGGLE

New feature. No toggle exists today: there is only
`@media (prefers-color-scheme: dark)`, so a visitor on a dark OS gets dark
with no way out, and light is not the default.

**Light is the default. The OS preference does not decide.**

1. `:root` stays light and becomes the true default.
2. Move every dark value out of the media query into `:root[data-theme="dark"]`.
3. Remove the bare `prefers-color-scheme` query. (An optional third `system`
   state is acceptable if you want it, but `light` must be what an untouched
   first visit gets.)
4. Persist the choice in `localStorage`.
5. Apply `data-theme` from a **small inline script in `index.html`, before
   first paint.** Without this, a returning dark-mode visitor gets a white
   flash on every load.
6. Set `color-scheme` alongside the attribute so native controls, scrollbars
   and form fields follow the theme.
7. Put the control **top-right in the nav** — that space has been empty since
   the duplicate CTA was removed.
8. The control must be a real labelled button, keyboard reachable, with its
   state announced. Not an unlabelled icon.
9. Update `tests/palette.test.ts` to read dark values from the new selector.

Done when: a first visit is light, the toggle switches instantly with no
flash, the choice survives reload, and the palette test still measures both
themes.

---

# PHASE 4 — TYPOGRAPHY

Closes: F1, F2, F4, F11, F12. **This is the phase that buys the most.**

1. **Pair two typefaces.** One face doing headlines, body, labels and numbers
   is the single most recognisable generated-site signature. "Warm Editorial"
   wants a text/display pairing — a serif for headlines and large numbers,
   against the existing sans for UI and body. Keep the total webfont payload
   honest.
2. **Cap the measure at 60–75 characters** on every text block. Today most
   paragraphs have no `max-width` and run to 98–102. This alone changes how
   considered the page reads.
3. **Kill long ALL-CAPS runs.** Stat labels and similar become sentence case,
   with weight and colour carrying the hierarchy instead of letterspacing.
   Short eyebrow labels may stay caps.
4. **Move the webfont out of `@import`** into `index.html` with
   `preconnect` + `stylesheet`, or self-host it.
5. **Kern the hero headline** so the full stop sits against "animals".
6. Review the scale while you are here: weights should do more work, sizes
   fewer. Reserve the largest tier for the hero, the result count, and nothing
   else.

Done when: headlines and body are visibly different voices, no line exceeds
~75 characters, and no sentence is set in caps.

---

# PHASE 5 — TOKEN DISCIPLINE AND SURFACES

Closes: F5, F6, F7.

1. **One radius scale.** Remove the `3px` and `4px` one-offs; use the existing
   tokens. Decide deliberately whether `--radius-lg` / `--radius-xl` have a
   job — if they do not, delete them rather than leaving unused tiers.
2. **Reduce the borders.** 40 bordered elements on one screen is what
   "assembled from parts" looks like. Separate with space, type and ground
   colour; reserve a border for things that are genuinely containers. Stat
   tiles, callouts and disclosure rows should not all get identical treatment.
3. **One disclosure idiom.** Style the native `<details>` marker on
   "View match details" to match the `Disclosure` component's circled `+`, or
   convert it to that component.
4. Check both themes after every change in this phase — surfaces are where
   dark mode breaks.

Done when: a screenshot of any screen shows a clear hierarchy of surfaces
rather than a uniform field of outlined rectangles.

---

# PHASE 6 — IDENTITY AND TRUST SIGNALS

Closes: F3, F9, F10.

1. **Households read as placeholder data.** Every applicant is literally named
   `Household 01` … `Household 22`, so every result row reads
   "Barnaby → Household 22". Animals get real names; households get serial
   numbers.

   There is a genuine tension here: the provenance line says "placeholder
   households", so the numbering is arguably deliberate honesty, and
   `src/data/cohort.ts` is narrative-pinned and off limits under Rule 7.

   **Preferred fix — presentational, no data change, claims nothing:** keep
   the name and render a one-line descriptor beside it from fields the engine
   already has, e.g. *"Household 22 · Apartment, no pets, home most of the
   day"*. Each row becomes distinct and informative.

   **Ask before** doing anything that renames the records themselves.

2. **`✓ Verified matching rules`** — attribute it or remove it. An
   unattributed trust badge reads as decoration and slightly *reduces*
   credibility on a page whose entire argument is transparency.

3. **The provenance strip sits above the hero** on every page. Right
   information, wrong altitude — it is the first thing a judge sees, before
   they know what the product is. Keep it prominent on the pages where the
   cohort actually appears; on the Overview, let the hero land first.

4. **The logo** is a 3D glassmorphic paw in teal-green and orange — off
   palette against Terracotta/Olive, and it reads as generated art. A flat
   mark in the brand palette would look deliberate. **Ask before changing it;**
   it is a brand asset, not a UI decision.

---

# PHASE 7 — THE RESULTS BOARD

Closes: F8, F13.

The brief called this the most important screen. It is still 1,581 words over
9.6 screens with five headings.

1. Give the outcome a **moment** — the "MATCHING COMPLETE" chip and the four
   stat tiles are there, but they read as a status bar rather than a result.
2. Reduce what is visible at rest. The disclosures were the right instinct;
   the placements list itself is 14 near-identical bordered blocks.
3. Make each placement card **visually connect** the animal and the household,
   rather than being a row of text with an arrow in it.
4. **Fix F8:** `"What if this pairing hadn't happened? (hover)"` puts an
   instruction inside a label, is italicised, and is unreachable on touch.
   Make it a real toggle with a real label.

Done when: the first screen after a run answers "what happened?" without
scrolling, and the detail is reachable in one click.

---

# PHASE 8 — VERIFICATION

No production changes expected. If this phase finds something, it becomes its
own fix commit with its own description.

Check, on the merged result:

- `npm test` — all green
- `npm run build` — clean
- Every page, **light and dark**
- First visit with no `localStorage` is light
- Desktop, tablet, mobile; no horizontal scrollbar at any width
- Keyboard only: every control reachable, focus always visible
- `prefers-reduced-motion` honoured, including the new easing in Phase 2
- The full demo path end to end: cohort → run → inspect → why-not → swap →
  equity → unmatched → evidence

---

# 9. TESTING REQUIREMENTS

After **every** phase:

```bash
npm test
npm run build
```

Both must pass before the PR opens. A phase is not done because it compiles.

If you change a token, the palette test must still measure it. If you change
a page's structure, the smoke tests must still pass — and if they do not,
establish whether the test or the page is wrong before changing either.

Do not weaken a test to make a phase pass.

---

# 10. FINAL ACCEPTANCE

1. Does the hero dog load and track smoothly in a real browser?
2. Is a first visit light, and does the toggle persist?
3. Do headlines and body text read as two deliberate voices?
4. Does any line of body text exceed ~75 characters?
5. Is any sentence still set in letterspaced capitals?
6. How many corner radii are in use? (Answer should be three or fewer.)
7. Does any screen still read as a uniform field of outlined boxes?
8. Does a result row identify the household as something other than a number?
9. Does the results screen answer "what happened?" without scrolling?
10. Does every commit in the branch explain *why* it exists?
11. Did any phase produce a merge conflict? If so, which rule in §0.2 would
    have prevented it?

---

# 11. FINAL RESPONSE

When the work is complete, report:

1. Summary of what changed, phase by phase
2. Findings closed, by number, and any left open with the reason
3. Files changed
4. Before/after screenshots in both themes
5. Test and build results
6. Branches used and PRs opened
7. Any recommendation you made that was declined, and by whom
8. Anything you would do next

Do not report a phase as complete because the code compiles. Report it as
complete when you have looked at it.
