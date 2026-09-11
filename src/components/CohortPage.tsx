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
    if (filter === 'long') return animal.daysInShelter >= 180;
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
            const longStay = animal.daysInShelter >= 180;
            return (
              <button
                key={animal.id}
                type="button"
                className="companion-card"
                onClick={() => setSelected(animal)}
              >
                <div className="card-image-wrapper" style={{ display: 'grid', placeItems: 'center' }}>
                  <AnimalAvatar id={animal.id} name={animal.name} />
                </div>
                <div className="card-content">
                  <div className="card-header">
                    <h3 className="pet-name">{animal.name}</h3>
                  </div>
                  <span className={`status-tag${longStay ? ' long' : ''}`}>
                    {longStay ? `${animal.daysInShelter} days · Long-stay` : `${animal.daysInShelter} days waiting`}
                  </span>
                </div>
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
            <p style={{ color: 'var(--ink-soft)', marginTop: '10px' }}>
              {selected.species === 'dog' ? 'Dog' : 'Cat'} · {selected.ageYears}{' '}
              {selected.ageYears === 1 ? 'year' : 'years'} · {selected.sizeKg}kg ·{' '}
              {selected.daysInShelter} days in shelter
            </p>
            <div className="reason">
              <b>Match requirements</b>
              {requirements(selected).length === 0
                ? 'No special requirements — Kyndra still checks every household against the standard hard constraints.'
                : requirements(selected).join(' · ')}
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
