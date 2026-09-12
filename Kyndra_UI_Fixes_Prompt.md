# Kyndra — UI Fixes Prompt

Repository:

https://github.com/Muj-csv/FurMula-One-Kyndra.git

Project: Kyndra
Tagline: "Where the right homes meet the right animals."

Source: twelve annotated screenshots, where each filename states the fix
wanted for the part of the interface shown.

---

# 0. WHAT THIS IS

A punch list, not a redesign and not a phase plan.

`Kyndra_UI_UX_Redesign_Prompt.md` and `Kyndra_UI_Polish_Prompt.md` are both
complete and merged. What is left is small: spacing, labels, a few layout
decisions that read as cluttered, and two genuine defects.

**This is one pass, not eight phases.** Every item below is independent and
most are a few lines. Work down the list, or pick off whichever are blocking —
there is no ordering requirement except where an item says so.

Do not reopen the visual direction, the palette, the typography or the
information architecture. Those decisions stand.

---

# 0.1 THE RULES THAT STILL APPLY

Three carry over from the polish brief. They are short, so they are restated
here rather than cross-referenced.

## Frontend only

**Nothing in this document may alter the backend.**

May change: `src/components/**`, `src/App.tsx`, `src/index.css`, `index.html`,
`public/**`, `tests/palette.test.ts`, `tests/ui-smoke.test.tsx`.

Must not change: `src/engine/**`, `src/data/**`, `scripts/**`, and the seven
tests that pin engine and data behaviour (`engine`, `narrative`,
`cohort-editing`, `human-baseline`, `aggregate-report`, `photos`,
`survey-capture`).

The UI reads the engine and the data. It never writes to them and never
adjusts them to make a screen look better. Verify before every PR:

```bash
git diff --name-only origin/main...HEAD \
  | grep -E '^(src/engine|src/data|scripts)/' \
  && echo 'BACKEND TOUCHED — stop and revert' \
  || echo 'frontend only'
```

## Commit descriptions are required

Every commit explains **why** it exists, not just what changed. Subject line,
blank line, then the problem, the approach, anything deliberately not done,
and the test result. A bare subject is not acceptable.

Group related fixes into one commit where they share a cause (items 3, 4 and
7 below are all "the Matching page header is doing too much"). Do not put all
ten in a single commit called "ui fixes".

## Merge conflicts

`src/index.css` is one ~3,000-line file and most of these touch it. So:
branch from the latest `main`, keep the branch short-lived, rebase before
pushing, and **append new rules as labelled blocks rather than editing
scattered declarations in place**. No repo-wide reformatting.

---

# 0.2 BEFORE YOU START

Several of these screenshots were taken against a build that predates the
final merges. Reproduce each one first. If an item no longer occurs, say so
and move on rather than "fixing" something that is already correct.

Two are known to be in that category — see items 10 and 8.

---

# THE FIXES

---

## 1. The theme toggle's label contradicts its icon

**Screenshot:** `Text displayed does not reflect the type of mode.png`
**Where:** `src/components/NavBar.tsx`, the `ThemeToggle` component

**What is wrong.** In light mode the control shows a **sun** icon next to the
words **"Dark mode"**. The icon says "you are in light mode"; the text reads
as "you are in dark mode". One of them is describing the current state and
the other is describing the setting's name, and a visitor cannot tell which.

The underlying markup is not wrong — `aria-pressed` makes "Dark mode" the
name of a setting that is on or off, which is correct for a screen reader.
The problem is that sighted users get no `aria-pressed`; they get a sun and
a contradictory word.

**Fix.** Make the icon and the visible text describe the **same thing**. Two
defensible options — pick one and apply it consistently:

- **Name the action:** moon icon + "Switch to dark" in light mode; sun icon +
  "Switch to light" in dark mode.
- **Name the current state:** sun + "Light mode" in light; moon + "Dark mode"
  in dark.

If you keep `aria-pressed`, the accessible name must stay stable across
states ("Dark mode"), so the *action* wording needs the label moved to
`aria-label` while the visible text changes. If that gets awkward, drop
`aria-pressed` and use a plain button whose accessible name is the action —
simpler, and still correct.

Keep the icon-only collapse below 900px, and keep the `title`.

---

## 2. A stray `0` blocks the number fields

**Screenshot:** `Fix 0 overriding the display.png`
**Where:** `src/components/AnimalIntake.tsx` (visible case),
`src/components/ApplicantIntake.tsx` (same cause)

**What is wrong.** The screenshot shows `0200` in "Days in shelter". The
cause is one line:

```tsx
onChange={(event) => set('daysInShelter', Number(event.target.value))}
```

`Number('')` is `0`. So the instant a visitor clears the field to retype it,
the state becomes `0` and React writes a literal `0` straight back into the
box. The field **cannot be empty**. Anything typed next lands beside that
zero, and you get `0200`.

`ApplicantIntake` has the same root cause. Its `setNumber` clamps to a
minimum, which fixed a real engine bug (a `0` size limit silently eliminated
every animal) but produces the same annoyance: clearing the field snaps it to
`1`.

**Fix.** Let the input be empty **while editing**, and coerce only when the
value is actually used. Keep the field's own text in local state, allow `''`,
and parse to a number on blur or on submit — falling back to the existing
default rather than to `0`.

Keep ApplicantIntake's clamping behaviour on submit: the `maxSizeKg` guard is
load-bearing and there is a test pinning it. Only the *typing* experience
changes.

A cheap partial improvement, if the full fix is too invasive: select the
field's contents on focus, so typing replaces rather than appends. It does
not fix clearing-then-typing, so prefer the real fix.

---

## 3. The Matching page says the same thing three times

**Screenshots:** `Fix sectioning and layout. So that it looks less
cluttered.png`, `Fix step layout.png`, `Fix step layout also.png`
**Where:** `src/components/MatchPage.tsx`

**What is wrong.** Between the "Matching" heading and any actual content there
are **three separate step systems**, plus the journey dots above them:

1. A prose paragraph: *"Step 1: add animals. Step 2: add households. Step 3:
   review the cohort. Step 4: run the matching engine. Step 5: review the
   results."*
2. The `.stage-flow` pill strip: `01 Filter · 02 Derive · 03 Match · 04
   Results`
3. A second prose paragraph: *"Step 1 & 2 — add animals and households. Step
   3 — the counts below are your cohort. Step 4 — run the engine."*

They do not even agree: one has five steps about the interface, one has four
about the engine's pipeline, and one has four about the interface again.

Both prose versions are also numbered sequences written as run-on sentences,
which is the specific thing the "Fix step layout" screenshots are pointing at.

**Fix.** Keep **one**. The recommendation:

- Keep `.stage-flow`, which is the only one that reflects live state — it
  lights up as the cohort fills and the engine runs. Consider relabelling its
  pills in the visitor's language rather than the pipeline's, matching the
  Overview's five steps.
- Delete both prose paragraphs. The buttons are labelled "Add an animal",
  "Add a household", "Run the matching engine" — a numbered list telling
  someone to press buttons that already say what they do is instruction for
  its own sake.
- If any guidance survives, make it a real `<ol>`, not a paragraph with
  numbers inside it.

This is the largest item here and the one that most directly answers "looks
less cluttered".

---

## 4. The cohort count line floats with nothing to attach to

**Screenshot:** `Fix text layout display.png`
**Where:** `src/components/MatchPage.tsx`, the `.results__note` after the
action row

**What is wrong.** *"16 animals · 22 households · 352 pairwise judgements to
make by hand"* sits alone between the buttons and the results, in body-sized
muted text, with no container, heading or alignment relationship to either.
It reads as a stray line.

It is also carrying two different ideas: a factual count of the cohort, and a
rhetorical point about how much work that is by hand.

**Fix.** Give it a home. Either:

- attach it to the action row as a caption belonging to that block, with
  deliberate spacing and a smaller size; or
- promote the three figures to small stat items, which is what they are —
  the same treatment the results summary already uses.

Do not simply delete it: the "352 pairwise judgements" figure is the argument
for the product, and it is derived, not asserted.

---

## 5. The process-flow arrows are misplaced, small and faint

**Screenshot:** `Fix the arrows (placement, size, and style).png`
**Where:** `src/index.css`, `.process-flow__step:not(:last-child)::after`

**What is wrong.** The connectors between the five Overview steps are text
`→` characters, and the rule pins them with `top: 14px` — so they align with
the step *numbers* rather than sitting in the middle of the gap between
cards. At `--text-sm` in `--ink-faint` they are also thin and pale enough to
read as debris rather than as direction.

**Fix.**

- **Placement:** centre them vertically in the gap (`top: 50%` with a
  translate), not pinned to the top.
- **Size:** larger. They are the only thing telling the eye these five cards
  are a sequence.
- **Style:** use the brand terracotta rather than the faint ink, and consider
  a drawn chevron via the existing `IconSprite` rather than a text glyph — a
  font arrow's weight and baseline vary between platforms, which is part of
  why these look off.

Keep the existing behaviour of hiding them when the grid wraps; an arrow
pointing right at the end of a row is worse than no arrow.

---

## 6. Put the Kyndra mark beside "What is Kyndra?"

**Screenshot:** `Add Kyndra Icon next to the text.png`
**Where:** `src/components/HomePage.tsx`, the `#what` section heading

**What is wrong.** Nothing is broken — this is an addition. The heading is
bare, and the section it introduces is the one that explains the product.

**Fix.** Place the flat paw mark before the heading text, using the existing
sprite:

```tsx
<svg className="..." viewBox="0 0 32 32" aria-hidden="true">
  <use href="#kyndra-mark" />
</svg>
```

It must be `aria-hidden` and decorative — the heading already says "Kyndra",
so announcing the mark would repeat it. Size it to the cap height of the
heading rather than a fixed pixel value, so it holds if the type scale moves.
Tint it `var(--terracotta)`, matching the nav.

Check it in both themes before calling it done.

---

## 7. Text sits against the band border

**Screenshot:** `Text too close to the edge or border.png`
**Where:** `src/index.css`, the `#what` section and `.section-band`

**What is wrong.** The last line of the "What is Kyndra?" paragraph
("…shows its work.") ends a few pixels above the top border of the tinted
band that follows it. The band has generous internal padding
(`padding-block: 56px 64px`) but the section *before* it has no bottom
spacing, so the paragraph runs straight into the boundary.

There is no generic section spacing rule in the stylesheet at all — each
section has been spaced by hand, and this one was missed.

**Fix.** Give the content sections a consistent bottom spacing rather than
patching this one instance. A single rule for `main.page > section` is
preferable to a one-off on `#what`, and will likely fix similar crowding
elsewhere.

Check the other page boundaries after changing it; a global spacing rule can
double up where a section already sets its own margin.

---

## 8. Stacked explanation paragraphs run together

**Screenshot:** `Make the explanation text layout more readable.png`
**Where:** `src/index.css` (`.results__note`), visible in
`src/components/RegretView.tsx`

**What is wrong.** Two things, one of which the screenshot may predate.

**Confirmed and still present:** `.results__note` declares **no margin**, and
the global reset sets `p { margin: 0 }`. So two consecutive notes touch with
zero gap — which is exactly what the screenshot shows in the "Is stable
actually good?" panel, where two separate explanations read as one
undifferentiated block.

**Possibly already fixed:** the very long lines in that screenshot. A measure
cap of 68 characters now applies to `.results__note`. Reproduce before
changing anything — if lines are still running to ~95 characters, the cap is
not reaching this context and that needs finding.

**Fix.** Give `.results__note` a top margin so stacked notes separate, or
better, use an owl selector so only *adjacent* notes get the gap and a single
note is unaffected. Then re-check the panel's long second paragraph: if it is
still dense after spacing, split it, but do not weaken what it says — it is
making a precise point about why animals and households have different
first-choice rates.

---

## 9. The equity guardrail is a wall of technical prose

**Screenshot:** `Make explanation text layout more readable for user.png`
**Where:** `src/components/EquityDial.tsx`, `.dial__guardrail`

**What is wrong.** One unbroken block that moves from a plain-language promise
to implementation detail without a break:

> Safety and eligibility rules always come first — this dial can never
> reinstate a pairing a hard constraint already ruled out. Within that limit,
> a longer wait can outweigh a moderate preference gap, never a decisive one.
> That guarantee is the absolute one: property test 2 proves it at every
> setting, across 500 randomised cohorts.

The first sentence is the one a visitor needs. "Property test 2" and "500
randomised cohorts" are for a technical judge and are doing nothing for
anyone else at that position on the page.

**Fix.** Split it by audience. The guarantee stays visible and plain; the
proof moves into a disclosure, or to the About page where the rest of the
evidence lives.

**Do not weaken the claim while shortening it.** `src/engine/equity.ts` is
explicit that the band is *wider than an exact tie*, and the current wording
was written deliberately to avoid overstating it. "Ties only" would be false.
Keep "a longer wait can outweigh a moderate preference gap, never a decisive
one", and keep the absolute guarantee that no hard constraint can ever be
reinstated.

---

## 10. The simulated-cohort strip

**Screenshot:** `Remove if not essential or move to the bottom of the overview
page.png`
**Where:** `src/App.tsx`

**Reproduce this one first.** It was removed from the Overview page already —
`App.tsx` renders the strip on Cohort Demo, Matching and About, and skips it
on Overview, because no cohort appears there. If you still see it on
Overview, you are looking at a stale build or a stale deployment.

**On the remaining pages: it cannot be removed.** PRD §3.1 requires the
simulated/real disclosure wherever the cohort appears, and those three pages
all show cohort data. Removing it is a research-integrity change, not a
layout one, and is out of scope for this document.

**What can change is its prominence.** It currently sits above the page
content. Moving it lower — to the foot of the page's content, or directly
above the first element that actually shows cohort data — keeps the
requirement satisfied while stopping it being the first thing a judge reads.

If you move it, it must still be **findable without hunting**. A disclosure
that is technically present but nobody sees is worse than one that is merely
in an awkward place: it satisfies the letter of PRD §3.1 and not the point of
it. Raise it with the project head before moving it below the fold.

---

# TESTING

After the work, and before the PR:

```bash
npm test
npm run build
```

Both must pass. 149 tests pass today, including all 27 engine, narrative and
aggregate tests — those must stay green and untouched.

Then check, in **both themes**:

- The four pages at desktop and at 390px
- No page-level horizontal scrolling at any width
- Keyboard only: every control reachable, focus visible
- The demo path end to end: cohort → run → inspect → swap → dial → unmatched
  → evidence

If a UI test fails, establish whether the test or the page is wrong before
changing either. Do not weaken a test to make a fix pass.

---

# ACCEPTANCE

1. Does the theme control's icon agree with its words, in both states?
2. Can a number field be cleared and retyped without fighting a stray `0`?
3. How many step systems does the Matching page show? It should be one.
4. Does the cohort count line belong to something?
5. Do the Overview arrows sit centred, in brand colour, at a size that reads
   as direction?
6. Does the mark beside "What is Kyndra?" hold up in both themes?
7. Is there breathing room between the last line of a section and the next
   boundary?
8. Do two stacked explanation paragraphs read as two paragraphs?
9. Can a non-technical visitor read the dial's guardrail and stop there, with
   the proof still available to a judge who wants it?
10. Is the simulated-cohort disclosure still obvious on every page that shows
    cohort data?
11. Does `git diff --name-only` show a single file under `src/engine/`,
    `src/data/` or `scripts/`? It must not.
12. Does every commit explain why it exists?

---

# WHAT IS NOT IN THIS DOCUMENT

Two items remain open from the polish brief and are not punch-list work:

- **The hero video poster frame and keyframe-dense re-encode.** Both need
  ffmpeg on the machine doing the work. Commands are recorded under Phase 2
  of `Kyndra_UI_Polish_Prompt.md`.
- **Confirming the hero dog in a real browser.** Media elements do not load
  in an automated browser session, so the cursor scrub has been verified by
  code path and state transitions only. Someone needs to open the site and
  move the cursor across the hero.
