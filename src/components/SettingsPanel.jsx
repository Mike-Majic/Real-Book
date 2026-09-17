import { useState } from 'react';
import { CONTINENTS, REGIONS } from '../data/geo';
import { ARTE_CATEGORIES } from '../data/arteCategories';
import ModalOverlay from './ModalOverlay';
import './SettingsPanel.css';

// Vista "Filtri avanzati": una seconda schermata dentro lo stesso pannello,
// raggiunta con un pulsante e richiusa con "Indietro" verso le Impostazioni
// principali. Oggi ospita solo la scorciatoia a una categoria di Arte &
// Musica, ma è pensata per accogliere altri filtri via via che si
// aggiungono, senza affollare la schermata principale.
function AdvancedFiltersView({ onBack, arteFilter, setArteFilter }) {
  const selectedArteCategory = ARTE_CATEGORIES.find((c) => c.id === arteFilter.category) ?? null;

  return (
    <>
      <div className="rb-settings-header">
        <button type="button" className="rb-settings-back-btn" onClick={onBack}>
          ← Impostazioni
        </button>
      </div>
      <h2 className="rb-settings-subtitle">Filtri avanzati</h2>

      <section className="rb-settings-section rb-settings-section-first">
        <h3>Arte & Musica</h3>
        <p className="rb-settings-hint">Vai dritto a una categoria (ed eventualmente a una sottofamiglia) del mondo Arte & Musica.</p>

        <label className="rb-field">
          <span>Categoria</span>
          <select
            value={arteFilter.category}
            onChange={(e) => setArteFilter({ category: e.target.value, subfamily: '' })}
          >
            <option value="">Nessuna categoria</option>
            {ARTE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        {selectedArteCategory && (
          <label className="rb-field">
            <span>Sottofamiglia</span>
            <select
              value={arteFilter.subfamily}
              onChange={(e) => setArteFilter({ category: arteFilter.category, subfamily: e.target.value })}
            >
              <option value="">Tutte</option>
              {selectedArteCategory.subfamilies.map((sf) => (
                <option key={sf} value={sf}>{sf}</option>
              ))}
            </select>
          </label>
        )}
      </section>

      <p className="rb-settings-footnote">Altri filtri avanzati arriveranno qui, senza affollare le Impostazioni principali.</p>
    </>
  );
}

export default function SettingsPanel({
  open,
  onClose,
  onApply,
  user,
  onOpenAuth,
  filters,
  setFilters,
  locationFilters,
  setLocationFilters,
  arteFilter,
  setArteFilter,
  visibility,
  setVisibility,
  onResetFilters,
}) {
  const [view, setView] = useState('main');

  if (!open) return null;

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const updateLocation = (key, value) => setLocationFilters((f) => ({ ...f, [key]: value }));

  if (view === 'advanced') {
    return (
      <ModalOverlay onClose={onClose} className="rb-settings-overlay">
        <aside className="rb-settings-panel" onClick={(e) => e.stopPropagation()}>
          <AdvancedFiltersView onBack={() => setView('main')} arteFilter={arteFilter} setArteFilter={setArteFilter} />
        </aside>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClose={onClose} className="rb-settings-overlay">
      <aside className="rb-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rb-settings-header">
          <h2>Impostazioni</h2>
          <button className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        <div className="rb-filter-actions">
          <button type="button" className="rb-reset-filters-btn" onClick={onResetFilters}>
            Azzera tutti i filtri
          </button>
          <button type="button" className="rb-apply-filters-btn" onClick={onApply ?? onClose}>
            Applica
          </button>
        </div>

        <section className="rb-settings-section">
          <h3>Dove</h3>
          <p className="rb-settings-hint">Continente, regione e città: valido per tutti i mondi.</p>

          <label className="rb-field">
            <span>Continente</span>
            <select value={locationFilters.continent} onChange={(e) => updateLocation('continent', e.target.value)}>
              <option value="">Tutti i continenti</option>
              {CONTINENTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="rb-field">
            <span>Regione</span>
            <select value={locationFilters.region} onChange={(e) => updateLocation('region', e.target.value)}>
              <option value="">Tutte le regioni</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="rb-field">
            <span>Città</span>
            <input
              type="text"
              placeholder="Es. Roma"
              value={locationFilters.city}
              onChange={(e) => updateLocation('city', e.target.value)}
            />
          </label>

          <label className="rb-field">
            <span>Distanza: {locationFilters.distance} km</span>
            <input type="range" min={1} max={500} value={locationFilters.distance}
              onChange={(e) => updateLocation('distance', Number(e.target.value))} />
          </label>
        </section>

        <section className="rb-settings-section">
          <h3>Personalizza il tuo Versemove</h3>
          <p className="rb-settings-hint">Genere ed età: valido per tutti i mondi — tutto gratuito, nessuna funzione a pagamento.</p>

          <label className="rb-field">
            <span>Mostrami</span>
            <div className="rb-chip-group">
              {['Tutti', 'Uomo', 'Donna'].map((opt) => (
                <button
                  key={opt}
                  className={`rb-chip ${filters.gender === opt ? 'active' : ''}`}
                  onClick={() => updateFilter('gender', opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </label>

          <label className="rb-field">
            <span>Età: {filters.ageMin}–{filters.ageMax}</span>
            <div className="rb-range-row">
              <input type="range" min={18} max={80} value={filters.ageMin}
                onChange={(e) => updateFilter('ageMin', Math.min(Number(e.target.value), filters.ageMax))} />
              <input type="range" min={18} max={80} value={filters.ageMax}
                onChange={(e) => updateFilter('ageMax', Math.max(Number(e.target.value), filters.ageMin))} />
            </div>
          </label>

          <label className="rb-toggle-row">
            <span className="rb-toggle-text">
              <strong>Visibile agli altri utenti vicino a te</strong>
              <p>Se attivo, chi ti è vicino può vedere nella colonna "Persone vicine" che hai messo mi piace o parteciperò a un contenuto. Mai la posizione esatta, solo la città. Di default è spento.</p>
            </span>
            <span className="rb-toggle">
              <input
                type="checkbox"
                checked={visibility.nearbyVisible}
                onChange={(e) => setVisibility((v) => ({ ...v, nearbyVisible: e.target.checked }))}
              />
              <span className="rb-toggle-slider" />
            </span>
          </label>
        </section>

        <section className="rb-settings-section">
          <h3>Posizione in tempo reale</h3>
          <p className="rb-settings-hint">
            {user
              ? 'Se attivo, il pallino sul tuo marker nel mondo diventa verde e segue la tua posizione reale, aggiornata in tempo reale. Se spento, il pallino resta quello standard e nessuna posizione viene condivisa o richiesta al browser.'
              : 'Accedi per poter condividere la tua posizione in tempo reale.'}
          </p>

          <label className="rb-toggle-row">
            <span className="rb-toggle-text">
              <strong>Condividi la mia posizione in tempo reale</strong>
            </span>
            <span className="rb-toggle">
              <input
                type="checkbox"
                checked={visibility.shareLiveLocation}
                disabled={!user}
                onChange={(e) => {
                  if (!user) {
                    onOpenAuth?.();
                    return;
                  }
                  setVisibility((v) => ({ ...v, shareLiveLocation: e.target.checked }));
                }}
              />
              <span className="rb-toggle-slider" />
            </span>
          </label>
        </section>

        <section className="rb-settings-section">
          <button type="button" className="rb-settings-nav-btn" onClick={() => setView('advanced')}>
            <span>
              <strong>Filtri avanzati</strong>
              <p>Categorie specifiche di un mondo e altri filtri in arrivo.</p>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <p className="rb-settings-footnote">I filtri sono salvati solo su questo dispositivo, per ora. In arrivo: account veri e ricerca in tempo reale.</p>
      </aside>
    </ModalOverlay>
  );
}
