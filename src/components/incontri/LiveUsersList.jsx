import { useEffect, useState } from 'react';
import { getLiveNowUsers } from '../../data/liveStreams';
import './LiveUsersList.css';

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Colonna sinistra della Live-chat: chi è in diretta ora, in ordine di
// spettatori, più il pulsante per avviare la propria diretta. Senza backend
// "avviare una diretta" vuol dire comparire in questa lista (per chi usa
// questo stesso browser): non c'è uno streaming video reale, solo lo stato
// salvato come il resto dell'app.
export default function LiveUsersList({ user, onOpenAuth, onStartLive }) {
  const [myLiveActive, setMyLiveActive] = useState(() => loadStored('rb-my-live-active', false));
  const [myViewCount] = useState(() => loadStored('rb-my-live-views', Math.floor(Math.random() * 220) + 30));

  useEffect(() => localStorage.setItem('rb-my-live-active', JSON.stringify(myLiveActive)), [myLiveActive]);
  useEffect(() => localStorage.setItem('rb-my-live-views', JSON.stringify(myViewCount)), [myViewCount]);

  const toggleMyLive = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    setMyLiveActive((v) => {
      const next = !v;
      // Avviare la diretta deve portare subito alla chat (su mobile, dove
      // le due colonne non stanno affiancate): è lì che si vedono i
      // commenti di chi si è unito.
      if (next) onStartLive?.();
      return next;
    });
  };

  const entries = [
    ...(myLiveActive
      ? [{ id: 'me', name: user?.name ?? 'Tu', avatar: user?.avatar ?? '', city: null, viewCount: myViewCount, isMe: true }]
      : []),
    ...getLiveNowUsers(),
  ].sort((a, b) => b.viewCount - a.viewCount);

  return (
    <div className="rb-live-users-list">
      <button type="button" className={`rb-live-start-btn ${myLiveActive ? 'active' : ''}`} onClick={toggleMyLive}>
        {myLiveActive ? '⏹ Termina la tua live' : '🔴 Avvia una live'}
      </button>
      <p className="rb-live-users-hint">In diretta ora, per numero di spettatori</p>

      <ul className="rb-live-users-ul">
        {entries.map((u) => (
          <li key={u.id} className={`rb-live-user-item ${u.isMe ? 'me' : ''}`}>
            <span className="rb-live-user-dot" aria-hidden="true" />
            <img className="rb-live-user-avatar" src={u.avatar} alt="" />
            <div className="rb-live-user-info">
              <strong>{u.isMe ? `${u.name} (tu)` : u.name}</strong>
              {!u.isMe && u.city && <span className="rb-live-user-city">{u.city}</span>}
            </div>
            <span className="rb-live-user-views">👁 {u.viewCount.toLocaleString('it-IT')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
