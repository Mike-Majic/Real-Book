import { JOB_CATEGORIES } from '../data/worlds';
import './SettingsPanel.css';

export default function SettingsPanel({ open, onClose, filters, setFilters, jobFilters, setJobFilters }) {
  if (!open) return null;

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const updateJobFilter = (key, value) => setJobFilters((f) => ({ ...f, [key]: value }));

  return (
    <div className="rb-settings-overlay" onClick={onClose}>
      <aside className="rb-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rb-settings-header">
          <h2>Impostazioni</h2>
          <button className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

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

          <label className="rb-field">
            <span>Città</span>
            <input
              type="text"
              placeholder="Es. Ardea"
              value={filters.city}
              onChange={(e) => updateFilter('city', e.target.value)}
            />
          </label>

          <label className="rb-field">
            <span>Distanza: {filters.distance} km</span>
            <input type="range" min={1} max={500} value={filters.distance}
              onChange={(e) => updateFilter('distance', Number(e.target.value))} />
          </label>
        </section>

        <section className="rb-settings-section">
          <h3>Lavoro</h3>
          <p className="rb-settings-hint">Filtri per il mondo Lavoro (candidature e ricerca aziende).</p>

          <label className="rb-field">
            <span>Città</span>
            <input
              type="text"
              placeholder="Es. Roma"
              value={jobFilters.city}
              onChange={(e) => updateJobFilter('city', e.target.value)}
            />
          </label>

          <label className="rb-field">
            <span>Distanza: {jobFilters.distance} km</span>
            <input type="range" min={1} max={500} value={jobFilters.distance}
              onChange={(e) => updateJobFilter('distance', Number(e.target.value))} />
          </label>

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
