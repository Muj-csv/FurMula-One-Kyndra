// Footer — ported from Frontend/shared.js's FOOTER_HTML.
//
// The FOOTER_HTML prototype had a link-columns section (Browse Cohort / How
// It Works / Run the Engine / Attempt a Swap / Evidence) that only duplicated
// the NavBar's own navigation — every one of those destinations is already a
// button in the nav above. Removed rather than kept as a second, redundant
// way to reach the same four pages.

export function Footer() {
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
      </div>
      {/* Phase 1 (Frontend/REVISION-PHASES.md): the previous bottom line
          ("Simulated animals; real applicants...") is already stated
          prominently at the top of every page via App.tsx's provenance
          banner (PRD §3.1) — this row carries the standard footer-bottom
          content instead: copyright and legal labels. The labels are plain
          text, not links, since there are no real destination pages for
          them yet. */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Kyndra. All rights reserved.</p>
        <div className="legal-links">
          <span>Privacy Policy</span>
          <span>Terms of Use</span>
          <span>Accessibility</span>
        </div>
      </div>
    </footer>
  );
}
