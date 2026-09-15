import { useEffect, useMemo, useState } from 'react';
import { FEATURED_SEARCHES, CATEGORY_RESULTS } from '../data/arteCategories';
import './CategoryColumn.css';

// Layout desktop (due colonne affiancate) solo se ENTRAMBE le condizioni sono
// vere: orizzontale E almeno 700px di larghezza. Una tavoletta in verticale,
// o un telefono ruotato ma stretto, restano nel layout mobile.
const DESKTOP_QUERY = '(orientation: landscape) and (min-width: 700px)';

function useIsDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function SwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7l-4 5 4 5" />
      <path d="M16 7l4 5-4 5" />
    </svg>
  );
}

// Componente unico e parametrizzato per esplorare una categoria: riceve solo
// l'oggetto categoria (nome, sottofamiglie...) e ricava da lì tema/dati/ricerche.
// Usato per Libreria, Musica, Cinema, Teatro, Arte — nessuna copia per categoria.
// Montare con key={category.id} così lo stato di ricerca/filtro riparte pulito
// ogni volta che cambia la categoria attiva.
//
// Desktop (orizzontale + largo): due colonne affiancate, come prima.
// Mobile (verticale, o stretto anche in orizzontale): una sola colonna a
// piena larghezza (di default i risultati, non le ricerche in evidenza), con
// una maniglia fissa sul bordo destro che scorre per mostrare l'altra colonna.
export default function CategoryColumn({ category, initialSubfamily = '' }) {
  const [resultsQuery, setResultsQuery] = useState('');
  const [subfamilyFilter, setSubfamilyFilter] = useState(initialSubfamily);
  const [mobileView, setMobileView] = useState('results'); // 'results' | 'featured'
  const isDesktop = useIsDesktopLayout();

  const allResults = CATEGORY_RESULTS[category.id] ?? [];
  const featured = FEATURED_SEARCHES[category.id] ?? [];

  const results = useMemo(() => {
    return allResults.filter((r) => {
      if (subfamilyFilter && r.subfamily !== subfamilyFilter) return false;
      if (!resultsQuery.trim()) return true;
      const q = resultsQuery.trim().toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.creator.toLowerCase().includes(q) ||
        r.subfamily.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allResults, resultsQuery, subfamilyFilter]);

  const featuredContent = (
    <>
      {!isDesktop && (
        <button className="rb-arte-mobile-back" onClick={() => setMobileView('results')}>
          ← Torna a {category.label}
        </button>
      )}
      <div className="rb-arte-panel-header">
        <h3>Ricerche in evidenza</h3>
        <p>Cosa cerca la community in {category.label}</p>
      </div>
      <ul className="rb-arte-featured-list">
        {featured.map((term) => (
          <li key={term}>
            <button
              className="rb-arte-featured-chip"
              onClick={() => {
                setResultsQuery(term);
                if (!isDesktop) setMobileView('results');
              }}
            >
              {term}
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  const resultsContent = (
    <>
      <div className="rb-arte-panel-header">
        <h3>{category.label}</h3>
      </div>

      <input
        type="text"
        className="rb-arte-search-input"
        placeholder={`Cerca in ${category.label}...`}
        value={resultsQuery}
        onChange={(e) => setResultsQuery(e.target.value)}
      />

      <div className="rb-arte-subfamily-row">
        <button
          className={`rb-arte-subfamily-chip ${subfamilyFilter === '' ? 'active' : ''}`}
          onClick={() => setSubfamilyFilter('')}
        >
          Tutti
        </button>
        {category.subfamilies.map((sf) => (
          <button
            key={sf}
            className={`rb-arte-subfamily-chip ${subfamilyFilter === sf ? 'active' : ''}`}
            onClick={() => setSubfamilyFilter(subfamilyFilter === sf ? '' : sf)}
          >
            {sf}
          </button>
        ))}
      </div>

      <ul className="rb-arte-results-list">
        {results.length === 0 && <li className="rb-arte-no-results">Nessun risultato.</li>}
        {results.map((r) => (
          <li key={r.id} className="rb-arte-result-card">
            <div className="rb-arte-result-thumb" />
            <div>
              <strong>{r.title}</strong>
              <p>{r.creator}</p>
              <span>{r.subfamily} · {r.year}</span>
              <p className="rb-arte-result-desc">{r.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );

  if (isDesktop) {
    return (
      <>
        <aside className="rb-arte-panel rb-arte-panel-left">{featuredContent}</aside>
        <aside className="rb-arte-panel rb-arte-panel-right">{resultsContent}</aside>
      </>
    );
  }

  return (
    <div className="rb-arte-mobile-stage">
      <div className={`rb-arte-mobile-track ${mobileView === 'featured' ? 'show-featured' : ''}`}>
        <div className="rb-arte-mobile-slide">{resultsContent}</div>
        <div className="rb-arte-mobile-slide">{featuredContent}</div>
      </div>
      <button
        className="rb-arte-edge-handle"
        onClick={() => setMobileView((v) => (v === 'results' ? 'featured' : 'results'))}
        aria-label={mobileView === 'results' ? 'Mostra ricerche in evidenza' : `Torna a ${category.label}`}
        title={mobileView === 'results' ? 'Ricerche in evidenza' : category.label}
      >
        <SwitchIcon />
      </button>
    </div>
  );
}
