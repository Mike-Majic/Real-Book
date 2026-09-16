import { useState } from 'react';
import { resolveAuthor, formatRelativeDate } from './social/resolveAuthor';
import './FriendChatModal.css';

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Messaggi privati con un amico (aperto dal bottone "Messaggio" nella lista
// dei mi piace di un evento). Senza backend la conversazione vive solo in
// questo browser, come le altre chat dell'app (Live-chat, Match): una per
// amico, salvata con la sua stessa chiave.
export default function FriendChatModal({ friendId, user, onClose }) {
  const storageKey = `rb-friend-chat-${friendId}`;
  const [messages, setMessages] = useState(() => loadStored(storageKey, []));
  const [draft, setDraft] = useState('');
  const friend = resolveAuthor(friendId, user);

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const next = [...messages, { id: `fm-${Date.now()}`, autoreId: 'me', testo: text, data: new Date().toISOString() }];
    setMessages(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setDraft('');
  };

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-friend-chat-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <div className="rb-friend-chat-header">
          <img src={friend.avatar} alt="" />
          <strong>{friend.name}</strong>
        </div>

        <ul className="rb-friend-chat-messages">
          {messages.length === 0 && <p className="rb-friend-chat-empty">Nessun messaggio ancora, scrivi il primo!</p>}
          {messages.map((m) => (
            <li key={m.id} className={`rb-friend-chat-msg ${m.autoreId === 'me' ? 'me' : ''}`}>
              <span>{m.testo}</span>
              <span className="rb-friend-chat-date">{formatRelativeDate(m.data)}</span>
            </li>
          ))}
        </ul>

        <form className="rb-friend-chat-form" onSubmit={send}>
          <input type="text" placeholder="Scrivi un messaggio..." value={draft} onChange={(e) => setDraft(e.target.value)} />
          <button type="submit">Invia</button>
        </form>
      </div>
    </div>
  );
}
