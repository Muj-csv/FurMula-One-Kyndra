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

function useHeroDogScrub(videoRef: React.RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;

    // The whole feature is a CURSOR scrub, so on a touch device it is 4.2MB
    // of video that can never be interacted with. `pointer: fine` is the
    // honest gate: no mouse, no download.
    //
    // Optional-called: matchMedia is absent in jsdom, and a missing media-query
    // API is not a reason to throw during render. No answer means no cursor
    // to scrub with, so the heavy asset stays unfetched — the safe default.
    if (window.matchMedia?.('(pointer: fine)').matches !== true) return;

    let targetTime = 0;
    let seekFrame: number | null = null;
    let videoReady = false;
    let requested = false;
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

    // preload="none" keeps the app's heaviest asset out of the critical path,
    // but on its own it also leaves an empty frame for anyone who never moves
    // the cursor. So the fetch is deferred, not abandoned: once the page has
    // finished loading and the main thread is idle, pull it in anyway.
    const request = () => {
      if (requested) return;
      requested = true;
      // `preload` must be raised BEFORE load(), and this is the whole reason
      // the dog never appeared.
      //
      // The element ships with preload="none" so the app's heaviest asset
      // stays out of the critical path. But preload is not only a hint about
      // WHEN to fetch — load() runs the resource selection algorithm, and
      // that algorithm consults preload and is entitled to stop before
      // fetching anything. Chrome does exactly that: the element sat at
      // readyState 0 / networkState 2 indefinitely, with no request for
      // hero-dog.mp4 ever appearing in resource timing, while the file itself
      // served fine (200, 4,300,623 bytes; an in-page range fetch returned
      // 206).
      //
      // Raising preload here is the documented way to say "defer, then
      // commit": the markup still prevents the fetch during first paint, and
      // this is the moment we actually want the bytes.
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

    const onMouseMove = (e: MouseEvent) => {
      // Fast path: a cursor moved, so the scrub is about to be used — fetch
      // now rather than waiting on the idle callback above.
      request();
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
  useHeroDogScrub(videoRef);

  return (
    <>
      <header className="hero">
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
            <div className="hero-dog-label">Move your cursor · guide the dog</div>
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
