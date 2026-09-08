// NavBar — ported from Frontend/shared.js's NAV_HTML, adapted to real
// in-app navigation (a page switch in App.tsx, not four separate HTML files).
// No routing library: Architecture §2 keeps dependencies to React/Vite/
// TypeScript/Vitest/styling only, so this is a plain state switch, synced to
// location.hash by App.tsx so back/forward and reload still work.

import { useEffect, useRef } from 'react';

export type Page = 'home' | 'cohort' | 'match' | 'evidence';

const LINKS: { page: Page; label: string }[] = [
  { page: 'home', label: 'Overview' },
  { page: 'cohort', label: 'Explore Cohort' },
  { page: 'match', label: 'Try Matching' },
  { page: 'evidence', label: 'About' },
];

/**
 * Follows the cursor's horizontal position along the nav bar and writes it
 * as a CSS custom property, so the gradient (index.css) can shift with it.
 * Direct DOM write, no React state — same technique as HomePage's hero-dog
 * cursor scrub, chosen for the same reason: this fires on every mousemove,
 * and re-rendering the whole nav on each one would be wasteful.
 */
function useCursorGradient(navRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const nav = navRef.current;
    if (nav === null) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = nav.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      nav.style.setProperty('--nav-x', `${percent}%`);
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMouseMove);
  }, [navRef]);
}

export function NavBar({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  const navRef = useRef<HTMLElement>(null);
  useCursorGradient(navRef);

  return (
    <nav className="top-nav" aria-label="Primary navigation" ref={navRef}>
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
        {/* Placeholder only — Phase 1 (Frontend/REVISION-PHASES.md). No
            behaviour, no backend yet; wiring these up is a separate task. */}
        <button type="button" className="icon-button" aria-label="Notifications" title="Notifications — coming soon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use href="#bell-icon" />
          </svg>
        </button>
        <button type="button" className="icon-button" aria-label="Profile" title="Profile — coming soon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <use href="#profile-icon" />
          </svg>
        </button>

        <button type="button" className="nav-link quiz-link" onClick={() => onNavigate('match')}>
          Try Matching
        </button>
      </div>
    </nav>
  );
}
