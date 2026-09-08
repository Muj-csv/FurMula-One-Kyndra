// Footer — ported from Frontend/shared.js's FOOTER_HTML, wired to the same
// in-app navigation as NavBar instead of four separate HTML files.

import type { Page } from './NavBar';

export function Footer({ onNavigate }: { onNavigate: (page: Page) => void }) {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="nav-logo">
            <svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
              <use href="#paw-icon-light" />
            </svg>
            Kyndra
          </div>
          <p>Transparent, explainable allocation for animal shelters. The system proposes; shelter staff decide.</p>
        </div>
        <div className="footer-links">
          <div className="link-column">
            <h4>Explore</h4>
            <button type="button" onClick={() => onNavigate('cohort')}>
              Browse Cohort
            </button>
            <button type="button" onClick={() => onNavigate('home')}>
              How It Works
            </button>
            <button type="button" onClick={() => onNavigate('match')}>
              Run the Engine
            </button>
          </div>
          <div className="link-column">
            <h4>Transparency</h4>
            <button type="button" onClick={() => onNavigate('match')}>
              Attempt a Swap
            </button>
            <button type="button" onClick={() => onNavigate('evidence')}>
              Evidence
            </button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Simulated animals; real applicants. Prototype interface.</p>
      </div>
    </footer>
  );
}
