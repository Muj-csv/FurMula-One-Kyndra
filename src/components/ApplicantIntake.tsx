// ApplicantIntake — answers: "What does this household look like?" (Architecture §8).
//
// P0-2. Opens with the specific-animal question, because a real human choice
// must never be overridden by a derived score — and because asking it first is
// what makes the two preference sides genuinely independent (Architecture §6).
//
// Nobody hand-ranks a list. Everything below the first question is a household
// fact or a stated want; the engine derives both orders from them.
//
// ─── REDESIGN PHASE 4 — SECTIONS, NOT ONE LONG FORM ────────────────────────
//
// This was a flat eight-field auto-fit grid with four loose checkboxes under
// it — twelve controls in one undifferentiated block, labelled in the
// engine's vocabulary ("Hours away per day", "Experience with animals").
//
// It is grouped now (§12), and the grouping is not decoration: the last
// section is separated from the rest BECAUSE the engine treats it
// differently. Everything above "What you're hoping for" is a household
// FACT, which only the shelter side ranks on; everything inside it is a
// stated WANT, which only the applicant side ranks on. Keeping the two
// visually apart is the clearest statement of Architecture §6's rule that
// the two preference orders never share an input.
//
// Deliberately NOT a multi-step wizard. Architecture §8 makes "a preset
// button loads the cohort in one click, never type during the presentation" a
// requirement, so the form is not on the demo path at all — paging it would
// add state and clicks to something a judge should be able to take in at a
// glance, and §12 only asks for progress indication IF the form becomes
// multi-step.

import { useEffect, useState } from 'react';
import type { Animal, Applicant } from '../engine';
import {
  isSurveyCaptureEnabled,
  submitSurveyResponse,
  type ShareStatus,
} from '../data/surveyCapture';

type Level = 1 | 2 | 3 | 4 | 5;
const LEVELS: Level[] = [1, 2, 3, 4, 5];

/**
 * The 1-5 scales, said in words.
 *
 * The form used to render these as the bare number plus a fragment ("3 -
 * some"), which asks the visitor to map their own life onto an integer. The
 * engine still receives the integer; only the label changed.
 */
const EXPERIENCE_LABELS = [
  'First-time owner',
  'A little experience',
  'Some experience',
  'Very experienced',
  'I have handled difficult animals',
];

const ENERGY_LABELS = ['Very calm', 'Calm', 'In between', 'Active', 'Very active'];

function blankApplicant(id: string): Applicant {
  return {
    id,
    name: '',
    surveyed: false,
    homeType: 'apartment',
    hasYard: false,
    hoursAwayPerDay: 8,
    hasChildren: false,
    hasOtherPets: false,
    experience: 3,
    canDoDailyMeds: false,
    maxSizeKg: 20,
    specificAnimalId: null,
    prefersSpecies: null,
    prefersAge: null,
    prefersEnergy: null,
  };
}

export function ApplicantIntake({
  animals,
  nextId,
  onSubmit,
}: {
  animals: Animal[];
  nextId: string;
  onSubmit: (applicant: Applicant) => void;
}) {
  const [form, setForm] = useState<Applicant>(() => blankApplicant(nextId));

  // P1-1 sharing. Opt-in, unticked by default: consent that arrives pre-ticked
  // is not consent, and `surveyed: true` is the flag our headline claim rests
  // on. The whole block disappears when no endpoint is configured.
  const captureEnabled = isSurveyCaptureEnabled();
  const [share, setShare] = useState(false);
  const [status, setStatus] = useState<ShareStatus>('idle');

  // Guards against a double submit producing a real bug, not just a UI
  // annoyance: `nextId` is a prop the PARENT computes from its own cohort
  // state, so two submit() calls that both run before that parent state
  // update lands would both see the SAME `nextId` and add two applicants
  // sharing one id — the exact "duplicate id" corruption data/cohortEdit.ts
  // warns about, silently overwriting one in the engine's preference maps.
  // `isSubmitting` locks the button the instant it is clicked and only
  // unlocks once `nextId` itself changes, which is the actual proof the
  // parent has caught up — not a timer, not a guess.
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    setIsSubmitting(false);
  }, [nextId]);

  const set = <K extends keyof Applicant>(key: K, value: Applicant[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  /**
   * Number inputs, clamped on the way in.
   *
   * `Number('')` is 0, so clearing "Largest animal you can take" used to set
   * maxSizeKg to 0 — which fails the size constraint for EVERY animal in the
   * cohort, and presents as "no matches" with nothing on screen explaining
   * why. min/max attributes alone do not prevent it: they gate form
   * submission, not the value React stores as you type. NaN falls back to
   * the low end rather than propagating into the engine.
   */
  const setNumber = (key: 'hoursAwayPerDay' | 'maxSizeKg', raw: string, lo: number, hi: number) => {
    const parsed = Number(raw);
    set(key, Math.min(hi, Math.max(lo, Number.isFinite(parsed) ? parsed : lo)));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const name = form.name.trim() === '' ? `Household ${nextId}` : form.name.trim();
    // `surveyed` stays false on the LOCAL record even when `share` is ticked —
    // `blankApplicant` never sets it otherwise, and it is not touched here. That
    // flag means "reviewed and committed to cohort.ts as a real response" (see
    // Architecture §12), which a click in this session cannot make true. Only
    // scripts/csv-to-applicants.mjs sets it, and only for rows a person reviewed.
    const applicant: Applicant = { ...form, id: nextId, name };

    // Local first, and unconditionally. The household enters the cohort and the
    // engine re-runs whether or not the share is attempted, succeeds, or the
    // visitor is offline — the demo path never waits on the network.
    onSubmit(applicant);
    setForm(blankApplicant(nextId));

    if (!captureEnabled || !share) {
      setStatus('idle');
      return;
    }

    setStatus('sharing');
    void submitSurveyResponse(applicant).then(setStatus);
    setShare(false);
  };

  return (
    <form className="intake" onSubmit={submit}>
      <h2 className="section__title">Add a household</h2>

      {/* The question that comes first, on purpose — a real human choice
          outranks anything a derived score can produce. */}
      <fieldset className="intake__section intake__section--specific">
        <legend>Are you here for a specific animal?</legend>
        <p className="intake__hint">
          If you are, they become this household&rsquo;s first choice outright — nothing
          Kyndra calculates can move them.
        </p>
        <label className="field">
          <span className="field__label">The animal you came for</span>
          <select
            value={form.specificAnimalId ?? ''}
            onChange={(event) =>
              set('specificAnimalId', event.target.value === '' ? null : event.target.value)
            }
          >
            <option value="">No — show me everyone</option>
            {animals.map((animal) => (
              <option key={animal.id} value={animal.id}>
                Yes — {animal.name}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="intake__section">
        <legend>About your home</legend>
        <div className="intake__grid">
          <label className="field">
            <span className="field__label">What should we call this household?</span>
            <input
              type="text"
              value={form.name}
              placeholder={`Household ${nextId}`}
              onChange={(event) => set('name', event.target.value)}
            />
            <span className="field__hint">Optional — we&rsquo;ll number it if you leave this blank.</span>
          </label>

          <label className="field">
            <span className="field__label">What kind of home is it?</span>
            <select
              value={form.homeType}
              onChange={(event) =>
                set('homeType', event.target.value === 'house' ? 'house' : 'apartment')
              }
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">Largest animal you could take</span>
            <input
              type="number"
              min={1}
              max={70}
              value={form.maxSizeKg}
              onChange={(event) => setNumber('maxSizeKg', event.target.value, 1, 70)}
            />
            <span className="field__hint">
              In kilograms. A firm limit — Kyndra never proposes above it.
            </span>
          </label>
        </div>

        <div className="intake__checks">
          <label className="check">
            <input
              type="checkbox"
              checked={form.hasYard}
              onChange={(event) => set('hasYard', event.target.checked)}
            />
            There&rsquo;s a yard or garden
          </label>
        </div>
      </fieldset>

      <fieldset className="intake__section">
        <legend>Who else is at home</legend>
        <p className="intake__hint">
          Some animals cannot safely live with children, or with other pets. This is the
          part that rules pairings out.
        </p>
        <div className="intake__checks">
          <label className="check">
            <input
              type="checkbox"
              checked={form.hasChildren}
              onChange={(event) => set('hasChildren', event.target.checked)}
            />
            There are children in the home
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={form.hasOtherPets}
              onChange={(event) => set('hasOtherPets', event.target.checked)}
            />
            We already have pets
          </label>
        </div>
      </fieldset>

      <fieldset className="intake__section">
        <legend>Your day</legend>
        <div className="intake__grid">
          <label className="field">
            <span className="field__label">How long is the home usually empty?</span>
            <input
              type="number"
              min={0}
              max={14}
              value={form.hoursAwayPerDay}
              onChange={(event) => setNumber('hoursAwayPerDay', event.target.value, 0, 14)}
            />
            <span className="field__hint">Hours on a typical day, 0&ndash;14.</span>
          </label>

          <label className="field">
            <span className="field__label">How comfortable are you caring for an animal?</span>
            <select
              value={form.experience}
              onChange={(event) => set('experience', Number(event.target.value) as Level)}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {EXPERIENCE_LABELS[level - 1]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="intake__checks">
          <label className="check">
            <input
              type="checkbox"
              checked={form.canDoDailyMeds}
              onChange={(event) => set('canDoDailyMeds', event.target.checked)}
            />
            We could give daily medication
          </label>
        </div>
      </fieldset>

      {/* Kept apart from everything above on purpose — see the note at the
          top of this file. Everything before this point is a household FACT
          the shelter ranks on; everything in here is a WANT only the
          household ranks on. The two never mix. */}
      <fieldset className="intake__section intake__section--wants">
        <legend>What you&rsquo;re hoping for</legend>
        <p className="intake__hint">
          All optional. These shape which animals you would prefer — they never override
          what an animal needs.
        </p>
        <div className="intake__grid">
          <label className="field">
            <span className="field__label">Dog or cat?</span>
            <select
              value={form.prefersSpecies ?? ''}
              onChange={(event) =>
                set(
                  'prefersSpecies',
                  event.target.value === '' ? null : event.target.value === 'dog' ? 'dog' : 'cat',
                )
              }
            >
              <option value="">No preference</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">Any age in mind?</span>
            <select
              value={form.prefersAge ?? ''}
              onChange={(event) => {
                const value = event.target.value;
                set(
                  'prefersAge',
                  value === 'young' || value === 'adult' || value === 'senior' ? value : null,
                );
              }}
            >
              <option value="">No preference</option>
              <option value="young">Young</option>
              <option value="adult">Adult</option>
              <option value="senior">Senior</option>
            </select>
          </label>

          <label className="field">
            <span className="field__label">How lively would you like them?</span>
            <select
              value={form.prefersEnergy ?? ''}
              onChange={(event) =>
                set(
                  'prefersEnergy',
                  event.target.value === '' ? null : (Number(event.target.value) as Level),
                )
              }
            >
              <option value="">No preference</option>
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {ENERGY_LABELS[level - 1]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {captureEnabled ? (
        <fieldset className="intake__consent">
          <legend>Help our research? (completely optional)</legend>
          <p className="intake__hint">
            Kyndra works the same either way — the match below uses what you entered
            whether or not you tick this box. Kyndra is a hackathon project and the
            animals above are <strong>simulated</strong>; this is not an adoption
            application and you are not applying for a real animal.
          </p>
          <p className="intake__hint">
            Ticking the box sends only the household answers above (home type, yard,
            hours away, children, other pets, experience, medication, size limit, and
            your stated preferences) to our team, to evaluate and improve Kyndra's
            matching research. No name is required, and we don't collect anything
            beyond these answers. Assume nothing was sent unless you see a confirmation
            below after submitting — a failed send never stops your match from running.
          </p>
          <label className="check">
            <input
              type="checkbox"
              checked={share}
              onChange={(event) => setShare(event.target.checked)}
            />
            Share this household with the Kyndra team for our research cohort
          </label>
        </fieldset>
      ) : null}

      <button type="submit" className="button button--primary" disabled={isSubmitting}>
        Add household
      </button>

      {status === 'sharing' ? (
        <p className="intake__status" role="status">
          Sharing…
        </p>
      ) : null}
      {status === 'sent' ? (
        <p className="intake__status" role="status">
          Sent — thank you.
        </p>
      ) : null}
      {status === 'shared' ? (
        <p className="intake__status" role="status">
          Shared with the team — thank you.
        </p>
      ) : null}
      {status === 'failed' ? (
        <p className="intake__status intake__status--failed" role="status">
          We could not reach the team, so this household was not shared. It still went into
          the match below.
        </p>
      ) : null}
    </form>
  );
}
