// ApplicantIntake — answers: "What does this household look like?" (Architecture §8).
//
// P0-2. Opens with the specific-animal question, because a real human choice
// must never be overridden by a derived score — and because asking it first is
// what makes the two preference sides genuinely independent (Architecture §6).
//
// Nobody hand-ranks a list. Everything below the first question is a household
// fact or a stated want; the engine derives both orders from them.

import { useEffect, useState } from 'react';
import type { Animal, Applicant } from '../engine';
import {
  isSurveyCaptureEnabled,
  submitSurveyResponse,
  type ShareStatus,
} from '../data/surveyCapture';

type Level = 1 | 2 | 3 | 4 | 5;
const LEVELS: Level[] = [1, 2, 3, 4, 5];

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

      {/* The question that comes first, on purpose. */}
      <fieldset className="intake__specific">
        <legend>Is there a specific animal you are here for?</legend>
        <p className="intake__hint">
          If so, they become this household&rsquo;s first choice outright. No derived
          score can move them.
        </p>
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
      </fieldset>

      <div className="intake__grid">
        <label>
          Household name
          <input
            type="text"
            value={form.name}
            placeholder={`Household ${nextId}`}
            onChange={(event) => set('name', event.target.value)}
          />
        </label>

        <label>
          Home type
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

        <label>
          Hours away per day (0–14)
          <input
            type="number"
            min={0}
            max={14}
            value={form.hoursAwayPerDay}
            onChange={(event) => set('hoursAwayPerDay', Number(event.target.value))}
          />
        </label>

        <label>
          Largest animal you can take (kg)
          <input
            type="number"
            min={1}
            max={70}
            value={form.maxSizeKg}
            onChange={(event) => set('maxSizeKg', Number(event.target.value))}
          />
        </label>

        <label>
          Experience with animals
          <select
            value={form.experience}
            onChange={(event) => set('experience', Number(event.target.value) as Level)}
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level} — {['none', 'a little', 'some', 'a lot', 'extensive'][level - 1]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Species you want
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

        <label>
          Age you want
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

        <label>
          Energy level you want
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
                {level}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="intake__checks">
        {(
          [
            ['hasYard', 'We have a yard'],
            ['hasChildren', 'There are children in the home'],
            ['hasOtherPets', 'We already have pets'],
            ['canDoDailyMeds', 'We can give daily medication'],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="check">
            <input
              type="checkbox"
              checked={form[key]}
              onChange={(event) => set(key, event.target.checked)}
            />
            {label}
          </label>
        ))}
      </div>

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

      <button type="submit" className="button" disabled={isSubmitting}>
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
