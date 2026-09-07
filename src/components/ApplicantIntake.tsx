// ApplicantIntake — answers: "What does this household look like?" (Architecture §8).
//
// P0-2. Opens with the specific-animal question, because a real human choice
// must never be overridden by a derived score — and because asking it first is
// what makes the two preference sides genuinely independent (Architecture §6).
//
// Nobody hand-ranks a list. Everything below the first question is a household
// fact or a stated want; the engine derives both orders from them.

import { useState } from 'react';
import type { Animal, Applicant } from '../engine';

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

  const set = <K extends keyof Applicant>(key: K, value: Applicant[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = form.name.trim() === '' ? `Household ${nextId}` : form.name.trim();
    onSubmit({ ...form, id: nextId, name });
    setForm(blankApplicant(nextId));
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
          Hours away per day
          <input
            type="number"
            min={0}
            max={16}
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

      <button type="submit" className="button">
        Add household
      </button>
    </form>
  );
}
