// CohortPage — "Who is waiting?" Ported from Frontend/cohort.html's
// companion-grid + filters + pet-detail modal, wired to the real Cohort
// instead of six hardcoded profiles.
//
// Photos: the real app never renders a hotlinked stock photo of a real
// animal next to a simulated profile — src/data/photoCredits.ts documents
// why (PRD §3.1: imagery must never imply a real animal), and every credit
// there is empty on purpose. So unlike the prototype, every card here shows
// the generated AnimalAvatar, not a photograph. That is the real app's
// policy, not a gap in the port.
//
// ─── REDESIGN PHASE 4 — THE CARD CARRIES THE ANIMAL ────────────────────────
//
// A card used to show a name and one saturated full-width pill reading
// "340 days waiting", in 11px text. Sixteen of them made a wall of identical
// coloured bars, and the thing a coordinator actually needs — what this
// animal requires of a home — was locked inside the modal.
//
// `requirements()` below was already computing exactly that, and rendering it
// only after a click. It is on the card now (§11), capped at three so the
// grid stays scannable, with the rest behind the card's own detail view.
//
// The days-waiting pill is gone as a pill. It is metadata, not an alert, and
// a solid terracotta bar on every card spent the palette's loudest colour on
// the least urgent fact. Long-stay is what deserves to be noticed, so that is
// what carries a marker — in Sunset, the brief's highlight colour, which is
// "visually noticeable but not aggressively highlighted" (§11). It used to be
// the opposite: long waits were olive/green, ordinary waits terracotta/red,
// so green read as "good" on the animals who had waited longest.

import { useState } from 'react';
import type { Animal } from '../engine';
import { AnimalAvatar } from './AnimalAvatar';
import { AnimalIntake } from './AnimalIntake';
import { JourneyTrack } from './JourneyTrack';

type Filter = 'all' | 'dog' | 'cat' | 'long';

/** The requirements a coordinator has to hold in their head for this animal. */
function requirements(animal: Animal): string[] {
  const needs: string[] = [];
  if (!animal.okWithChildren) needs.push('No children');
  if (!animal.okWithOtherPets) needs.push('No other pets');
  if (animal.needsYard) needs.push('Needs a yard');
  if (animal.needsQuietHome) needs.push('Needs a quiet home');
  if (animal.dailyMedication) needs.push('Daily medication');
  if (animal.behaviouralDifficulty >= 4) needs.push('Experienced adopter');
  if (animal.energy >= 4) needs.push('Not alone all day');
  return needs;
}

/** "Dog · 7 years · 41 kg" — the same line the detail view has always shown. */
function descriptor(animal: Animal): string {
  const years = `${animal.ageYears} ${animal.ageYears === 1 ? 'year' : 'years'}`;
  return `${animal.species === 'dog' ? 'Dog' : 'Cat'} · ${years} · ${animal.sizeKg}kg`;
}

/** Long stay is defined once, here — the filter and the card must agree. */
const LONG_STAY_DAYS = 180;

/** How many needs fit on a card before it stops being scannable. */
const CHIPS_ON_CARD = 3;

export function CohortPage({
  animals,
  nextAnimalId,
  onAddAnimal,
  onRemoveAnimal,
  onResetDemo,
  onRunCohort,
}: {
  animals: Animal[];
  nextAnimalId: string;
  onAddAnimal: (animal: Animal) => void;
  onRemoveAnimal: (animalId: string) => void;
  onResetDemo: () => void;
  onRunCohort: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<Animal | null>(null);
  const [showIntake, setShowIntake] = useState(false);

  const visible = animals.filter((animal) => {
    if (filter === 'all') return true;
    if (filter === 'long') return animal.daysInShelter >= LONG_STAY_DAYS;
    return animal.species === filter;
  });

  return (
    <main className="page">
      <section id="companions">
        <JourneyTrack step={2} />
        <div className="demo-banner">
          <span className="demo-banner__badge">Demo mode</span>
          <p>
            This is a realistic, fictional cohort — not a real shelter&rsquo;s data. It exists so
            you can see how Kyndra works before building anything yourself: some pairings here
            are impossible, some animals have several viable households, and one is unmatched no
            matter what. Open any card to see why.
          </p>
        </div>

        <div className="section-head">
          <div>
            <h2>Cohort Demo</h2>
            <p>These are the animals waiting, and the constraints that shape who they can go home with.</p>
          </div>
          <div className="proof">Verified matching rules</div>
        </div>

        <div className="actions" style={{ marginTop: 0, marginBottom: '20px', justifyContent: 'space-between' }}>
          <button type="button" className="primary" onClick={onRunCohort}>
            Run this cohort →
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" className="button button--add-animal" onClick={() => setShowIntake((v) => !v)}>
              {showIntake ? 'Hide animal form' : 'Add an animal (custom)'}
            </button>
            <button type="button" className="button button--ghost" onClick={onResetDemo}>
              Reset demo
            </button>
          </div>
        </div>

        {showIntake ? (
          <AnimalIntake nextId={nextAnimalId} onSubmit={onAddAnimal} />
        ) : null}

        <div className="filters" aria-label="Cohort filters">
          <button
            type="button"
            className={`filter-btn${filter === 'all' ? ' active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-btn${filter === 'dog' ? ' active' : ''}`}
            onClick={() => setFilter('dog')}
          >
            Dogs
          </button>
          <button
            type="button"
            className={`filter-btn${filter === 'cat' ? ' active' : ''}`}
            onClick={() => setFilter('cat')}
          >
            Cats
          </button>
          <button
            type="button"
            className={`filter-btn${filter === 'long' ? ' active' : ''}`}
            onClick={() => setFilter('long')}
          >
            Long-Stay
          </button>
        </div>

        <div className="companion-grid" data-testid="cohort-grid">
          {visible.map((animal) => {
            const longStay = animal.daysInShelter >= LONG_STAY_DAYS;
            const needs = requirements(animal);
            const shown = needs.slice(0, CHIPS_ON_CARD);
            const hidden = needs.length - shown.length;

            return (
              <button
                key={animal.id}
                type="button"
                className="companion-card"
                onClick={() => setSelected(animal)}
              >
                <span className="card-image-wrapper">
                  <AnimalAvatar id={animal.id} name={animal.name} />
                  {longStay ? <span className="longstay-flag">Long stay</span> : null}
                </span>

                <span className="card-content">
                  <span className="pet-name">{animal.name}</span>
                  <span className="pet-meta">{descriptor(animal)}</span>
                  <span className="pet-wait">
                    {animal.daysInShelter} days waiting
                  </span>

                  {needs.length > 0 ? (
                    <span className="need-chips">
                      {shown.map((need) => (
                        <span key={need} className="need-chip">
                          {need}
                        </span>
                      ))}
                      {hidden > 0 ? <span className="need-chip need-chip--more">+{hidden} more</span> : null}
                    </span>
                  ) : (
                    <span className="pet-meta pet-meta--easy">No special requirements</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selected !== null ? (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="close" aria-label="Close" onClick={() => setSelected(null)}>
              ×
            </button>
            <div className="mini-pet">
              <AnimalAvatar id={selected.id} name={selected.name} />
            </div>
            <h2>{selected.name}</h2>
            <p className="pet-meta">
              {descriptor(selected)} · {selected.daysInShelter} days in shelter
            </p>
            <div className="reason">
              <b>What {selected.name} needs from a home</b>
              {requirements(selected).length === 0 ? (
                'Nothing out of the ordinary. Every household is still checked against the same requirements before a match is proposed.'
              ) : (
                <span className="need-chips need-chips--full">
                  {requirements(selected).map((need) => (
                    <span key={need} className="need-chip">
                      {need}
                    </span>
                  ))}
                </span>
              )}
            </div>
            {selected.specialNeeds.length > 0 ? (
              <p className="results__note">{selected.specialNeeds.join('; ')}</p>
            ) : null}
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setSelected(null)}>
                Close
              </button>
              <button
                type="button"
                className="button"
                onClick={() => {
                  onRemoveAnimal(selected.id);
                  setSelected(null);
                }}
              >
                Remove from cohort
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
