import { JOB_CATEGORIES } from '../data/worlds';
import { CONTINENTS, REGIONS } from '../data/geo';
import { ARTE_CATEGORIES } from '../data/arteCategories';
import './SettingsPanel.css';

export default function SettingsPanel({
  open,
  onClose,
  onApply,
  filters,
  setFilters,
  jobFilters,
  setJobFilters,
  locationFilters,
  setLocationFilters,
  arteFilter,
  setArteFilter,
  visibility,
  setVisibility,
  onResetFilters,
}) {
  if (!open) return null;

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const updateJobFilter = (key, value) => setJobFilters((f) => ({ ...f, [key]: value }));
  const updateLocation = (key, value) => setLocationFilters((f) => ({ ...f, [key]: value }));
  const selectedArteCategory = ARTE_CATEGORIES.find((c) => c.id === arteFilter.category) ?? null;

  return (
    <div className="rb-settings-overlay" onClick={onClose}>
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
          <p className="rb-settings-hint">Filtro di posizione, valido per tutti i mondi.</p>

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
          <h3>Personalizza il tuo Real Book</h3>
          <p className="rb-settings-hint">Filtri per i mondi Social e Incontri — tutto gratuito, nessuna funzione a pagamento.</p>

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

        <section className="rb-settings-section">
          <h3>Lavoro</h3>
          <p className="rb-settings-hint">Filtro aggiuntivo per il mondo Lavoro.</p>

          <label className="rb-field">
            <span>Tipologia di lavoro</span>
            <select
              value={jobFilters.category}
              onChange={(e) => updateJobFilter('category', e.target.value)}
            >
              <option value="">Tutte le categorie</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
        </section>

        <p className="rb-settings-footnote">I filtri sono salvati solo su questo dispositivo, per ora. In arrivo: account veri e ricerca in tempo reale.</p>
      </aside>
    </div>
  );
}
