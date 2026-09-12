// AnimalIntake — the missing half of P0-1.
//
// `ApplicantIntake` has existed since P0, so a visitor could always add a
// household. Nothing could ever add an ANIMAL, which meant the only cohort
// anyone could actually explore was the committed one. For a tester trying to
// see whether the engine does what it claims, that is the more interesting
// half: the constraints are properties of the animal, so an animal is what you
// change to make a placement fail.
//
// ─── EVERY FIELD HERE IS ONE THE ENGINE READS ──────────────────────────────
//
// The order below follows engine/constraints.ts rather than the Animal type,
// so the form reads as "what will eliminate a household for this animal" —
// which is what a tester is actually reasoning about. Fields the engine never
// reads (photo) are not asked for.
//
// ─── WHAT THIS DELIBERATELY DOES NOT DO ────────────────────────────────────
//
// It does not touch cohort.ts and it does not persist. Added animals live in
// React state for the session and vanish on reload, exactly like added
// households — `data/surveyCapture.ts` sets out why: the property tests prove
// things about the COMMITTED cohort, and a cohort mutated at runtime by
// whoever opened the URL is untested by construction. "Reset to preset cohort"
// is always one click away, and the demo path never depends on this form.

import { useState } from 'react';
import type { Animal } from '../engine';

type Level = 1 | 2 | 3 | 4 | 5;
const LEVELS: Level[] = [1, 2, 3, 4, 5];

function blankAnimal(id: string): Animal {
  return {
    id,
    name: '',
    photo: '',
    species: 'dog',
    ageYears: 3,
    sizeKg: 15,
    energy: 3,
    behaviouralDifficulty: 2,
    okWithChildren: true,
    okWithOtherPets: true,
    needsYard: false,
    needsQuietHome: false,
    dailyMedication: false,
    specialNeeds: [],
    daysInShelter: 30,
  };
}

export function AnimalIntake({
  nextId,
  onSubmit,
}: {
  nextId: string;
  onSubmit: (animal: Animal) => void;
}) {
  const [form, setForm] = useState<Animal>(() => blankAnimal(nextId));

  /**
   * "Days in shelter" keeps its own draft text so it can be EMPTY while you
   * type in it.
   *
   * It used to be `Number(event.target.value)` straight into state, and
   * `Number('')` is 0 — so the instant the field was cleared, React wrote a
   * literal 0 back into the box and everything typed next landed beside it.
   * That is where "0200" came from. The model is only updated from a value
   * that actually parses; blur restores whatever the model really holds, so
   * an abandoned empty field falls back rather than reading zero.
   */
  const [days, setDays] = useState(String(blankAnimal(nextId).daysInShelter));
  const [needs, setNeeds] = useState('');

  const set = <K extends keyof Animal>(key: K, value: Animal[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim() === '' ? `Animal ${nextId}` : form.name.trim();

    onSubmit({
      ...form,
      id: nextId,
      name,
      // Comma-separated, because a tester wants to type "arthritis, deaf" and
      // not fight a tag widget. Empty entries dropped so a trailing comma does
      // not become a blank requirement on the card.
      specialNeeds: needs
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry !== ''),
    });

    setForm(blankAnimal(nextId));
    // The draft outlives the form otherwise, and the next animal would open
    // with the previous one's typed value still in the box.
    setDays(String(blankAnimal(nextId).daysInShelter));
    setNeeds('');
  };

  return (
    <form className="intake" onSubmit={submit}>
      <h2 className="section__title">Add an animal</h2>
      <p className="intake__hint">
        Every field below is one the engine reads. The four compatibility flags and
        the three requirements are what eliminate a household outright; age, size and
        days in shelter feed the two preference orders and the equity dial.
      </p>

      <div className="intake__grid">
        <label>
          Name
          <input
            type="text"
            value={form.name}
            placeholder={`Animal ${nextId}`}
            onChange={(event) => set('name', event.target.value)}
          />
        </label>

        <label>
          Species
          <select
            value={form.species}
            onChange={(event) => set('species', event.target.value === 'cat' ? 'cat' : 'dog')}
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
          </select>
        </label>

        <label>
          Age (years)
          <input
            type="number"
            min={0}
            max={25}
            value={form.ageYears}
            onChange={(event) => set('ageYears', Number(event.target.value))}
          />
        </label>

        <label>
          Size (kg)
          <input
            type="number"
            min={1}
            max={80}
            value={form.sizeKg}
            onChange={(event) => set('sizeKg', Number(event.target.value))}
          />
        </label>

        <label>
          Energy level
          <select
            value={form.energy}
            onChange={(event) => set('energy', Number(event.target.value) as Level)}
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
                {level === 5 ? ' — needs constant activity' : level === 1 ? ' — very calm' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Behavioural difficulty
          <select
            value={form.behaviouralDifficulty}
            onChange={(event) =>
              set('behaviouralDifficulty', Number(event.target.value) as Level)
            }
          >
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
                {level === 5 ? ' — experienced adopter only' : level === 1 ? ' — easy' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Days in shelter
          <input
            type="number"
            min={0}
            max={2000}
            value={days}
            onChange={(event) => {
              const raw = event.target.value;
              setDays(raw);
              if (raw.trim() === '') return; // mid-edit; keep the last good value
              const parsed = Number(raw);
              if (Number.isFinite(parsed)) set('daysInShelter', Math.min(2000, Math.max(0, parsed)));
            }}
            onBlur={() => setDays(String(form.daysInShelter))}
          />
        </label>

        <label>
          Ongoing needs (comma separated)
          <input
            type="text"
            value={needs}
            placeholder="e.g. arthritis medication, twice daily"
            onChange={(event) => setNeeds(event.target.value)}
          />
        </label>
      </div>

      {/* Phrased as the animal's requirements, in the order constraints.ts
          evaluates them, because that is the order the "why not?" panel will
          report a failure in. */}
      <fieldset className="intake__checks">
        <legend>What this animal needs from a home</legend>

        <label className="check">
          <input
            type="checkbox"
            checked={!form.okWithChildren}
            onChange={(event) => set('okWithChildren', !event.target.checked)}
          />
          Not safe with children
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={!form.okWithOtherPets}
            onChange={(event) => set('okWithOtherPets', !event.target.checked)}
          />
          Not safe with other pets
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.needsYard}
            onChange={(event) => set('needsYard', event.target.checked)}
          />
          Needs a yard
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.needsQuietHome}
            onChange={(event) => set('needsQuietHome', event.target.checked)}
          />
          Needs a quiet home (no children, no other pets)
        </label>

        <label className="check">
          <input
            type="checkbox"
            checked={form.dailyMedication}
            onChange={(event) => set('dailyMedication', event.target.checked)}
          />
          Needs daily medication
        </label>
      </fieldset>

      <button type="submit" className="button button--primary">
        Add to this cohort
      </button>
    </form>
  );
}
