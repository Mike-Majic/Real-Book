import { useEffect, useState } from 'react';
import { INCONTRI_CATEGORIES, resolveCategoryQuery } from '../../data/incontriCategories';
import TwoColumnSwitcher from '../layout/TwoColumnSwitcher';
import LiveUsersList from './LiveUsersList';
import LiveChatRoom from './LiveChatRoom';
import MatchColumn from './MatchColumn';
import '../ArteExplorer.css';
import './IncontriLiveExplorer.css';

// Guscio di navigazione del mondo Incontri: stesso pattern di ArteExplorer
// (X + ricerca in alto, chiuso finché non si sceglie la categoria), con due
// categorie: "Live-chat" (chi è in diretta + chat) e "Match" (stile Tinder).
export default function IncontriLiveExplorer({
  world,
  activeCategory,
  onToggleCategory,
  onSearchCategory,
  user,
  onOpenAuth,
  candidateUsers = [],
}) {
  const [query, setQuery] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [mobileView, setMobileView] = useState('secondary');
  const category = INCONTRI_CATEGORIES.find((c) => c.id === activeCategory) ?? null;

  // Entrando nella Live-chat, su mobile deve aprirsi subito la chat (colonna
  // destra) invece della lista di chi è in diretta: è quello che l'utente
  // è venuto a fare. Si riattiva ogni volta che SI ENTRA nella categoria
  // (non quando si passa manualmente all'altra colonna mentre si è dentro).
  useEffect(() => {
    if (activeCategory === 'live') setMobileView('secondary');
  }, [activeCategory]);

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
              aria-label="Chiudi le colonne"
              title="Chiudi le colonne"
            >
              ✕
            </button>

            <form className="rb-arte-category-search" onSubmit={submitSearch}>
              <input
                type="text"
                placeholder="Cerca (es. live-chat, match)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setInvalid(false);
                }}
                className={invalid ? 'invalid' : ''}
              />
            </form>
          </div>

          {category.id === 'match' ? (
            <MatchColumn candidateUsers={candidateUsers} user={user} onOpenAuth={onOpenAuth} />
          ) : (
            <TwoColumnSwitcher
              primary={<LiveUsersList user={user} onOpenAuth={onOpenAuth} onStartLive={() => setMobileView('secondary')} />}
              secondary={
                <div className="rb-live-chat-col">
                  <h3 className="rb-live-chat-title">Live-chat</h3>
                  <LiveChatRoom user={user} onOpenAuth={onOpenAuth} />
                </div>
              }
              primaryLabel="In diretta"
              secondaryLabel="Chat"
              mobileView={mobileView}
              onMobileViewChange={setMobileView}
            />
          )}
        </>
      )}
    </div>
  );
}
