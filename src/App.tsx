// Phase 0 shell. Renders proof that the build, the entry point, and the
// engine boundary are wired — and nothing else. No product flow exists yet.

import { PROVENANCE_LABEL } from './data/researchConstants';
export function App() {
  return (
    <main className="shell">
      <header className="shell__header">
        <h1>Kyndra</h1>
        <p className="shell__tagline">
          Where the right homes meet the right animals.
        </p>
      </header>

      <section className="shell__status">
        <p>
          <strong>Phase 0 — repository scaffolding.</strong> The matching engine
          is not implemented. Nothing on this page is a result.
        </p>
        <p className="shell__note">{PROVENANCE_LABEL}</p>
      </section>
    </main>
  );
}
