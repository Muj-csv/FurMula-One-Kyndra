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
//
// Redesign Phase 3 (§8, "keep the header lightweight"): the right-hand
// "Try Matching" button is gone. It navigated to the Matching page — which
// is already the third link in this same bar — so it was a second, louder
// route to a destination the visitor could already see, and it made the
// header read as a landing-page banner rather than as navigation. The
// primary actions live in the hero and on each page, where they belong.

export type Page = 'home' | 'cohort' | 'match' | 'evidence';

export type Theme = 'light' | 'dark';

/**
 * The theme control.
 *
 * A real <button> with a real name and a real state, not a bare icon:
 * `aria-pressed` is the ARIA pattern for a two-state toggle, so a screen
 * reader announces "Dark mode, toggle button, not pressed" rather than
 * leaving the user to infer what a crescent means. The icons are decorative
 * and marked as such.
 *
 * It sits top-right, in the space the duplicate "Try Matching" CTA used to
 * occupy — contextual control rather than a second navigation route, which
 * is what the redesign brief's §8 wanted there in the first place.
 */
function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-pressed={dark}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <svg className="theme-toggle__icon" viewBox="0 0 20 20" aria-hidden="true">
        {dark ? (
          <path
            d="M15.5 12.6A6.2 6.2 0 0 1 7.4 4.5a6.3 6.3 0 1 0 8.1 8.1Z"
            fill="currentColor"
          />
        ) : (
          <>
            <circle cx="10" cy="10" r="3.6" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <path d="M10 1.8v2.1M10 16.1v2.1M18.2 10h-2.1M3.9 10H1.8" />
              <path d="M15.8 4.2 14.3 5.7M5.7 14.3 4.2 15.8M15.8 15.8l-1.5-1.5M5.7 5.7 4.2 4.2" />
            </g>
          </>
        )}
      </svg>
      Dark mode
    </button>
  );
}

const LINKS: { page: Page; label: string }[] = [
  { page: 'home', label: 'Overview' },
  { page: 'cohort', label: 'Cohort Demo' },
  { page: 'match', label: 'Matching' },
  { page: 'evidence', label: 'About' },
];

export function NavBar({
  page,
  onNavigate,
  theme,
  onToggleTheme,
}: {
  page: Page;
  onNavigate: (page: Page) => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
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
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </nav>
  );
}
