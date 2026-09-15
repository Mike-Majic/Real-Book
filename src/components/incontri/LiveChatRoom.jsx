import { useEffect, useRef, useState } from 'react';
import { resolveAuthor, formatRelativeDate } from '../social/resolveAuthor';
import './LiveChatRoom.css';

const STORAGE_KEY = 'rb-live-messages';

const SEED_MESSAGES = [
  { id: 'lm-1', autoreId: 6, testo: 'Ciao a tutti! Qualcuno stasera in zona Milano? 😊', data: '2026-09-15T18:10:00.000Z' },
  { id: 'lm-2', autoreId: 11, testo: 'Presente da Torino, che serata tranquilla 🌙', data: '2026-09-15T18:12:00.000Z' },
  { id: 'lm-3', autoreId: 17, testo: 'Ciao! Prima volta qui, come funziona la live?', data: '2026-09-15T18:14:00.000Z' },
  { id: 'lm-4', autoreId: 6, testo: 'Basta scrivere, chi c\'è risponde 🙂', data: '2026-09-15T18:15:00.000Z' },
];

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Chat "live" del mondo Incontri: senza backend non può essere davvero
// condivisa tra utenti diversi, quindi segue lo stesso principio già usato
// nel mondo Social (dati finti di partenza + quello che scrivi tu, salvato
// solo nel tuo browser). Include da subito un pulsante di segnalazione per
// ogni messaggio: è la base minima di moderazione richiesta prima di
// costruire qualunque contenuto per adulti in questa sezione.
export default function LiveChatRoom({ user, onOpenAuth }) {
  const [messages, setMessages] = useState(() => loadStored(STORAGE_KEY, SEED_MESSAGES));
  const [draft, setDraft] = useState('');
  const [reportedIds, setReportedIds] = useState(() => new Set());
  const listRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: `lm-${Date.now()}`, autoreId: 'me', testo: text, data: new Date().toISOString() }]);
    setDraft('');
  };

  const report = (id) => {
    setReportedIds((prev) => new Set(prev).add(id));
  };

  return (
    <div className="rb-live-chat">
      <div className="rb-live-chat-notice">🔞 Sezione 18+ · rispetta le regole della community, i messaggi segnalati vengono esaminati</div>

      <div className="rb-live-chat-messages" ref={listRef}>
        {messages.map((m) => {
          const author = resolveAuthor(m.autoreId, user);
          const isMe = m.autoreId === 'me';
          return (
            <div key={m.id} className={`rb-live-msg ${isMe ? 'rb-live-msg-me' : ''}`}>
              <img className="rb-live-msg-avatar" src={author.avatar} alt="" />
              <div className="rb-live-msg-body">
                <div className="rb-live-msg-head">
                  <span className="rb-live-msg-name">{author.name}</span>
                  <span className="rb-live-msg-date">{formatRelativeDate(m.data)}</span>
                </div>
                <p className="rb-live-msg-text">{m.testo}</p>
                {!isMe && (
                  <button
                    type="button"
                    className="rb-live-msg-report"
                    onClick={() => report(m.id)}
                    disabled={reportedIds.has(m.id)}
                  >
                    {reportedIds.has(m.id) ? 'Segnalato ✓' : 'Segnala'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <form className="rb-live-chat-form" onSubmit={send}>
        <input
          type="text"
          placeholder={user ? 'Scrivi un messaggio...' : 'Accedi per scrivere...'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="rb-live-chat-send">Invia</button>
      </form>
    </div>
  );
}
