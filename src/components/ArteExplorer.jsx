import { useMemo, useState } from 'react';
import { ARTE_CATEGORIES, FEATURED_SEARCHES, CATEGORY_RESULTS } from '../data/arteCategories';
import './ArteExplorer.css';

export default function ArteExplorer({ world }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [query, setQuery] = useState('');

  const category = ARTE_CATEGORIES.find((c) => c.id === activeCategory) ?? null;

  const results = useMemo(() => {
    if (!category) return [];
    const all = CATEGORY_RESULTS[category.id] ?? [];
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter((r) => r.title.toLowerCase().includes(q) || r.creator.toLowerCase().includes(q));
  }, [category, query]);

  const selectCategory = (id) => {
    if (id === activeCategory) {
      setActiveCategory(null);
      setQuery('');
    } else {
      setActiveCategory(id);
      setQuery('');
    }
  };

  return (
    <div className="rb-arte-explorer" style={{ '--accent': world.color }}>
      <nav className="rb-arte-category-bar" aria-label="Categorie">
        {ARTE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`rb-arte-category-btn ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => selectCategory(c.id)}
          >
            <span aria-hidden="true">{c.icon}</span> {c.label}
          </button>
        ))}
      </nav>

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
                  <button className="rb-arte-featured-chip" onClick={() => setQuery(term)}>
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <aside className="rb-arte-panel rb-arte-panel-right">
            <div className="rb-arte-panel-header">
              <h3>{category.label}</h3>
              <button className="rb-arte-close-btn" onClick={() => selectCategory(category.id)} aria-label="Chiudi">✕</button>
            </div>
            <input
              type="text"
              className="rb-arte-search-input"
              placeholder={`Cerca in ${category.label}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <ul className="rb-arte-results-list">
              {results.length === 0 && <li className="rb-arte-no-results">Nessun risultato per "{query}".</li>}
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
