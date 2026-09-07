# `src/engine/` — single owner

**One person owns this directory. Nobody else commits here.**

PRD §7 and Architecture §3. Six people on a small codebase in six days is a
merge-conflict machine, and the one directory that must be correct is the one
that must not be contended. State this out loud on Saturday.

## The boundary

`index.ts` is the **only** public surface. It exports `runMatch()` and the
domain types, and nothing else. Nothing outside this directory may import an
engine internal — not `deferred.ts`, not `constraints.ts`, not `types.ts`.

That is what keeps the engine independently testable, and it means a
Wednesday-night UI rewrite cannot break correctness.

## Rules

- Pure TypeScript. Synchronous. **Zero dependencies.**
- No React, no DOM, no `fetch`, no `localStorage` — none of it belongs here.
- The two preference orders **must not share a scoring function**
  (Architecture §6 STEP 2). Applicants rank on want; the shelter ranks on
  need. If both derive from one fit score, stability becomes vacuous.
- Equity is a tie-break only. It can never reinstate a pair that failed a
  hard constraint (Architecture §6 STEP 3). Property test #2 enforces this.
- Tests are written **alongside** the algorithm, never after it
  (Architecture §7).

## Status: Phase 0

Every module here is a signature-only stub that **throws**. This is deliberate.
A stub that returns a plausible fake result is worse than a stub that throws.
The pipeline (Architecture §6) is P0 work.
