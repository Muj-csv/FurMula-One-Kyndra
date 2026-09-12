// HomePage — the landing screen. Ported from Frontend/index.html's hero and
// "how it works" explainer. Presentational only: no engine calls, no cohort
// state. The cursor-scrub hero video is the one piece of interaction, ported
// from shared.js's HERO DOG SCRUB block as a plain effect — no dependency.
//
// ─── REDESIGN PHASE 3 — ONE EXPLANATION, NOT THREE ─────────────────────────
//
// This page used to explain Kyndra three times on one scroll:
//
//   "What is Kyndra?"              two paragraphs of prose
//   "How does Kyndra work?"        five numbered steps
//   "Matching, without the black   three numbered steps — 01 Filter,
//    box."                         02 Derive, 03 Find a stable match
//
// The third list restated steps 02-04 of the second one in more technical
// language, which is the exact pattern the brief calls out (§7, "repeating
// the same explanation in multiple places"). A visitor read the same idea
// three times and was no clearer after the third.
//
// Now there is ONE progression (§10), in plain language, and the mechanics
// that used to be a whole third section sit behind a disclosure — brief §15's
// level 4, "a normal user should not be forced to understand Gale-Shapley; a
// technical judge should still be able to inspect it". Nothing was deleted:
// every claim the third section made is still on the page, one click down.

import { useEffect, useRef } from 'react';
import type { Page } from './NavBar';
import { JourneyTrack } from './JourneyTrack';
import { Disclosure } from './Disclosure';

/** Timestamp (seconds) where the video's left-to-right pan ends. */
const HORIZONTAL_PAN_END_TIME = 2.0;

/** Fraction of the remaining distance covered each frame. Lower = heavier. */
const EASE = 0.16;

/** Below this gap (seconds) the head has arrived; stop animating. */
const SETTLE = 0.004;

/** Don't issue a seek for a movement smaller than this. */
const MIN_STEP = 0.004;

/**
 * The cursor scrub on the hero video.
 *
 * ─── WHAT WAS WRONG WITH THIS ──────────────────────────────────────────────
 *
 * Three things, and only the first one was visible:
 *
 *   1. It never loaded — fixed in the previous commit (preload before load).
 *
 *   2. It listened on `window` and mapped the cursor across the whole
 *      viewport, so the dog reacted to movement anywhere on the page,
 *      including while the hero was scrolled far out of view. A head turning
 *      in a box you cannot see, driven by a cursor that is reading paragraph
 *      four, is not an interaction — it is a loose event handler.
 *
 *   3. It wrote `video.currentTime` on every pointer move. Each write
 *      cancels the seek in flight, so on a 4.2MB MP4 the decoder never
 *      finishes one frame before being sent somewhere else, and the result
 *      stutters however fast the network is.
 *
 * ─── WHAT IT DOES NOW ──────────────────────────────────────────────────────
 *
 * Tracks against the hero SECTION, not the viewport and not the little video
 * box. The section is the full-width band the cursor is already moving
 * through while reading the headline, which is what makes the effect
 * discoverable; the 370px video box would require hovering the dog itself.
 * Listening on that element means we simply get no events when the cursor is
 * elsewhere, rather than getting events and discarding them.
 *
 * An IntersectionObserver adds the other half: no work at all while the hero
 * is off screen.
 *
 * Between the cursor and the video sits an eased follow — the head moves
 * toward where you are rather than snapping to it — and a seek is skipped
 * entirely while another is still in flight, which is what stops the
 * stuttering.
 */
function useHeroDogScrub(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  heroRef: React.RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (video === null || hero === null) return;

    // The whole feature is a CURSOR scrub, so on a touch device it is 4.2MB
    // of video that can never be interacted with. `pointer: fine` is the
    // honest gate: no mouse, no download.
    //
    // Optional-called: matchMedia is absent in jsdom, and a missing media-query
    // API is not a reason to throw during render. No answer means no cursor
    // to scrub with, so the heavy asset stays unfetched — the safe default.
    if (window.matchMedia?.('(pointer: fine)').matches !== true) return;

    // Reduced motion suppresses the follow, not the picture: the video still
    // loads and holds its first frame, it just stops chasing the cursor.
    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

    const stage = video.closest('.hero-dog');

    let requested = false;
    let scrubbable = false;
    let onScreen = true;
    let target = 0;
    let current = 0;
    let lastApplied = -1;
    let frame: number | null = null;

    // ─── Fetching ──────────────────────────────────────────────────────────

    const request = () => {
      if (requested) return;
      requested = true;
      // `preload` must be raised BEFORE load(). The element ships with
      // preload="none" to stay out of the critical path, but load() runs the
      // resource selection algorithm, that algorithm consults preload, and
      // Chrome is entitled to stop before fetching anything — which is
      // exactly what it did, leaving the box empty forever.
      video.preload = 'auto';
      video.load();
    };

    const whenIdle = () => {
      // Not `'requestIdleCallback' in window` — that narrows `window` itself
      // to never in the else branch. Safari still lacks it.
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(request, { timeout: 2000 });
      } else {
        window.setTimeout(request, 1200);
      }
    };
    if (document.readyState === 'complete') whenIdle();
    else window.addEventListener('load', whenIdle, { once: true });

    // ─── Readiness ─────────────────────────────────────────────────────────

    const onLoadedMetadata = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      video.currentTime = 0;
      current = 0;
      lastApplied = 0;
    };

    // canplaythrough, not loadedmetadata: seeking into a range that has not
    // arrived yet is the other half of the stutter. Until the browser says it
    // can play the whole thing without stalling, the dog holds its first
    // frame rather than lurching.
    const onReady = () => {
      scrubbable = true;
      stage?.setAttribute('data-scrub', 'ready');
    };

    const onError = () => {
      scrubbable = false;
      stage?.setAttribute('data-scrub', 'failed');
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplaythrough', onReady);
    video.addEventListener('error', onError);

    // ─── The eased follow ──────────────────────────────────────────────────

    const step = () => {
      frame = null;
      if (!scrubbable) return;

      const delta = target - current;
      const settled = Math.abs(delta) < SETTLE;
      current = settled ? target : current + delta * EASE;

      // A seek is already in flight. Do NOT start another — that is the
      // cancellation that made this stutter — but keep the loop alive so the
      // follow resumes the moment the decoder catches up.
      if (!video.seeking && Math.abs(current - lastApplied) >= MIN_STEP) {
        lastApplied = current;
        video.currentTime = current;
      }

      if (!settled || video.seeking) frame = requestAnimationFrame(step);
    };

    const kick = () => {
      if (frame === null) frame = requestAnimationFrame(step);
    };

    // ─── Input ─────────────────────────────────────────────────────────────

    const onPointerMove = (event: PointerEvent) => {
      if (!onScreen) return;
      request();

      const rect = hero.getBoundingClientRect();
      if (rect.width <= 0) return;

      const progress = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      target = progress * HORIZONTAL_PAN_END_TIME;

      // Only 'active' — never 'ready'. `ready` is set by canplaythrough and
      // by nothing else, because it is what makes the hint visible. Setting
      // it from here would put "Move your cursor" back on top of a video
      // that cannot respond, which is the exact thing this phase set out to
      // stop.
      if (scrubbable) stage?.setAttribute('data-scrub', 'active');
      if (!reducedMotion) kick();
    };

    hero.addEventListener('pointermove', onPointerMove, { passive: true });

    // ─── Visibility ────────────────────────────────────────────────────────
    //
    // Absent in jsdom, and a missing observer is not a reason to throw during
    // render — the same trap matchMedia set above. Without it the pointer
    // handler simply runs whenever the cursor is over the hero, which is
    // already correct; the observer is an optimisation, not the mechanism.

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === 'function') {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry === undefined) return;
          onScreen = entry.isIntersecting;
          if (!onScreen && frame !== null) {
            cancelAnimationFrame(frame);
            frame = null;
          }
        },
        { threshold: 0 },
      );
      observer.observe(hero);
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplaythrough', onReady);
      video.removeEventListener('error', onError);
      hero.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('load', whenIdle);
      observer?.disconnect();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [videoRef, heroRef]);
}

/**
 * The five steps, in the visitor's language rather than the pipeline's.
 *
 * These map onto the engine's real stages (Architecture §6: FILTER → DERIVE →
 * MATCH → VERIFY → EXPLAIN) — the wording changed, the process did not. The
 * engine's own names for them are in the disclosure below.
 */
const STEPS: { label: string; detail: string }[] = [
  { label: 'Tell us about the household', detail: 'Home, routine, experience, and what they want.' },
  { label: 'Check what each animal needs', detail: 'Every animal arrives with its own requirements.' },
  { label: 'Rule out what cannot work', detail: 'Unsafe or unsuitable pairings are removed, not ranked.' },
  { label: 'Match both sides at once', detail: 'The whole group is settled together, not first-come.' },
  { label: 'Explain every result', detail: 'Each proposal carries the reasons behind it.' },
];

export function HomePage({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // The hero SECTION is the tracking region, not the viewport and not the
  // video box — see the note on useHeroDogScrub.
  const heroRef = useRef<HTMLElement>(null);
  useHeroDogScrub(videoRef, heroRef);

  return (
    <>
      <header className="hero" ref={heroRef}>
        <div className="hero-inner">
          <div className="hero-copy-block">
            <span className="eyebrow">For animal shelters</span>
            <h1>
              Where the right homes meet the <em>right animals.</em>
            </h1>
            <p className="hero-copy">
              Kyndra weighs what every animal needs against what every household can offer,
              rules out the pairings that would not work, and proposes who should go with
              whom — with the reasons attached.
            </p>
            <div className="hero-actions">
              <button type="button" className="primary" onClick={() => onNavigate('cohort')}>
                Start with the demo cohort
              </button>
              <button type="button" className="secondary" onClick={() => onNavigate('match')}>
                Build your own
              </button>
            </div>
            <p className="hero-note">Kyndra proposes. Shelter staff decide.</p>
          </div>

          <div className="hero-dog" aria-label="Interactive dog banner. Move your mouse to guide the dog's head.">
            <video ref={videoRef} muted playsInline preload="none" tabIndex={-1} aria-hidden="true">
              <source src="/hero-dog.mp4" type="video/mp4" />
            </video>
            <div className="hero-dog-label">Move your cursor</div>
          </div>
        </div>
      </header>

      <main className="page">
        <section id="what">
          <JourneyTrack step={1} />
          <div className="section-head section-head--tight">
            <div>
              <h2>What is Kyndra?</h2>
            </div>
          </div>
          <p className="onboarding-copy">
            Matching animals to homes by hand means one coordinator holding every animal&rsquo;s
            needs and every household&rsquo;s limits in their head at once — for every possible
            pairing. It does not scale, and under time pressure it is easy to miss a conflict,
            or a good fit. Kyndra does that comparison in full, every time, and shows its work.
          </p>
        </section>

        {/* Full-bleed tint band — the one visual break on the page, and the
            one thing on it a visitor has to understand. */}
        <section id="process" className="section-band">
          <div className="section-head section-head--tight">
            <div>
              <h2>How it works</h2>
              <p>Five steps, run the same way every time.</p>
            </div>
          </div>
          <ol className="process-flow">
            {STEPS.map((step, index) => (
              <li key={step.label} className="process-flow__step">
                <span className="process-flow__num">{String(index + 1).padStart(2, '0')}</span>
                <strong>{step.label}</strong>
                <span>{step.detail}</span>
              </li>
            ))}
          </ol>

          <div className="hero-actions">
            <button type="button" className="primary" onClick={() => onNavigate('cohort')}>
              See it on a real cohort →
            </button>
          </div>

          {/* Level 4 (§15) — the mechanics, for whoever wants them. This was
              a full third section of the page until Phase 3; every claim it
              made is still here, one click down instead of in the scroll of
              someone who only wanted to know what the product does. */}
          <Disclosure
            title="How the matching actually works"
            teaser="The method, the guarantee it gives, and why it is not a ranking."
          >
            <p className="onboarding-copy onboarding-copy--secondary">
              Kyndra is not an AI decision-maker. It proposes an assignment and explains it;
              staff decide. Requirements are treated as actual requirements — a pairing that
              fails one is removed outright, never just scored lower.
            </p>

            <div className="steps">
              <div className="step">
                <b>01</b>
                <div>
                  <strong>Rule out the impossible</strong>
                  <br />
                  <span>
                    Some matches are not safe or suitable — Kyndra checks every
                    animal–household pair against those requirements ("hard constraints")
                    first and removes the ones that fail, rather than just ranking them
                    lower.
                  </span>
                </div>
              </div>
              <div className="step">
                <b>02</b>
                <div>
                  <strong>Build both sides separately</strong>
                  <br />
                  <span>
                    What a household wants and what an animal needs are derived from
                    different information, and never from one shared score. Nobody
                    hand-ranks a list.
                  </span>
                </div>
              </div>
              <div className="step">
                <b>03</b>
                <div>
                  <strong>Settle the whole group at once</strong>
                  <br />
                  <span>
                    Gale–Shapley deferred acceptance produces a <i>stable</i> assignment:
                    no animal and household would both rather have each other than what
                    they were given.
                  </span>
                </div>
              </div>
            </div>

            <div className="reason">
              <b>Why this matters</b>
              A proposal with its reasons attached can be argued with. An opaque ranking
              cannot.
            </div>
          </Disclosure>
        </section>
      </main>
    </>
  );
}
