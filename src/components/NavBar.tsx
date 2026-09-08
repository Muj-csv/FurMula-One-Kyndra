// NavBar — ported from Frontend/shared.js's NAV_HTML, adapted to real
// in-app navigation (a page switch in App.tsx, not four separate HTML files).
// No routing library: Architecture §2 keeps dependencies to React/Vite/
// TypeScript/Vitest/styling only, so this is a plain state switch, synced to
// location.hash by App.tsx so back/forward and reload still work.

export type Page = 'home' | 'cohort' | 'match' | 'evidence';

const LINKS: { page: Page; label: string }[] = [
  { page: 'cohort', label: 'Explore Cohort' },
  { page: 'match', label: 'Try Matching' },
  { page: 'home', label: 'Overview' },
  { page: 'evidence', label: 'Evidence' },
];

export function NavBar({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return (
    <nav className="top-nav" aria-label="Primary navigation">
      <button type="button" className="nav-logo" onClick={() => onNavigate('home')}>
        <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
          <use href="#paw-icon" />
        </svg>
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
