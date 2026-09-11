// HomePage — the landing screen. Ported from Frontend/index.html's hero and
// "how it works" explainer. Presentational only: no engine calls, no cohort
// state. The cursor-scrub hero video is the one piece of interaction, ported
// from shared.js's HERO DOG SCRUB block as a plain effect — no dependency.

import { useEffect, useRef } from 'react';
import type { Page } from './NavBar';
import { JourneyTrack } from './JourneyTrack';

/** Timestamp (seconds) where the video's left-to-right pan ends. */
const HORIZONTAL_PAN_END_TIME = 2.0;

function useHeroDogScrub(videoRef: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;

    let targetTime = 0;
    let seekFrame: number | null = null;
    let videoReady = false;
    let lastTime = -1;

    const seek = () => {
      seekFrame = null;
      if (!videoReady || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const nextTime = Math.max(0, Math.min(video.duration - 0.001, targetTime));
      if (Math.abs(nextTime - lastTime) < 0.003) return;
      lastTime = nextTime;
      video.currentTime = nextTime;
    };

    const queueSeek = (time: number) => {
      targetTime = time;
      if (seekFrame === null) seekFrame = requestAnimationFrame(seek);
    };

    const onLoadedMetadata = () => {
      videoReady = Number.isFinite(video.duration) && video.duration > 0;
      if (videoReady) {
        video.currentTime = 0;
        lastTime = 0;
      }
    };
    const onError = () => {
      videoReady = false;
    };
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);

    const onMouseMove = (e: MouseEvent) => {
      if (!videoReady || !Number.isFinite(video.duration) || video.duration <= 0) return;
      const progress = Math.max(0, Math.min(1, e.clientX / Math.max(1, window.innerWidth)));
      queueSeek(progress * HORIZONTAL_PAN_END_TIME);
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      window.removeEventListener('mousemove', onMouseMove);
      if (seekFrame !== null) cancelAnimationFrame(seekFrame);
    };
  }, [videoRef]);
}

export function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useHeroDogScrub(videoRef);

  return (
    <>
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-copy-block">
            <span className="eyebrow">Transparent · Explainable · Constraint-aware</span>
            <h1>
              Where the right homes meet the <em>right animals.</em>
            </h1>
            <p className="hero-copy">
              Kyndra treats shelter placement as a two-sided matching problem. Hard constraints
              remove impossible pairings, preferences stay independent, and every proposed
              match can be inspected — and argued with.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary" onClick={() => onNavigate('match')}>
                Run the matching engine
              </button>
              <button type="button" className="secondary" onClick={() => onNavigate('cohort')}>
                Explore the cohort
              </button>
            </div>
          </div>

          <div className="hero-dog" aria-label="Interactive dog banner. Move your mouse to guide the dog's head.">
            <video ref={videoRef} muted playsInline preload="auto" tabIndex={-1} aria-hidden="true">
              <source src="/hero-dog.mp4" type="video/mp4" />
            </video>
            <div className="hero-dog-label">Move your cursor · guide the dog</div>
          </div>
        </div>
      </header>

      <main className="page">
        {/* Phase 1.1 — Overview as onboarding. Answers "what is this", "what
            problem does it solve", and "how does it work" in plain language,
            before anything technical. */}
        <section id="what">
          <JourneyTrack step={1} />
          <div className="section-head section-head--tight">
            <div>
              <h2>What is Kyndra?</h2>
            </div>
          </div>
          <div className="onboarding-grid">
            <p className="onboarding-copy">
              Kyndra is a matching system for animal shelters. It takes the animals waiting for
              homes and the households applying to adopt, and proposes who should go with whom —
              not by ranking pets for a person, but by weighing what both sides actually need.
            </p>
            <p className="onboarding-copy onboarding-copy--secondary">
              <strong>The problem it solves:</strong> matching by hand means one coordinator
              holding every animal&rsquo;s needs and every household&rsquo;s constraints in their
              head at once, for every possible pairing. That does not scale past a handful of
              animals, and it is easy to miss a conflict — or a good fit — under time pressure.
            </p>
          </div>
        </section>

        <section id="process">
          <div className="section-head section-head--tight">
            <div>
              <h2>How does Kyndra work?</h2>
              <p>Five steps, run automatically every time.</p>
            </div>
          </div>
          <ol className="process-flow">
            <li className="process-flow__step">
              <span className="process-flow__num">01</span>
              <strong>Build the cohort</strong>
              <span>Animals and households enter the system.</span>
            </li>
            <li className="process-flow__step">
              <span className="process-flow__num">02</span>
              <strong>Filter</strong>
              <span>Impossible pairings are removed.</span>
            </li>
            <li className="process-flow__step">
              <span className="process-flow__num">03</span>
              <strong>Derive</strong>
              <span>The system considers information from both sides.</span>
            </li>
            <li className="process-flow__step">
              <span className="process-flow__num">04</span>
              <strong>Match</strong>
              <span>A stable assignment is calculated.</span>
            </li>
            <li className="process-flow__step">
              <span className="process-flow__num">05</span>
              <strong>Review</strong>
              <span>Staff inspect the resulting matches.</span>
            </li>
          </ol>
          <div className="hero-actions">
            <button type="button" className="primary" onClick={() => onNavigate('cohort')}>
              See the Cohort Demo →
            </button>
          </div>
        </section>

        <section id="how">
          <div className="section-head section-head--tight">
            <div>
              <h2>Matching, without the black box.</h2>
              <p>The mechanics behind steps 02–04, for anyone who wants the detail.</p>
            </div>
          </div>
          <div className="explainer">
            <div>
              <p style={{ marginTop: 0, maxWidth: '44ch', color: 'var(--ink-soft)' }}>
                Kyndra does not act as an AI decision-maker. It proposes a stable assignment with
                reasons. Staff remain in control, and hard constraints are treated as actual
                constraints, not just lower scores.
              </p>
              <div className="reason">
                <b>Why this matters</b>
                A recommendation can be argued with. An opaque ranking can&rsquo;t.
              </div>
            </div>
            <div className="steps">
              <div className="step">
                <b>01</b>
                <div>
                  <strong>Filter impossible pairs</strong>
                  <br />
                  <span>Constraint violations are eliminated, not down-ranked.</span>
                </div>
              </div>
              <div className="step">
                <b>02</b>
                <div>
                  <strong>Derive both sides</strong>
                  <br />
                  <span>Applicant wants ≠ animal needs. Nobody hand-ranks a list.</span>
                </div>
              </div>
              <div className="step">
                <b>03</b>
                <div>
                  <strong>Find a stable match</strong>
                  <br />
                  <span>
                    Gale–Shapley deferred acceptance settles the whole cohort at once.
                    <br />
                    <i>Method: Gale–Shapley deferred acceptance.</i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
