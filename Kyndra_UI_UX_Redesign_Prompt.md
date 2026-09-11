# Kyndra — UI/UX Redesign & Product Presentation Prompt

Repository:

https://github.com/Muj-csv/FurMula-One-Kyndra.git

Project: Kyndra  
Tagline: “Where the right homes meet the right animals.”

---

#

# 0. REQUIRED COLLABORATIVE WORKFLOW

This project must be implemented **incrementally and collaboratively**.

Do not treat this prompt as permission to make every change at once.

The work must be divided into clear phases, with each phase reviewed before moving to the next major phase.

## Phase-by-phase rule

For every phase:

1. Inspect the relevant existing implementation.
2. Explain what you found.
3. State the proposed changes for that phase.
4. Identify any risks, dependencies, or trade-offs.
5. Ask relevant questions when an answer could materially improve the implementation.
6. Provide recommendations when you identify a better approach than the one explicitly requested.
7. Implement the agreed/appropriate changes.
8. Test the changes.
9. Review the rendered result.
10. Summarize what changed.
11. Identify anything that should be improved before continuing.
12. Proceed to the next phase only when the current phase is stable enough to build upon.

Questions must be **useful and specific**, not a generic questionnaire.

Do not block progress unnecessarily.

If a question is optional and the answer is not required to proceed, make a reasonable assumption, state it clearly, and continue.

If a decision could significantly affect architecture, usability, research integrity, or the visual direction, ask before making an irreversible change.

## Recommendations are expected

Throughout the implementation, actively look for opportunities to improve:

- UI clarity
- UX flow
- Information architecture
- Accessibility
- Responsive behavior
- Copywriting
- Judge/demo experience
- Research transparency
- Visual hierarchy
- Component structure
- Maintainability
- Performance
- Testing

If you notice something that would make Kyndra substantially better, recommend it even if it was not explicitly requested.

For every significant recommendation, briefly explain:

- What you recommend
- Why it would help
- Whether it is necessary or optional
- What trade-off it introduces, if any

Do not silently make major scope changes based on personal preference.

## Questions should happen at the right time

Ask questions **when the relevant phase is reached**, rather than asking every possible question at the beginning.

Examples:

During the design-system phase:
- Ask about ambiguous visual priorities if necessary.

During the intake redesign:
- Ask about any unclear household fields or intended user behavior.

During the results redesign:
- Ask about which judge-facing evidence should be most prominent if the existing requirements are ambiguous.

During responsive work:
- Ask about important target devices only if the existing requirements do not provide enough direction.

During research/evidence work:
- Ask before changing the interpretation or presentation of research claims.

Do not repeatedly ask questions that have already been answered.

## User decisions vs agent decisions

Use the following hierarchy:

### Must preserve

- Existing product requirements
- Matching methodology
- Research integrity
- Existing valid behavior
- Data semantics
- Architectural boundaries

### Agent may decide

- Spacing
- Typography scale
- Component composition
- Visual hierarchy
- Responsive breakpoints
- Minor interaction details
- Appropriate animation timing
- Concise UI wording
- Reusable CSS patterns

### Ask before major changes

- Removing an important feature
- Changing a core workflow
- Changing research interpretation
- Changing the matching methodology
- Introducing new infrastructure
- Adding a major dependency
- Changing the application's fundamental information architecture
- Making a change that could affect existing user data or behavior

---

# 0.1 REQUIRED GIT BRANCH STRATEGY

Git branch management is part of the implementation process.

Before modifying code:

1. Inspect the current Git status.
2. Inspect existing local and remote branches.
3. Identify whether a branch already exists that is clearly related to the requested UI/UX work.
4. If a suitable existing branch exists, use that branch rather than creating an unnecessary duplicate.
5. If no appropriate branch exists, create a dedicated feature branch.

Preferred branch naming when no suitable branch exists:

```text
feat/ui-ux-redesign
```

However, follow the repository's existing branch naming convention if one is already established.

## Never create unnecessary branches

If there is already a branch such as:

```text
feat/ui
feat/frontend-redesign
feat/ux-improvements
feat/design-system
```

and it is clearly the correct place for this work, use it.

Do not create a duplicate branch simply because this prompt suggests a name.

## Phase-specific branches

Do not create a new branch for every phase unless there is a genuine reason.

Prefer one feature branch for the complete UI/UX initiative:

```text
feat/ui-ux-redesign
```

Then organize the phases using focused commits.

Create additional branches only when:

- A phase is large enough to require independent review.
- A change is experimental.
- A change needs to be isolated from the main redesign.
- The repository's workflow requires it.
- A separate feature is discovered that should not be mixed into the current work.

## Before changing branches

Never switch branches while carrying unrelated uncommitted work without first checking its state.

Protect existing work.

Do not delete or overwrite user work.

If the working tree contains changes that appear unrelated to this task, explain the situation and avoid destructive actions.

## Commit discipline

Keep commits logically grouped.

Suggested structure:

```text
feat(ui): establish Kyndra visual system
feat(ui): redesign application shell
feat(ui): improve cohort and intake experience
feat(ui): redesign matching results
feat(ui): improve explanation and evidence UX
refactor(ui): simplify product language
fix(ui): responsive and accessibility polish
```

These are examples, not mandatory names.

Follow the repository's existing conventions where appropriate.

Do not mix unrelated engine changes into UI commits.

## Branch summary after each phase

At the end of each major phase, report:

- Current branch
- Commits made
- Files changed
- Tests run
- Whether the phase is ready to continue
- Any recommended follow-up


# 1. Objective

Substantially improve the application's UI/UX, visual hierarchy, information architecture, interaction design, readability, and presentation quality while preserving the existing product logic, research claims, matching engine, data integrity, and architectural boundaries.

This is a **UI/UX modernization and product-presentation task**.

Do not rebuild the matching engine simply for visual changes.

Do not introduce a backend, database, authentication, external API, or unnecessary dependency.

Do not replace working product logic with mocked behavior.

Do not change research claims merely to make the interface look better.

Do not remove important evidence or transparency features.

Do not turn Kyndra into a generic pet-adoption marketplace.

The goal is to make Kyndra feel like a polished, judge-ready product rather than a functional prototype.

---

# 2. Primary UX Reference: Tarsi

Use **https://www.tarsi.cloud/** as the primary UX and presentation reference.

Do **not** copy Tarsi's branding, exact layouts, illustrations, copy, or color palette.

Instead, adopt the principles behind its presentation:

- Playful but professional product design
- Strong visual hierarchy
- Generous whitespace
- Concise copy
- One main idea per section
- Visually guided storytelling
- Clear primary actions
- Friendly but intentional interface language
- Product functionality demonstrated through the UI
- Less explanatory prose
- Better use of cards, panels, visual grouping, and progressive disclosure
- Strong typography hierarchy
- Polished micro-interactions
- Approachable language
- Interfaces that explain themselves without requiring a presenter

Kyndra should feel like a real product that happens to contain a sophisticated matching algorithm.

It should NOT feel like:

- A university CRUD project
- A research paper converted into HTML
- An admin dashboard
- A spreadsheet
- A dense algorithm visualization
- A generic pet marketplace
- A collection of bordered boxes

The ideal feeling is:

> “Simple enough to understand immediately. Sophisticated enough to trust after inspection.”

---

# 3. Color Palette

Use the supplied palette reference image as the source of truth for the visual direction.

Do not use Tarsi's colors.

## Core palette

### TERRACOTA
`#C66A32`

Use as the primary brand/action color.

### CHILE ROJO
`#A43E1E`

Use for important warnings, blocked states, and negative constraints.

### OLIVE
`#8A8635`

Use for positive states, successful matches, and supportive information.

### SUNSET
`#EACB91`

Use for highlighted areas, contextual backgrounds, and warm emphasis.

## Supporting neutrals

Deep warm ink:

`#30261F`

Warm background:

`#F8F3E8`

Soft surface:

`#FFF9EF`

Muted warm text:

`#75695E`

Subtle border:

`#DCCDB8`

Do not make every component colorful.

The palette should feel editorial and intentional.

Use approximately:

- Terracotta = primary brand/action
- Chile Rojo = warnings, blocked states, negative constraints
- Olive = successful/positive states
- Sunset = highlighted/contextual areas
- Deep warm ink = primary text
- Warm background = page background
- Soft surface = cards and elevated sections

Avoid:

- Excessive gradients
- Neon colors
- Typical blue SaaS palettes
- Pure black unless technically necessary
- Making every card a different color

Color should communicate hierarchy and state, not decoration.

---

# 4. Overall Design Language

Create a:

> **Warm Editorial Matching Interface**

Visual characteristics:

- Large confident typography
- Rounded but not overly bubbly components
- Soft corners
- Generous spacing
- Warm neutral backgrounds
- Subtle borders
- Selective shadows
- Large animal imagery
- Strong visual cards
- Compact metadata
- Clear status indicators
- Restrained use of color
- Responsive layouts
- Subtle transitions
- Clear primary/secondary actions

Use visual rhythm rather than many borders.

Prefer:

> Large surface  
> → Clear heading  
> → Short explanation  
> → Visual content  
> → Action

Instead of:

> Heading  
> → Paragraph  
> → Paragraph  
> → Paragraph  
> → Bordered box  
> → Paragraph  
> → Button

The interface should feel calm and intentional.

---

# 5. Typography

Improve typography substantially.

Use a modern, highly readable sans-serif stack or an appropriate lightweight web font if the project already permits it.

Create a clear type scale:

- Display / hero
- Page heading
- Section heading
- Card heading
- Body
- Supporting text
- Metadata
- Labels

Do not make everything large.

Large typography should be reserved for:

- Kyndra identity
- Key statements
- Important numbers
- Important results

Body text should be short and readable.

Increase line-height where appropriate.

Use stronger font-weight contrast instead of excessive capitalization.

Avoid long ALL-CAPS headings.

Avoid tiny text that requires zooming.

---

# 6. Most Important Change: Reduce Wordiness

This is a major requirement.

The current application contains language that is technically correct but often sounds like research documentation.

The interface must use plain, direct language.

The application is being judged by:

- Technical judges
- Non-technical judges
- Potential shelter users
- Adopters/households
- General viewers

The UI must explain sophisticated concepts without forcing users to understand computer-science terminology first.

## Rule

If a technical term is necessary, explain it in plain language immediately.

### Examples

Instead of:

> “Hard constraints eliminate impossible pairs.”

Use:

> “Some matches are not safe or suitable. Kyndra removes them before ranking.”

Instead of:

> “Deferred acceptance”

Use:

> “Stable matching”

Then:

> “Everyone gets the best available match without creating a pair that would prefer to switch.”

Instead of:

> “Counterfactual”

Use:

> “What would change?”

Instead of:

> “Blocking pair”

Use:

> “Would these two be better together?”

Instead of:

> “Preference derivation”

Use:

> “How preferences are built”

Instead of:

> “Equity weight”

Use:

> “Give longer-waiting animals more consideration”

Instead of:

> “Constraint matrix”

Use:

> “Match eligibility”

Instead of:

> “Unmatched analysis”

Use:

> “Who still needs a match?”

Instead of:

> “Recruitment diagnostic”

Use:

> “Who should the shelter look for?”

Instead of:

> “Greedy baseline”

Use:

> “First-come, first-served”

Instead of:

> “Stability verifier”

Use:

> “Check whether the match can be improved by switching”

Instead of:

> “Applicant”

Prefer:

> “Household”

where context allows.

Instead of:

> “Animal requirement profile”

Use:

> “What this animal needs”

Instead of:

> “Applicant preference profile”

Use:

> “What this household is looking for”

Do not dumb down the product.

**Simplify the language, not the intelligence.**

---

# 7. Copywriting Rules

Every piece of UI copy must pass this test:

> Can a first-time user understand this without the presenter explaining it?

If not, rewrite it.

Use:

- Short sentences
- Active voice
- Familiar words
- Concrete descriptions
- One idea per sentence
- Short button labels

Avoid:

- Unnecessary jargon
- Academic phrasing
- Redundant explanations
- Long paragraphs
- Marketing fluff
- Exaggerated claims
- Vague statements
- Unnecessary qualifiers
- Repeating the same explanation in multiple places

Buttons should describe the action.

Prefer:

- `Run the match`
- `Add household`
- `See why`
- `Try a swap`
- `Show eligibility`
- `Reset`
- `See results`

Avoid:

- `Execute Matching Algorithm`
- `View Detailed Matching Analysis`
- `Perform Stability Evaluation`

---

# 8. Create a Strong Product Shell

Reorganize the application into a more intentional product shell.

## Header

Left:

**Kyndra**

Under or beside it:

> “Where the right homes meet the right animals.”

Right:

Small contextual controls/status if necessary.

Keep the header lightweight.

Do not create a giant navigation bar.

---

# 9. Hero / Introduction

The first screen should immediately answer:

1. What is Kyndra?
2. Why does it exist?
3. What should I do next?

Suggested direction:

## Kyndra

### “Better matches. Fewer returns.”

Supporting statement:

> “Kyndra helps shelters match households and animals using clear requirements, preferences, and explainable rules.”

Primary:

**Start with this cohort**

Secondary:

**Add a household**

Do not place the entire research explanation at the top.

The user should understand the product before seeing the research.

---

# 10. Visual “How It Works” Flow

Instead of explaining the algorithm with a large paragraph, create a simple visual progression:

### 01
**Tell us about the household**

↓

### 02
**Check what each animal needs**

↓

### 03
**Remove unsuitable matches**

↓

### 04
**Build the best two-sided match**

↓

### 05
**Explain every result**

Keep each description to one short sentence.

This should visually communicate the entire product.

---

# 11. Animal Cohort Experience

The current “Who is waiting” section should become much more visually compelling.

Create an animal card/grid experience.

Each card should prioritize:

- Photo
- Animal name
- Days waiting
- 2–4 key needs
- Short human-readable descriptor

Example:

### BRUNO

**340 days waiting**

Needs:

- Quiet home
- No other pets
- Experienced adopter

Instead of showing every technical detail immediately, progressively disclose secondary information.

Use visual tags/chips.

Long-stay animals should be visually noticeable but not aggressively highlighted.

The user should immediately understand:

> “This is an animal waiting for a suitable home.”

---

# 12. Intake Experience

The current intake form should be redesigned.

Do not present it as one giant form.

Break it into short sections:

### ABOUT YOUR HOME

### YOUR EXPERIENCE

### YOUR PETS

### YOUR DAILY ROUTINE

### SPECIFIC ANIMAL

Use progressive disclosure where appropriate.

Use friendly question wording.

Examples:

Instead of:

> “Household pet compatibility”

Use:

> “Do you already have pets at home?”

Instead of:

> “Hours away from residence”

Use:

> “How long is the home usually empty?”

Instead of:

> “Experience level”

Use:

> “How comfortable are you caring for an animal?”

Instead of:

> “Specific-animal preference”

Use:

> “Are you here for a specific animal?”

Make the form feel conversational without becoming unnecessarily decorative.

Show progress if the form becomes multi-step.

---

# 13. Make the Matching Moment the Hero Experience

The matching action should feel important.

When the user clicks:

**Run the match**

show a short, polished transition.

Possible sequence:

> Reviewing households  
> ↓  
> Checking requirements  
> ↓  
> Finding compatible homes  
> ↓  
> Building stable matches  
> ↓  
> Results ready

Do not create a long loading animation.

The goal is to make the algorithm understandable.

The interface should communicate:

> “Kyndra is checking the rules before recommending a placement.”

---

# 14. Redesign the Results Board

This is the most important screen.

Do not present results as a plain list.

Create a visual results dashboard.

Top:

**MATCHING COMPLETE**

Large summary:

- `12 matches`
- `3 households unmatched`
- `2 animals still waiting`

Then the main match cards.

Each match should visually connect:

**ANIMAL**

+

**HOUSEHOLD**

Example:

### BRUNO
340 days waiting

**MATCHED WITH**

### HOUSEHOLD 03
Quiet home · Experienced adopter

### WHY THIS MATCH?

> “Bruno needs a quiet home and no other pets. Household 03 meets both requirements.”

Then:

**See why**

This opens deeper evidence.

---

# 15. Progressive Disclosure

Do not show every piece of research and algorithm data simultaneously.

Use layers.

### LEVEL 1 — Simple result

> “Bruno → Household 03”

### LEVEL 2 — Reason

> “Both sides meet the required conditions.”

### LEVEL 3 — Evidence

Show:

- Actual constraints
- Rankings
- Research citation
- Relevant data

### LEVEL 4 — Technical detail

Show:

- Matching/stability explanation
- Preference ordering
- Stability reasoning
- Technical methodology

A normal user should not be forced to understand Gale–Shapley.

A technical judge should still be able to inspect it.

---

# 16. “Why This Match?” Pattern

Every match should have a clear explanation.

Use:

## WHY IT WORKS

- ✓ Quiet home
- ✓ No conflicting pets
- ✓ Suitable experience

Then:

**See the full reasoning**

The full reasoning can reveal:

- Requirements
- Preferences
- Eliminated alternatives
- Ranking information
- Stability explanation
- Citations

This makes transparency a product feature rather than a research paragraph.

---

# 17. “Why Not?” Experience

Rename the feature to something friendlier.

Use:

> **Why didn’t they match?**

or:

> **Why not the others?**

Example:

> “Household 08 was not eligible because the home has two cats and Bruno requires a pet-free home.”

Then optionally:

**See the rule**

This lets a judge inspect the constraint.

---

# 18. Swap Experience

“Attempt a swap” is one of Kyndra's strongest demo features.

Make it visually obvious.

Section title:

## Could these two switch?

Short explanation:

> “Pick two matches and see whether switching them would make a better valid match.”

Then:

`Household 03 ↔ Household 08`

Button:

**Try the swap**

Result:

### Swap blocked

Explanation:

> “Household 03 prefers Bruno, but Bruno cannot live with the pets in Household 08.”

Use a strong visual distinction between:

**SWAP WORKS**

and

**SWAP BLOCKED**

Never rely only on color. Include text and icons.

---

# 19. Equity Control

The current “equity dial” sounds technical.

Rename the UI:

## Give longer-waiting animals more consideration

Supporting text:

> “Adjust how much priority goes to animals who have waited longer.”

Clearly display the guardrail:

> “Safety and eligibility rules always come first.”

Keep the actual algorithm unchanged.

Only improve the presentation.

---

# 20. Unmatched Animals

Do not make “unmatched” feel like failure.

Turn it into an insight.

Title:

## Who still needs a match?

Example:

### EMBER

**415 days waiting**

> “No household in this cohort can safely take Ember.”

Then:

## Who should the shelter look for?

- 52 kg
- Yard
- Quiet home
- Daily medication
- Experienced adopter

This turns the algorithm's failure case into a useful recruitment recommendation.

---

# 21. Research / Evidence

Do not remove research.

Do not hide evidence from judges.

Instead, separate:

**PRODUCT EXPERIENCE**

from

**EVIDENCE**

Use expandable panels, drawers, modals, or dedicated sections.

Example:

### Why these rules?

Then:

### Research behind the matching rules

Show relevant figures with concise explanations and citations.

The first layer should communicate the idea.

The second layer should prove it.

---

# 22. Real vs Simulated Data

The PRD requires honesty.

Where the cohort appears, retain clear wording that animals are simulated and applicants are real/surveyed where applicable.

Make the disclosure visually elegant.

Use a compact label:

### SIMULATED COHORT

> “Animals are simulated for this demonstration. Household profiles come from real survey responses where indicated.”

Keep the distinction obvious.

Never imply that simulated animals are real shelter animals.

---

# 23. Preserve Research Honesty

Do not change these principles:

- Never claim Kyndra prevents a specific number of returns.
- Do not present simulated outcomes as measured shelter outcomes.
- Keep research citations attached to relevant claims.
- Keep sample sizes honest.
- Keep assumptions visible.
- Clearly distinguish observed, simulated, and projected information.
- Kyndra proposes; shelter staff decide.

The UI should make these distinctions easier to understand, not hide them.

---

# 24. Visualization Strategy

Redesign technically useful but visually dense features.

## Constraint Grid

Instead of a raw spreadsheet-looking matrix:

### Match eligibility

> “Every household–animal pair is checked before matching.”

Use:

- ✓ Eligible
- × Not eligible

Allow users to click a cell for the reason.

## Regret View

Rename:

> “Who had to compromise?”

Explain in one sentence.

## Impact Panel

Rename where appropriate:

> “What Kyndra changes”

Separate:

- Observed effort saved
- Projected effect

Never visually imply projected effects are measured outcomes.

---

# 25. Responsive Design

The application must work beautifully on:

- Desktop
- Laptop
- Tablet
- Mobile

Do not simply shrink the desktop UI.

Create responsive layouts intentionally.

Desktop:

- Two-column or asymmetric editorial layouts where useful

Tablet:

- Reduced columns

Mobile:

- Single-column cards
- Stacked controls
- Large touch targets
- Bottom-friendly actions

Do not allow tables or matching matrices to destroy the mobile layout.

Use horizontal scrolling where technically necessary.

---

# 26. Microinteractions

Add subtle, purposeful motion.

Examples:

- Cards gently appear
- Match cards transition into place
- Result counters animate briefly
- Selected animals receive a soft highlight
- Swap results reveal smoothly
- Equity slider updates results smoothly
- Expandable explanations transition naturally
- Buttons have subtle hover/pressed states

Avoid:

- Excessive bouncing
- Flashy gradients
- Unnecessary parallax
- Distracting animations
- Animations that delay interaction

Motion should communicate state changes.

---

# 27. Accessibility

Maintain and improve accessibility.

Requirements:

- Semantic HTML
- Keyboard navigation
- Visible focus states
- Sufficient contrast
- Buttons with clear labels
- Form labels
- No information conveyed by color alone
- Accessible modal/drawer behavior
- Reduced-motion support
- Readable font sizes

Especially ensure red/green states are understandable without color.

---

# 28. Information Architecture

Consider reorganizing the main experience around:

> HOME / INTRO  
> ↓  
> COHORT  
> ↓  
> HOUSEHOLDS  
> ↓  
> MATCH  
> ↓  
> RESULTS  
> ↓  
> EXPLAIN  
> ↓  
> EVIDENCE

Do not necessarily implement literal navigation tabs if they make the experience heavier.

The important mental model is:

1. What is this?
2. Who is waiting?
3. Who is applying?
4. What does Kyndra check?
5. What matches did it create?
6. Why?
7. Can I challenge the result?
8. What evidence supports this?

---

# 29. Judge Experience

This is extremely important.

A judge should be able to understand the product without a team member narrating every button.

The application itself should teach the judge what to do.

Ideal demo flow:

1. Meet the animals
2. Add or review households
3. Run the match
4. Inspect the results
5. Ask “Why?”
6. Try a swap
7. Adjust long-stay consideration
8. Inspect an unmatched animal
9. Open the evidence

Make primary actions visually obvious.

Do not make the judge search for functionality.

---

# 30. Do Not Overdesign

The goal is not to make the interface visually impressive at the expense of clarity.

Avoid:

- Excessive glassmorphism
- Excessive gradients
- Huge decorative illustrations
- Overly rounded “toy” interfaces
- Excessive cards
- Excessive badges
- Excessive shadows
- Excessive animations
- Giant dashboards
- Dashboard clutter
- Decorative charts that communicate nothing

The interface should feel premium because of:

- Spacing
- Typography
- Hierarchy
- Copy
- Interaction
- Composition

—not decoration.

---

# 31. Technical Constraints

Respect the current architecture.

The repository uses:

- React
- TypeScript
- Vite
- Plain CSS
- Vitest

Do not introduce a large UI framework merely for styling.

Prefer improving the existing CSS system.

Create reusable design tokens in `index.css` or an appropriate styling layer.

Create reusable component patterns where appropriate.

Keep matching logic inside `src/engine/`.

UI components must not contain matching logic.

The UI should continue communicating with the engine through its existing public interface.

Do not move engine code into components.

Do not modify data simply to make screenshots prettier.

---

# 32. Design Tokens

Create a proper visual token system.

For example:

```css
--color-terracotta
--color-chile
--color-olive
--color-sunset

--color-ink
--color-background
--color-surface
--color-muted
--color-border

--radius-sm
--radius-md
--radius-lg
--radius-xl

--space-1
--space-2
--space-3
--space-4
--space-6
--space-8
--space-12

--shadow-soft
--shadow-card
```

Typography tokens should also be defined.

Do not scatter arbitrary values throughout the stylesheet.

---

# 33. Component Refactoring

Review the current components and refactor them where necessary.

Likely areas include:

- `App`
- `AnimalWall`
- `ApplicantIntake`
- `ResultsBoard`
- Related components

Do not blindly rewrite everything.

First understand what each component does.

Then improve:

- Component responsibility
- Readability
- Visual hierarchy
- Responsive behavior
- Copy
- Accessibility
- Interaction patterns

If a component has become too large, split it into meaningful components.

Potential patterns:

- `AppShell`
- `HeroIntro`
- `HowItWorks`
- `CohortSection`
- `AnimalCard`
- `HouseholdForm`
- `MatchSummary`
- `MatchCard`
- `MatchExplanation`
- `WhyNotPanel`
- `SwapChecker`
- `EquityControl`
- `UnmatchedInsight`
- `EvidencePanel`

Use judgment.

Do not create dozens of tiny components unnecessarily.

---

# 34. Copy System

Create a consistent vocabulary.

Preferred terminology:

- Animal
- Household
- Home
- Match
- Requirement
- Preference
- Eligible
- Not eligible
- Why this match?
- Why not?
- Still waiting
- Longer-waiting animal
- First-come, first-served
- Stable match
- Evidence
- Research
- What changed?
- Try a swap

Avoid unnecessary technical terms in primary UI.

Technical terminology may appear in:

- Evidence drawers
- Judge mode
- Methodology sections
- Research notes
- Technical explanations

This creates two layers:

### USER LANGUAGE

Simple and direct.

### JUDGE LANGUAGE

Precise and technically rigorous.

---

# 35. Content Hierarchy

Every screen should answer one question.

### INTRO

“What is Kyndra?”

### COHORT

“Who needs a home?”

### INTAKE

“What does this household need?”

### MATCH

“How does Kyndra build the match?”

### RESULTS

“What happened?”

### MATCH DETAIL

“Why did this match happen?”

### SWAP

“Could these two switch?”

### UNMATCHED

“Who still needs a match?”

### EVIDENCE

“Why should I trust this?”

If a section cannot answer a clear question, reconsider whether it belongs there.

---

# 36. Demo-First Design

The application will be demonstrated to judges.

Optimize the primary path for a live presentation.

A judge should be able to interact with it naturally.

The preset cohort must remain available.

Do not require typing through the entire intake just to demonstrate the product.

Maintain the existing ability to load/run the preset cohort.

Make the primary demo path visually obvious.

---

# 37. Preserve Core Differentiators

The redesign must preserve and visually elevate:

- Specific-animal question
- Hard constraints
- Independent household/animal preferences
- Stable matching
- Explained assignments
- “Why not?”
- Attempt-a-swap
- Long-stay equity control
- Unmatched analysis
- Recruitment diagnostic
- Constraint matrix
- Regret/compromise view
- Human baseline
- Randomized aggregate
- Research evidence
- Transparent assumptions

These are not secondary features.

They are the reason Kyndra exists.

---

# 38. Implementation Process

Work in phases.

## PHASE 1 — AUDIT

Before changing code:

- Inspect the entire current UI
- Inspect all existing components
- Inspect current CSS
- Inspect current data structures
- Inspect the PRD
- Inspect the architecture document
- Identify duplicated UI patterns
- Identify confusing terminology
- Identify overly long copy
- Identify visual hierarchy problems
- Identify accessibility problems
- Identify responsive problems

Do not immediately start rewriting files.

Provide a concise implementation plan first.

---

## PHASE 2 — DESIGN SYSTEM

Implement:

- Palette tokens
- Typography scale
- Spacing
- Radius
- Shadows
- Surfaces
- Buttons
- Tags
- Status states
- Cards
- Form controls
- Focus states

---

## PHASE 3 — APPLICATION SHELL

Redesign:

- Header
- Hero/introduction
- Primary actions
- Cohort summary
- Overall page structure

---

## PHASE 4 — COHORT + INTAKE

Redesign:

- Animal cards
- Cohort presentation
- Household intake
- Specific-animal question
- Form grouping
- Validation
- Helper text

---

## PHASE 5 — MATCHING + RESULTS

Redesign:

- Run-match interaction
- Matching transition
- Results summary
- Match cards
- Explanation
- Why-not
- Evidence disclosure

---

## PHASE 6 — INTERACTIVE DIFFERENTIATORS

Redesign:

- Attempt-a-swap
- Equity control
- Unmatched analysis
- Recruitment diagnostic
- Constraint grid
- Regret view
- Impact panel
- Greedy vs stable comparison

---

## PHASE 7 — LANGUAGE PASS

Review every visible string in the application.

For every sentence, ask:

> “Can this be shorter without losing meaning?”

If yes, shorten it.

Then ask:

> “Would a non-technical judge understand this?”

If no, simplify it.

Then ask:

> “Would a technical judge still recognize the underlying concept?”

If no, preserve the technical term in the secondary explanation.

---

## PHASE 8 — RESPONSIVE + ACCESSIBILITY

Test:

- Desktop
- Tablet
- Mobile
- Keyboard
- Focus
- Reduced motion
- Long text
- Small viewport

---

## PHASE 9 — DEMO TEST

Run through the entire product as if you are a judge who has never seen Kyndra.

Do not use external explanation.

Ask:

- Can I understand what this product does?
- Can I tell what I should click?
- Can I understand why a match happened?
- Can I challenge the result?
- Can I understand what “stable” means?
- Can I distinguish simulated data from real survey data?
- Can I understand the evidence?

If the answer is no, improve the UI.

---

# 39. Git / Branching Workflow

Do not blindly make all changes directly on `main`.

Before implementation:

1. Inspect the existing branches.
2. Determine whether a suitable UI/UX branch already exists.
3. If one exists and is clearly intended for these changes, use it.
4. Otherwise create a dedicated branch such as:

```text
feat/ui-ux-redesign
```

or an appropriately named branch based on the repository's existing convention.

Keep the changes focused.

Make logical commits per phase where practical.

Suggested commits:

```text
feat(ui): establish Kyndra visual system
feat(ui): redesign application shell
feat(ui): improve cohort and intake experience
feat(ui): redesign matching results
feat(ui): improve explanation and evidence UX
refactor(ui): simplify product language
fix(ui): responsive and accessibility polish
```

Do not mix unrelated engine changes into UI commits.

---

# 40. Testing Requirements

After every major phase:

```text
npm test
npm run build
```

Also:

- Verify TypeScript
- Inspect the rendered UI
- Verify existing functionality
- Verify no matching behavior changed unintentionally

Before finishing:

- Run the complete test suite
- Build production output
- Test the complete demo flow
- Verify every major interactive feature
- Verify responsive layouts

Do not declare the work complete merely because the application compiles.

---

# 41. Final Quality Bar

The finished Kyndra interface should feel like:

> A polished startup-quality product, with the warmth of an approachable consumer app, the clarity of a modern SaaS product, the visual discipline of an editorial interface, and the credibility of a research-backed decision-support tool.

It should feel:

- Warm
- Clear
- Trustworthy
- Human
- Modern
- Explainable
- Purposeful
- Judge-ready

It should NOT feel:

- Academic
- Cold
- Technical
- Dense
- Corporate
- Generic
- Overdesigned
- AI-generated
- Like a CRUD prototype

---

# 42. Final Acceptance Test

Before declaring completion, compare the new interface against these questions:

1. Does the first screen explain Kyndra in under 10 seconds?
2. Can a judge understand the main workflow without narration?
3. Is the most important action obvious?
4. Does the UI visually prioritize animals, households, matches, and reasons?
5. Is the language concise?
6. Are technical terms translated into normal language?
7. Can a technical judge still inspect the deeper algorithmic reasoning?
8. Does the color palette consistently use Terracotta, Chile Rojo, Olive, and Sunset?
9. Does the UI look like one coherent product?
10. Does the matching result feel like the centerpiece of the application?
11. Are explanations progressive rather than dumped onto the screen?
12. Can users understand why a match happened?
13. Can users understand why another match did not happen?
14. Can judges easily try a swap?
15. Is the equity control understandable without knowing the algorithm?
16. Does the unmatched analysis feel useful rather than like an error?
17. Are research claims visible but not overwhelming?
18. Are simulated and real data clearly distinguished?
19. Does the interface remain truthful about what Kyndra can and cannot claim?
20. Does the application still work exactly as intended underneath the redesign?

---

# 43. Use Your Own Design Judgment

Do not follow this prompt mechanically if the existing implementation provides a better solution.

You are allowed to:

- Propose better component structures
- Improve information architecture
- Simplify copy further
- Identify redundant sections
- Merge visually repetitive components
- Introduce better progressive disclosure
- Suggest better interactions
- Improve accessibility
- Suggest small animations
- Recommend removing UI elements that do not help the user
- Recommend additional polish that strengthens the product

However:

Do not change core product requirements without explaining why.

Do not alter the matching methodology.

Do not remove research evidence.

Do not invent claims.

Do not add unnecessary infrastructure.

If you identify something that should change beyond the scope of UI/UX, explain the recommendation before implementing it.

---

# 44. Final Response After Implementation

When the work is complete, provide:

1. Summary of the UI/UX transformation
2. Files changed
3. Components created/refactored
4. Major language simplifications
5. Design-system changes
6. Responsive/accessibility improvements
7. Demo-flow improvements
8. Tests/build results
9. Branch used
10. Commit summary
11. Phase-by-phase implementation status
12. Recommendations made during implementation
13. Important questions asked and the decisions/assumptions used
14. Any remaining decisions that would benefit from user input

Also provide a short section:

## Recommended Next Improvements

Include any ideas you believe would make Kyndra stronger for:

- Users
- Beneficiaries
- Judges
- Final presentation
- Research credibility

Do not stop at making the UI prettier.

The objective is to make the product:

**easier to understand, easier to use, easier to demonstrate, and easier to trust.**
