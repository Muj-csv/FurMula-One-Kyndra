// HomePage — the landing screen. Ported from Frontend/index.html's hero and
// "how it works" explainer. Presentational only: no engine calls, no cohort
// state, and — since the hero dog became an ambient loop rather than a
// cursor-driven scrub — no interaction either. The only JavaScript the hero
// needs now is the one thing markup cannot express: holding playback to the
// visitor's prefers-reduced-motion setting while that setting can still
// change.
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

import { useEffect, useRef, useState } from 'react';
import type { Page } from './NavBar';
import { JourneyTrack } from './JourneyTrack';
import { Disclosure } from './Disclosure';

/**
 * Does this visitor want motion reduced?
 *
 * Live, not read once: the setting can be toggled while the page is open, and
 * an ambient loop is precisely the kind of thing someone turns it on to stop.
 *
 * Optional-called and guarded — matchMedia is absent in jsdom, and a missing
 * media-query API is not a reason to throw during render. No answer is read
 * as "no preference expressed", which is the same default the browser uses.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
  );

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query === undefined) return;
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/**
 * Hold the hero loop to the visitor's motion preference.
 *
 * The `autoplay` attribute alone cannot do this: it is read when the element
 * is inserted, so it settles the question once and has no answer for someone
 * who turns the preference on afterwards. React removing the attribute does
 * not stop a video that is already playing either — `autoplay` describes how
 * playback STARTS, not whether it continues.
 *
 * So the attribute handles the first frame (it is the only thing that can,
 * before React has mounted an effect) and this keeps it honest from then on.
 * Rewinding rather than merely pausing is deliberate: a pause leaves the dog
 * frozen mid-gesture, which reads as a broken asset. Frame 0 is the pose the
 * poster shows, so a reduced-motion visitor gets the same composed image
 * anyone sees before playback begins.
 */
function useHeroLoopPlayback(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  reduced: boolean,
) {
  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;

    if (reduced) {
      video.pause();
      video.currentTime = 0;
      return;
    }

    // play() rejects on its own terms — a battery saver, a browser that wants
    // a gesture first, a decoder that is not ready. None of those are errors
    // worth surfacing: the poster is already showing the dog, so the hero is
    // intact either way.
    try {
      void video.play()?.catch(() => {});
    } catch {
      // jsdom has no media stack at all, and throws outright.
    }
  }, [videoRef, reduced]);
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
  const reducedMotion = usePrefersReducedMotion();
  useHeroLoopPlayback(videoRef, reducedMotion);

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

          {/* An ambient loop, not a control. Nothing here reacts to the
              cursor: the dog sits, looks about and settles, the same way
              every time, for everyone.

              `role="img"` with a label on the WRAPPER, and aria-hidden on the
              video itself. A decorative autoplaying video announces nothing
              useful on its own — assistive tech would offer media controls
              for a thing that has none — so the pair is described once, as a
              picture, which is what it is.

              The poster is frame 0, and it carries the hero on its own in
              three cases: before the video has arrived, if it never arrives,
              and under prefers-reduced-motion, where playback is held at
              that same frame. The box is therefore never empty, which is
              what the old preload="none" video could not promise.

              muted + playsInline are what make autoplay permissible at all;
              the file has no audio track, so muted costs nothing. */}
          <div
            className="hero-dog"
            role="img"
            aria-label="An animated beagle sitting and looking around."
          >
            <video
              ref={videoRef}
              className="hero-dog__video"
              src="/hero-dog-loop.mp4"
              poster="/hero-dog-poster.webp"
              width={720}
              height={1280}
              autoPlay={!reducedMotion}
              muted
              loop
              playsInline
              preload="auto"
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>
        </div>
      </header>

      <main className="page">
        <section id="what">
          <JourneyTrack step={1} />
          <div className="section-head section-head--tight">
            <div>
              {/* Punch list item 6. Decorative and aria-hidden: the heading
                  already says "Kyndra", so announcing the mark would repeat
                  it. Sized in em against the heading rather than in pixels,
                  so it holds if the type scale moves. */}
              <h2>
                <svg className="heading-mark" viewBox="0 0 32 32" aria-hidden="true">
                  <use href="#kyndra-mark" />
                </svg>
                What is Kyndra?
              </h2>
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
