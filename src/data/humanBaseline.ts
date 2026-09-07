// Recorded results of the manual-placement study — Architecture §7, PRD §5.
//
// PHASE 0: NOT YET RUN. The study is a Day 3–4 deliverable.
//
// The result fields are `null` on purpose. Architecture §7 sketches them as
// zeroes with a "fill in after running it" comment, but a literal 0 renders as
// "five people made zero violations" — a plausible fake result, which Phase 0
// explicitly forbids. `null` cannot be mistaken for a finding, and the UI must
// refuse to render this panel until `recorded` is true.

export const HUMAN_BASELINE = {
  recorded: false,
  participants: 5,
  method: 'Same cohort, 2-minute timer, first-come-first-served placement',
  meanViolations: null as number | null,
  range: null as [number, number] | null,
  caveat: 'Informal exercise with 5 participants, not a controlled study.',
} as const;
