import { useEffect, useMemo, useState } from 'react';
import { FEATURED_SEARCHES, CATEGORY_RESULTS } from '../data/arteCategories';
import './CategoryColumn.css';

const MOBILE_BREAKPOINT = 760;

function useIsNarrow(breakpoint) {
  const [narrow, setNarrow] = useState(() => window.innerWidth <= breakpoint);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const handler = (e) => setNarrow(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return narrow;
}

// Componente unico e parametrizzato per esplorare una categoria: riceve solo
// l'oggetto categoria (nome, sottofamiglie...) e ricava da lì tema/dati/ricerche.
// Usato per Libreria, Musica, Cinema, Teatro, Arte — nessuna copia per categoria.
// Montare con key={category.id} così lo stato di ricerca/filtro riparte pulito
// ogni volta che cambia la categoria attiva.
//
// Sotto un certo breakpoint le due colonne non stanno più affiancate: si vede
// una schermata alla volta, con un pulsante per passare dall'una all'altra.
export default function CategoryColumn({ category, initialSubfamily = '' }) {
  const [resultsQuery, setResultsQuery] = useState('');
  const [subfamilyFilter, setSubfamilyFilter] = useState(initialSubfamily);
  const [mobileView, setMobileView] = useState('results');
  const isNarrow = useIsNarrow(MOBILE_BREAKPOINT);

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

  const showFeatured = !isNarrow || mobileView === 'featured';
  const showResults = !isNarrow || mobileView === 'results';

  return (
    <>
      {showFeatured && (
        <aside className="rb-arte-panel rb-arte-panel-left">
          {isNarrow && (
            <button className="rb-arte-mobile-nav" onClick={() => setMobileView('results')}>
              ← Torna ai risultati
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
                    if (isNarrow) setMobileView('results');
                  }}
                >
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}

      {showResults && (
        <aside className="rb-arte-panel rb-arte-panel-right">
          {isNarrow && (
            <button className="rb-arte-mobile-nav" onClick={() => setMobileView('featured')}>
              Ricerche in evidenza →
            </button>
          )}
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
        </aside>
      )}
    </>
  );
}
