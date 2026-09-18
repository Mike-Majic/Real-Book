import './LiveUsersList.css';

// Colonna sinistra della Live-chat: chi è in diretta ora (sessioni reali,
// tabella live_sessions), in ordine di spettatori, più il pulsante per
// avviare/terminare la propria diretta. Cliccare una riga ne apre la chat
// (colonna destra) — vedi IncontriLiveExplorer, che tiene lo stato di
// quale sessione è selezionata.
export default function LiveUsersList({ sessions, mySessionId, selectedSessionId, onSelectSession, user, onOpenAuth, onToggleMyLive, error }) {
  const toggleMyLive = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    onToggleMyLive();
  };

  return (
    <div className="rb-live-users-list">
      <button type="button" className={`rb-live-start-btn ${mySessionId ? 'active' : ''}`} onClick={toggleMyLive}>
        {mySessionId ? '⏹ Termina la tua live' : '🔴 Avvia una live'}
      </button>
      <p className="rb-live-users-hint">In diretta ora, per numero di spettatori</p>
      {error && <p className="rb-social-error">⚠️ {error}</p>}

      <ul className="rb-live-users-ul">
        {sessions.length === 0 && <p className="rb-live-users-hint">Nessuna diretta in corso al momento.</p>}
        {sessions.map((s) => {
          const isMe = s.id === mySessionId;
          return (
            <li
              key={s.id}
              className={`rb-live-user-item ${isMe ? 'me' : ''} ${s.id === selectedSessionId ? 'selected' : ''}`}
              onClick={() => onSelectSession(s.id)}
            >
              <span className="rb-live-user-dot" aria-hidden="true" />
              <img className="rb-live-user-avatar" src={s.host.avatar} alt="" />
              <div className="rb-live-user-info">
                <strong>{isMe ? `${s.host.name} (tu)` : s.host.name}</strong>
              </div>
              <span className="rb-live-user-views">👁 {s.viewCount.toLocaleString('it-IT')}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
