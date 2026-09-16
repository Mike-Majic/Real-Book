import { useState } from 'react';
import { SOCIAL_CATEGORIES, resolveCategoryQuery } from '../../data/socialCategories';
import SocialFeed from './SocialFeed';
import '../ArteExplorer.css';

// Guscio di navigazione del mondo Social: stesso pattern di ArteExplorer/
// IncontriLiveExplorer (X + ricerca in alto, chiuso finché non si sceglie
// la categoria), qui c'è solo "World" quindi il triangolo/pulsante apre
// direttamente il feed esistente — prima si vedeva sempre, ora si apre
// come negli altri mondi.
export default function SocialWorldExplorer({ world, activeCategory, onToggleCategory, onSearchCategory, ...feedProps }) {
  const [query, setQuery] = useState('');
  const [invalid, setInvalid] = useState(false);
  const category = SOCIAL_CATEGORIES.find((c) => c.id === activeCategory) ?? null;

  const submitSearch = (e) => {
    e.preventDefault();
    const found = resolveCategoryQuery(query);
    if (found) {
      setInvalid(false);
      onSearchCategory(found);
      setQuery('');
    } else {
      setInvalid(true);
    }
  };

  return (
    <div className="rb-arte-explorer" style={{ '--accent': world.color }}>
      {category && (
        <>
          <div className="rb-arte-top-controls">
            <button
              type="button"
              className="rb-arte-close-all-btn"
              onClick={() => onToggleCategory(null)}
              aria-label="Chiudi il feed"
              title="Chiudi il feed"
            >
              ✕
            </button>

            <form className="rb-arte-category-search" onSubmit={submitSearch}>
              <input
                type="text"
                placeholder="Cerca (es. world)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setInvalid(false);
                }}
                className={invalid ? 'invalid' : ''}
              />
            </form>
          </div>

          <SocialFeed world={world} {...feedProps} />
        </>
      )}
    </div>
  );
}
