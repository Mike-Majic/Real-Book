import { useState } from 'react';
import { INCONTRI_CATEGORIES, resolveCategoryQuery } from '../../data/incontriCategories';
import LiveChatRoom from './LiveChatRoom';
import '../ArteExplorer.css';
import './IncontriLiveExplorer.css';

// Guscio di navigazione del mondo Incontri: stesso pattern di ArteExplorer/
// BambiniGameExplorer (X + ricerca in alto, chiuso finché non si sceglie la
// categoria), qui c'è solo "Live" quindi il triangolo/pulsante apre
// direttamente la chat.
export default function IncontriLiveExplorer({ world, activeCategory, onToggleCategory, onSearchCategory, user, onOpenAuth }) {
  const [query, setQuery] = useState('');
  const [invalid, setInvalid] = useState(false);
  const category = INCONTRI_CATEGORIES.find((c) => c.id === activeCategory) ?? null;

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
              aria-label="Chiudi la live"
              title="Chiudi la live"
            >
              ✕
            </button>

            <form className="rb-arte-category-search" onSubmit={submitSearch}>
              <input
                type="text"
                placeholder="Cerca (es. live)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setInvalid(false);
                }}
                className={invalid ? 'invalid' : ''}
              />
            </form>
          </div>

          <div className="rb-live-chat-panel">
            <h3 className="rb-live-chat-title">Live</h3>
            <LiveChatRoom user={user} onOpenAuth={onOpenAuth} />
          </div>
        </>
      )}
    </div>
  );
}
