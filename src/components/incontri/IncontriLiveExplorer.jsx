import { useEffect, useState } from 'react';
import { INCONTRI_CATEGORIES, resolveCategoryQuery } from '../../data/incontriCategories';
import { listActiveLiveSessions, startLiveSession, endLiveSession, subscribeToLiveSessions } from '../../data/liveStreams';
import { supabase } from '../../data/supabaseClient';
import TwoColumnSwitcher from '../layout/TwoColumnSwitcher';
import LiveUsersList from './LiveUsersList';
import LiveChatRoom from './LiveChatRoom';
import MatchColumn from './MatchColumn';
import '../shared/categoryExplorerShell.css';
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
  onOpenChat,
}) {
  const [query, setQuery] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [mobileView, setMobileView] = useState('secondary');
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [liveError, setLiveError] = useState('');
  const category = INCONTRI_CATEGORIES.find((c) => c.id === activeCategory) ?? null;
  const mySession = sessions.find((s) => s.hostId === user?.id) ?? null;

  // Entrando nella Live-chat, su mobile deve aprirsi subito la chat (colonna
  // destra) invece della lista di chi è in diretta: è quello che l'utente
  // è venuto a fare. Si riattiva ogni volta che SI ENTRA nella categoria
  // (non quando si passa manualmente all'altra colonna mentre si è dentro).
  useEffect(() => {
    if (activeCategory === 'live') setMobileView('secondary');
  }, [activeCategory]);

  // Dirette attive del mondo Incontri: caricate entrando nella categoria e
  // tenute aggiornate in tempo reale (qualcuno inizia/termina una diretta).
  const refreshSessions = () => {
    listActiveLiveSessions('incontri').then(setSessions);
  };
  useEffect(() => {
    if (category?.id !== 'live') return undefined;
    refreshSessions();
    const channel = subscribeToLiveSessions('incontri', refreshSessions);
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id]);

  // Se non si è selezionata nessuna diretta (o quella selezionata è
  // finita), si apre da sola la prima disponibile in ordine di spettatori.
  useEffect(() => {
    if (selectedSessionId && sessions.some((s) => s.id === selectedSessionId)) return;
    setSelectedSessionId(sessions[0]?.id ?? null);
  }, [sessions, selectedSessionId]);

  const toggleMyLive = async () => {
    setLiveError('');
    if (mySession) {
      await endLiveSession(mySession.id);
      refreshSessions();
      return;
    }
    const { id, error } = await startLiveSession('incontri');
    if (error) {
      setLiveError(error);
      return;
    }
    refreshSessions();
    setSelectedSessionId(id);
    // Avviare la diretta deve portare subito alla chat (su mobile, dove
    // le due colonne non stanno affiancate): è lì che si vedono i commenti
    // di chi si è unito.
    setMobileView('secondary');
  };

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
            <MatchColumn user={user} onOpenAuth={onOpenAuth} onOpenChat={onOpenChat} />
          ) : (
            <TwoColumnSwitcher
              primary={
                <LiveUsersList
                  sessions={sessions}
                  mySessionId={mySession?.id ?? null}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={setSelectedSessionId}
                  user={user}
                  onOpenAuth={onOpenAuth}
                  onToggleMyLive={toggleMyLive}
                  error={liveError}
                />
              }
              secondary={
                <div className="rb-live-chat-col">
                  <h3 className="rb-live-chat-title">Live-chat</h3>
                  <LiveChatRoom sessionId={selectedSessionId} user={user} onOpenAuth={onOpenAuth} />
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
