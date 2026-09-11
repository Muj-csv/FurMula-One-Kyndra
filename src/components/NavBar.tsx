// NavBar — ported from Frontend/shared.js's NAV_HTML, adapted to real
// in-app navigation (a page switch in App.tsx, not four separate HTML files).
// No routing library: Architecture §2 keeps dependencies to React/Vite/
// TypeScript/Vitest/styling only, so this is a plain state switch, synced to
// location.hash by App.tsx so back/forward and reload still work.
//
// Kyndra_UI_UX_Refinement_Prompt.md Phase 1: nav reads Overview | Cohort
// Demo | Matching | About — "Explore Cohort" renamed to "Cohort Demo" to
// match what the page actually is (Phase 3). The two notification/profile
// icon buttons that used to sit here were removed in Phase 6.1: they never
// had behaviour behind them ("coming soon" since Frontend/REVISION-PHASES.md
// Phase 1), and a non-functional icon doesn't earn a permanent spot in the
// nav of a presentation-ready product.

export type Page = 'home' | 'cohort' | 'match' | 'evidence';

const LINKS: { page: Page; label: string }[] = [
  { page: 'home', label: 'Overview' },
  { page: 'cohort', label: 'Cohort Demo' },
  { page: 'match', label: 'Matching' },
  { page: 'evidence', label: 'About' },
];

export function NavBar({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return (
    <nav className="top-nav" aria-label="Primary navigation">
      <button type="button" className="nav-logo" onClick={() => onNavigate('home')}>
        <img className="logo-mark" src="/kyndra-logo.png" alt="" aria-hidden="true" />
        Kyndra
      </button>

      <div className="nav-links">
        {LINKS.map((link) => (
          <button
            key={link.page}
            type="button"
            className={`nav-link${page === link.page ? ' active' : ''}`}
            onClick={() => onNavigate(link.page)}
          >
            {link.label}
          </button>
        ))}
      </div>

      <div className="nav-actions">
        <button type="button" className="nav-link quiz-link" onClick={() => onNavigate('match')}>
          Try Matching
        </button>
      </div>
    </nav>
  );
}
