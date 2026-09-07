# Kyndra — Product Requirements Document

**Where the right homes meet the right animals.**

*Transparent, explainable adoption matching for shelters. Renamed from FitFirst; the product thesis, scope, and methodology are unchanged.*

| | |
|---|---|
| **Event** | AnimalHack 2026 (Binnovative) — fully online, international |
| **Submission** | Devpost + presentation registration by **12pm Sept 12 (Sat) EST ≈ 1am Sept 13 Manila** · present Sept 13 |
| **Form factor** | Static web app on Vercel. Any browser, anywhere. PWA-installable. |
| **Cost** | $0. No backend, no database, no external API, no key, no card on file. |
| **Doc owner** | Sensei (team lead) |
| **Version** | v4.1 — Sept 7, 2026. **Final.** Supersedes v1–v4.0. Adds Phase 0; renames the project to Kyndra. |
| **Companion** | `kyndra-architecture-final.md` — the authoritative technical layout |

---

## Problem

**Adopted animals come back, and the reasons are documented, specific, and preventable.**

Powell et al. (2021, *Scientific Reports*), analysing 23,932 adoption records from the University of Pennsylvania and Charleston Animal Society, found a **16.3% return rate for adopted dogs**. Roughly **35% of those returns were behavioural incompatibility**, and a further **18% were conflict with existing household pets**. These are not medical tragedies or bad luck. They are **compatibility failures** — the animal and the household were never a fit, and someone made that pairing.

A bad match does not cost one home. It costs two.

Powell et al. (2022, *Scientific Reports*) followed the adopters. Only about **one in ten returning owners ever adopted again.** Owners who returned a dog for behavioural reasons were **four times less likely to adopt again** than those returning for medical reasons. Dogs returned for behavioural issues were **more likely to be euthanised**. The authors named the mechanism: a mismatch between the animal's behavioural needs and the owner's tolerance damages the adopter's long-term relationship with the shelter.

```
One avoidable mismatch
   → 1 animal returned, with worse outcome odds
   → 1 adopter effectively lost (~90% never return)
   → every future animal that adopter would have taken
```

Yet placement is still done one animal at a time. A shelter with 15 animals and 40 applications on a Saturday matches first-come-first-served, or on one coordinator's best guess per animal, under time pressure. **That is 600 pairwise judgements.** There is no way to see the whole cohort at once, no way to check whether a different arrangement would be better for everybody, and no way to weigh the 340-day resident against the puppy everyone wants.

Existing tools don't address this. Adoption-matching apps are recommendation-and-chat: describe what you want, get a suggestion. That optimises one applicant's browsing experience, not the cohort's outcome. **At AnimalHack 2024, a Dog Breed Compatibility Quiz placed in Emerging Talent** — that is the shape of what already exists here, and it is a different problem entirely.

Above all: where allocation systems like this exist, they are opaque. A shelter using one cannot see why a pairing was proposed, cannot check whether it holds up, and cannot argue with its priorities.

## Solution

Kyndra treats shelter placement as what it structurally is — **a two-sided matching problem with hard constraints and a known solution** — and makes every step inspectable, testable, and arguable.

```
"Is there a specific animal you're here for?"     Animal requirement profiles
   yes → locked as their #1                        (needs, not wants)
   no  → full derivation
              ↓                                              ↓
       HARD CONSTRAINTS eliminate impossible pairs entirely
              ↓
   Applicant ranks on WANT  ·  Shelter ranks on NEED   ← genuinely independent
              ↓
   Deferred acceptance → a stable assignment across the whole cohort
              ↓
   Explained pairings · judge-testable stability · long-stay equity dial
              ↓
   Unmatched analysis: which adopters this shelter needs to recruit
```

Every hard constraint maps to a documented cause of adoption return, citation on screen. Stability is not asserted — **a judge can attempt a swap and watch it fail, with the reason.** And the comparison is not against a strawman: we measured what happens when **real people** place the same cohort by hand.

**What this actually is:** a small, honest case study in transparent, explainable algorithmic allocation, in a domain where such systems are usually absent or opaque.

**Beneficiaries.** Primary: shelters and rescues placing more than one animal at a time, and the animals whose returns are prevented. Secondary: adopters, matched to an animal they can keep — and therefore retained as adopters.

## Key features

**The matching engine**
- Specific-animal question — a real human choice is never overridden by a derived score
- Preference derivation for everything else; nobody hand-ranks a list
- **Genuinely independent sides:** applicants rank on what they want, the shelter on what the animal needs
- Research-grounded hard-constraint filter — impossible pairs eliminated, never down-ranked
- Gale–Shapley deferred acceptance, deterministic and order-independent

**Evidence (the part that separates this from a demo)**
- **Human baseline study** — five people place the same cohort by hand under a timer; violations counted
- **Randomised aggregate** — first-come-first-served vs stable matching across 500 generated cohorts
- **Real applicant profiles** — ~20 households surveyed from real people
- Two property tests proving correctness and equity safety

**Transparency**
- **"Attempt a swap"** — a judge picks two matched pairs and tries to reshuffle; the UI shows why it fails
- **"Why not?"** on every animal — which applicants were eliminated, by which constraint, with citation
- **Constraint matrix grid** — animals × applicants, green and red, showing the combinatorial scale at a glance
- **Regret view** — how far down its list did the worst-off animal match
- Plain-language rationale and counterfactual for every pairing

**The differentiators**
- **Long-stay equity dial** — tune how strongly the system favours animals who have waited longest. Ties only; can never override a hard constraint, and a test proves it
- **Unmatched analysis → recruitment diagnostic** — which animals matched nobody, and what adopter profile this shelter is missing
- **Two-number impact panel** — effort saved this week (provable) kept separate from projected welfare effect (labelled), with a conservative/optimistic toggle

## Non-goals

- Not an adoption listing site or pet finder
- Not an AI recommender — deliberately, no model in the loop
- **Not a decision-maker.** It proposes with reasons; staff decide
- **Not a claim of measured shelter outcomes.** The animals are simulated. The applicants, the human baseline, and the citations are real, and the UI says which is which

---

# 1. Users

| User | Situation | Needs |
|---|---|---|
| Shelter coordinator | 15 animals, 40 applications, an adoption day Saturday | One assignment pass, with reasons they can defend |
| Volunteer reviewer | Reading applications by hand under time pressure | Structure instead of a stack of forms |
| Applicant | Applied, waiting | To be assessed on fit, not arrival time |
| Long-stay animal | 340 days in a kennel | To be visible in a system that otherwise favours easy placements |

# 2. Scope

## Implementation lifecycle

```text
PHASE 0   Repository Scaffolding & Technical Foundation
             ↓
P0        Core Product / Matching Implementation
             ↓
P1        Evidence, Validation & Differentiators
             ↓
P2        Polish & Demo Experience
             ↓
          Final Integration
             ↓
          Final Testing & Validation
```

Phase 0 is **not** a product priority tier. P0/P1/P2 describe what the product must do; Phase 0 describes the repository the product is built in. It runs once, before P0, and is prerequisite to everything after it. On the Day 1 timeline (§6) it is the whole of Day 1 alongside the Vercel deploy.

## Phase 0 — Repository Scaffolding & Technical Foundation

**Purpose:** stand up the technical skeleton so that P0 can be implemented cleanly, by several developers and coding agents at once, without anyone inventing structure mid-build.

**The Architecture document is authoritative for the layout.** `kyndra-architecture-final.md` §3 defines the repository tree, §2 the stack, §4 the data model. Phase 0 builds exactly that tree. This PRD does not define a second structure, and a discrepancy between the two is resolved in the Architecture's favour.

### Phase 0 establishes

| Area | What is created |
|---|---|
| Repository structure | The tree in Architecture §3, directories present and empty-but-real |
| Source directories | `src/engine/`, `src/data/`, `src/components/`, `tests/`, `public/` |
| **Engine boundary** | `src/engine/` with `index.ts` as its **only** public surface, exporting the `runMatch()` signature. Nothing outside the engine imports an engine internal |
| Data boundary | `src/data/` holds bundled data and constants only — no logic, no components |
| Component boundary | `src/components/` holds React only — no matching logic ever lives here |
| Test infrastructure | Vitest installed, configured, and running a trivial passing test from `tests/` |
| Build configuration | Vite project that builds to `dist/` with no config file beyond `vite.config.ts` |
| TypeScript configuration | `tsconfig.json` valid, strict, type-checking clean |
| Vite configuration | `vite.config.ts` present and valid |
| Development environment | `npm install` → `npm run dev` works from a clean clone |
| Dependencies | Vite, React, TypeScript, Vitest, and styling only. Nothing else |
| Application entry point | `index.html` → `src/main.tsx` → `src/App.tsx`, rendering a placeholder shell |
| Test entry point | `tests/engine.test.ts` exists and runs |
| Public/static assets | `public/manifest.json` and the 192/512 icons, linked from `index.html` |
| Naming conventions | File names as written in Architecture §3; components PascalCase, engine modules camelCase |
| Ownership boundaries | The single-owner rule on `src/engine/` (§7) stated in the repo, not just in this doc |
| Deployment | First Vercel deploy from the empty shell — "it works on Vercel" is a Day 1 fact, not a Thursday discovery |

### Phase 0 is not feature development

Phase 0 must **not** implement:

- Gale–Shapley deferred acceptance
- Hard-constraint evaluation
- Preference derivation (either side)
- Equity logic
- Stability verification
- Regret calculations
- Impact calculations
- Explanations or counterfactuals
- Swap evaluation
- Recruitment diagnostics
- Any full UI flow
- Any product behaviour

Those are P0–P2 and are listed below. Minimal compile-safe stubs — an exported `runMatch()` that throws `not implemented`, an empty component file — are acceptable where they are needed to make the boundary real. **Do not fabricate functionality to make the repository look finished.** A stub that returns a plausible fake result is worse than a stub that throws.

### Tests in Phase 0

Phase 0 creates the **testing infrastructure**. The two property tests, the randomised aggregate, and the human-baseline record are written alongside the matching engine in P0 (Architecture §7: tests are written with the algorithm, never after it). Do not front-load them into Phase 0, and **do not report algorithmic tests as passing before the algorithm exists** — a green suite over unimplemented code is the one result this project cannot afford to show a judge.

### Phase 0 acceptance criteria

Phase 0 is complete when:

1. The repository structure matches Architecture §3.
2. Required dependencies are installed, and no others.
3. The project starts locally from a clean clone.
4. TypeScript configuration is valid and the project type-checks.
5. Vite configuration is valid and `vite build` succeeds.
6. The application has a valid entry point that renders.
7. The test infrastructure runs and reports a passing trivial test.
8. `src/engine/` exists with `index.ts` as its sole public surface.
9. `src/data/` and `src/components/` boundaries exist and are respected.
10. No backend, database, API, authentication, env var, or runtime service has been introduced.
11. No P0/P1/P2 product feature has been prematurely implemented.
12. The build is deployed and reachable at a live URL.

Only then does P0 begin.

## P0 — must work

| # | Requirement |
|---|---|
| P0-1 | Animal profiles: requirements, days-in-shelter, name, photo |
| P0-2 | Applicant intake: household profile + "is there a specific animal you're here for?" |
| P0-3 | Hard-constraint filter, each constraint carrying its return-cause and citation |
| P0-4 | Preference derivation — applicant side on want, shelter side on need |
| P0-5 | Gale–Shapley deferred acceptance over incomplete lists |
| P0-6 | Results board: assignments, unmatched animals, unmatched applicants, reasons |
| P0-7 | **Both property tests passing** (no blocking pairs; equity never breaches a constraint) |

## P1 — evidence layer. Build immediately after the gate; this is what wins.

| # | Requirement |
|---|---|
| P1-1 | **Real applicant profiles** — ~20 households surveyed |
| P1-2 | **Human baseline study** — 5 people, timed manual placement, violations counted |
| P1-3 | **Randomised aggregate** — greedy vs stable across 500 generated cohorts |
| P1-4 | "Attempt a swap" interactive stability check |
| P1-5 | Long-stay equity dial, tie-breaking only |
| P1-6 | Unmatched analysis → recruitment diagnostic |

## P2 — polish

Constraint matrix grid · regret view · animated greedy→stable transition · "why not?" panel · counterfactual on hover · two-number impact panel · PWA manifest

## Deferred — roadmap slide, not the build

Petfinder API integration (free key; `good_with_children` / `good_with_dogs` / `good_with_cats` / `special_needs` map almost exactly onto these constraints — the obvious next step) · bonded pairs (matching with couples, NP-hard in general) · rolling/incremental mode · multiple regional cohorts · staff-verified flags on self-reported fields.

## Cut order under pressure

`impact panel → regret view → constraint grid → counterfactual hover → recruitment diagnostic → equity dial`

**Never cut:** intake, constraint filter, derivation, deferred acceptance, results board, both property tests, the human baseline result. **Phase 0 is not in the cut order at all** — it is the floor everything above stands on.

# 3. Honesty requirements — non-negotiable

Product requirements, not presentation notes. Each is something a judge can catch.

1. **"Simulated animals, real applicants" stated plainly** wherever the cohort appears. Never imply the animals are real, and never use photos that suggest a specific shelter's animals.
2. **Cohort provenance wording:** *"sized consistent with Shelter Animals Count's published per-organisation averages."* Never "sourced from SAC's dataset" — their free download is state-level aggregate reporting, not animal records.
3. **Impact framed as odds, not outcomes:** *"reduces the odds staff overlook a bad pairing under time pressure,"* never "prevents X returns." The tool proposes; staff decide. Those claims must not contradict each other.
4. **The compounding model carries its caveat in the UI:** *"Directionally indicative, not a causal estimate. Our constraints do not capture the full behavioural variance the research measured."*
5. **One study per figure.** Powell 2021 for return composition. Do not mix in the 32.8% / 21.5% figures from a separate analysis.
6. **Precise numbers.** 16.3% dog return rate — not "up to 1 in 5."
7. **Human baseline reported honestly** — sample size stated (n=5), described as an informal exercise, not a controlled study.
8. **Adjacent prior art disclosed:** Gale–Shapley has been applied to pairing therapy animals with people (Gutiérrez-Rondón & Gutiérrez-Cárdenas, 2021), which faced the same "animals can't state preferences" problem. Cohort-level shelter placement appears unclaimed.
9. **The data mess is named:** self-reported fields like experience level would ideally carry a staff-verified flag the algorithm weights more heavily.

# 4. The stability question — answered before it's asked

A CS-literate judge may ask why not simply maximise total fit. **Answer it on your own slide, first.**

Wu Y, Lee CS, Lee AY, Van Gelder RN. *Improving Residency Matching Through Computational Optimization.* JAMA Netw Open. 2025;8(6):e2517077. Ophthalmology match data 2011–2021, 6,990 applicants. A mixed-integer linear optimiser beat Gale–Shapley: mean matched rank **2.40 vs 2.85**, and **78.4% vs 70.9%** of applicants matched to a top-3 program — consistently 5–10% more.

**The paper states the trade-off in its own words:** Gale–Shapley produces a stable match, whereas the optimiser improves overall match quality. Different objectives.

**Why stability wins here:** a placement either side would abandon is worse for a shelter than one scoring a few percent lower on paper. Stability means no shelter–applicant pair would prefer each other over their assignment — nobody has cause to defect. Optimisation does not guarantee that.

**Also free to say:** deferred acceptance is strategy-proof for the proposing side. A shelter cannot get a better outcome by misreporting preferences.

# 5. The evidence plan

This is what moves Kyndra from "a working algorithm" to "a tested claim," and it targets the award this panel actually gives — Excellence in Research went to an ethics analysis in 2024, and an economic modelling study shared the 2025 Grand Prix.

**Real applicants (Day 2, one person, no coding).** Five-minute intake with ~20 real households — classmates, ACM members, family. Home type, hours away, children, other pets, experience, openness to a senior animal. Result: *"the animals are simulated; the 20 households are real people we surveyed."*

**Human baseline (Day 3–4, one afternoon).** Give five people the same cohort. Two-minute timer. Place animals first-come-first-served, as a coordinator would. Count hard-constraint violations. Result: *"Five people placed this cohort by hand. They averaged N violations. Kyndra produces zero, provably."* An observed result, not a simulated one.

**Randomised aggregate (Day 3, free — reuses the property-test generator).** Run greedy and stable across 500 random cohorts, report mean violations. Kills the "your demo cohort is rigged by construction" objection before it's raised.

# 6. Timeline

| Day | Date | Deliverable | Gate |
|---|---|---|---|
| 1 | Sat 6 | **Phase 0 — scaffolding (§2), all acceptance criteria met.** **Vercel deploy day one**. `researchConstants.ts`. **Message 3–5 rescues.** Cohort drafted. **Photo licensing settled.** | Live URL + Phase 0 criteria green |
| 2 | Sun 7 | Data model, cohort with names/photos/days, constraint filter with citations. **Applicant survey out.** Tune constraint strictness against the cohort. | Filter eliminates correctly; unmatched count is plausible |
| 3 | Mon 8 | Specific-animal question, derivation, Gale–Shapley, **both property tests**, randomised aggregate. **Deterministic tiebreak decided and documented.** | Zero blocking pairs; equity never breaches constraints |
| **4** | **Tue 9** | **GATE — intake → derive → match → results, end to end.** Human baseline study run. | If FALSE at 9pm: cut all P1/P2, ship P0 only |
| 5 | Wed 10 | Equity dial, unmatched panel, attempt-a-swap, greedy comparison. **Verify the Bruno narrative actually holds. Verify the dial visibly moves the board.** | Story confirmed against real output |
| 6 | Thu 11 | **Freeze.** Devpost writeup. **Record demo video.** Rehearse twice. | Runs clean twice |
| 7 | Fri 12 | **Buffer. Submit early. No new code.** | All three requirements complete |

**~1.5 days of slack after the single-cohort decision. Protect it.**

**Submission requirements — all three or ineligible:** Devpost submission · presentation registration form · live presentation Sept 13. Organisers verify the working link before scheduling. Deadlines firm, no extensions. **Freeze Thursday Manila time, not Friday.**

# 7. Ownership

| Module | Owner |
|---|---|
| **`src/engine/` — sole owner, nobody else commits here** | Strongest algorithms member |
| Both property tests + randomised aggregate | Same, or a pair |
| Equity dial + impact model + citation sourcing | Analytically-inclined member |
| Cohort data, photo licensing, names, realism | Anyone — no code required |
| **Applicant survey + human baseline study** | Members without a build task |
| Intake, results board, match detail, attempt-a-swap | Frontend members |
| Rescue outreach (3–5 orgs, multiple channels) | Anyone |

Two people can ship P0. Four makes it comfortable. **One person owns the engine directory — say this out loud on Saturday, or you will spend Wednesday night resolving merge conflicts in the one file that must be correct.**

# 8. Judging alignment

| Criterion | Argument |
|---|---|
| **Impact** | 16.3% of adopted dogs returned; ~35% behavioural incompatibility, 18% household-pet conflict. Each avoidable mismatch also costs an adopter — only ~1 in 10 return, behavioural returners 4× less likely. Kyndra targets the documented top causes directly |
| **Creativity** | Not a compatibility quiz — cohort-level assignment with a provable property, no model in the loop. The equity dial asks what adoption matching *should* optimise for. The unmatched analysis inverts the product by showing failures, not matches |
| **Execution** | Live URL, deterministic engine, two property tests, a human baseline study, a 500-cohort aggregate, every constant cited |
| **Presentation** | The judge places animals themselves before seeing any result. One named animal as the through-line. Slide the dial, watch Bruno match |

## Demo script (7 min + 3 Q&A)

1. **0:00** Meet Bruno. 340 days. One photo, one sentence.
2. **0:30** **Hand it to the judge.** "Place these four animals. Two-minute timer." Let them try.
3. **1:30** Reveal what they got wrong, with citations. **Then the constraint grid** — 15 × 40 = 600 pairwise judgements. That's why this fails under time pressure.
4. **2:15** The stakes — Powell 2021: 16.3% returned, 35% behavioural, 18% household-pet conflict. **Then the compounding loss (Powell 2022): ~9 in 10 of those adopters never adopt again.**
5. **3:00** Reframe: two-sided matching. Nobody hand-ranks — we ask if you came for a specific animal, derive the rest.
6. **3:45** Run the cohort. Bruno unmatched under greedy — show why. **Then the human baseline: five people, N violations. Ours: zero, across 500 randomised cohorts too.**
7. **4:45** **"Attempt a swap."** Hand it back to the judge. Watch it fail, with the reason.
8. **5:15** **Slide the equity dial.** Bruno matches. State the guardrail unprompted — ties only, never over a hard constraint — and point at the test that proves it.
9. **5:50** **Unmatched panel:** "These two matched nobody. Here's the adopter profile you need to recruit."
10. **6:20** **The stability slide** — JAMA 2025, 78.4% vs 70.9%. Why stability still wins here.
11. **6:45** What's real, what's simulated, what's next. Close on the frame: transparent, explainable allocation in a domain where such systems are usually absent or opaque. Close on Bruno.

# 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **The Bruno narrative doesn't hold in the real output** | **High** | Severe | Day 5 verification. Adjust the cohort so the story is true — never adjust the story |
| **Equity dial produces no visible change** | Medium | Severe | Day 5 check; widen the tie band if fit scores are too separated |
| **Derived preferences produce mass ties** | **High** | Moderate | Deterministic documented tiebreak decided Day 3, or you debug non-determinism Day 5 |
| **Strict constraints leave most of the cohort unmatched** | Medium | Moderate | Tune strictness Day 2; the unmatched panel reframes it, but only if the number is plausible |
| Photo licensing problem discovered late | Medium | Moderate | Settle Day 1 — free-licence sources, attributed, never implying real shelter animals |
| Impact model reads as invented | Medium | Severe | Every constant cited on screen; permanent labels; conservative/optimistic toggle |
| "Why not just optimise?" catches you flat | Medium | Severe | §4 — independent preference sides *and* a pre-emptive slide |
| Merge conflicts in the engine | High | Moderate | Single owner of `src/engine/`, stated Saturday |
| Rescue outreach gets no reply | **High** | Low | Demo written to work with zero replies |
| Deadline confusion (EST vs Manila) | Medium | Fatal | Freeze Thursday Manila time |

# 10. Open questions

1. Will any rescue reply by Wednesday? Build as if not.
2. Can one team submit two projects? (Decides whether Audhee's wildlife-trafficking idea runs in parallel.)
3. Which animal is Bruno? Pick the through-line on Day 2 and write the whole demo around them.

# 11. Success criteria

**Minimum:** a live URL where a judge runs the cohort, sees explained assignments with citations, and can attempt a swap and watch it fail. Both property tests passing. Submitted, registered, presented on time.

**Target:** the above, plus real surveyed applicants, the human baseline result, the 500-cohort aggregate, the equity dial visibly changing Bruno's outcome, and the unmatched recruitment panel.

**Stretch:** a rescue quote in the presentation, an award in any of the 15+ categories, and an invitation to publish as a book chapter — the compounding-impact model and the human baseline are the parts worth writing up.
