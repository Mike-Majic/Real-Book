import { useEffect, useMemo, useState } from 'react';
import { ARTE_CATEGORIES, FEATURED_SEARCHES, CATEGORY_RESULTS, resolveCategoryQuery } from '../data/arteCategories';
import './ArteExplorer.css';

export default function ArteExplorer({ world, activeCategory, onToggleCategory, onSearchCategory }) {
  const [resultsQuery, setResultsQuery] = useState('');
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categoryQueryInvalid, setCategoryQueryInvalid] = useState(false);

  const category = ARTE_CATEGORIES.find((c) => c.id === activeCategory) ?? null;

  useEffect(() => setResultsQuery(''), [activeCategory]);

  const results = useMemo(() => {
    if (!category) return [];
    const all = CATEGORY_RESULTS[category.id] ?? [];
    if (!resultsQuery.trim()) return all;
    const q = resultsQuery.trim().toLowerCase();
    return all.filter((r) => r.title.toLowerCase().includes(q) || r.creator.toLowerCase().includes(q));
  }, [category, resultsQuery]);

  const submitCategorySearch = (e) => {
    e.preventDefault();
    const found = resolveCategoryQuery(categoryQuery);
    if (found) {
      setCategoryQueryInvalid(false);
      setResultsQuery('');
      onSearchCategory(found);
      setCategoryQuery('');
    } else {
      setCategoryQueryInvalid(true);
    }
  };

  return (
    <div className="rb-arte-explorer" style={{ '--accent': world.color }}>
      <div className="rb-arte-top-controls">
        <button
          type="button"
          className="rb-arte-close-all-btn"
          onClick={() => onToggleCategory(null)}
          aria-label="Chiudi le colonne"
          title="Chiudi le colonne"
        >
          ✕
        </button>

        <form className="rb-arte-category-search" onSubmit={submitCategorySearch}>
          <input
            type="text"
            placeholder="Cerca una categoria (es. film)..."
            value={categoryQuery}
            onChange={(e) => {
              setCategoryQuery(e.target.value);
              setCategoryQueryInvalid(false);
            }}
            className={categoryQueryInvalid ? 'invalid' : ''}
          />
        </form>
      </div>

      {category && (
        <>
          <aside className="rb-arte-panel rb-arte-panel-left">
            <div className="rb-arte-panel-header">
              <h3>Ricerche in evidenza</h3>
              <p>Cosa cerca la community in {category.label}</p>
            </div>
            <ul className="rb-arte-featured-list">
              {FEATURED_SEARCHES[category.id].map((term) => (
                <li key={term}>
                  <button className="rb-arte-featured-chip" onClick={() => setResultsQuery(term)}>
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <aside className="rb-arte-panel rb-arte-panel-right">
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
            <ul className="rb-arte-results-list">
              {results.length === 0 && <li className="rb-arte-no-results">Nessun risultato per "{resultsQuery}".</li>}
              {results.map((r) => (
                <li key={r.id} className="rb-arte-result-card">
                  <div className="rb-arte-result-thumb" />
                  <div>
                    <strong>{r.title}</strong>
                    <p>{r.creator}</p>
                    <span>{r.meta}</span>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </>
      )}
    </div>
  );
}
