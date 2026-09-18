import { useEffect, useRef, useState } from 'react';
import { fetchLiveMessages, sendLiveMessage, subscribeToLiveMessages, recordLiveView } from '../../data/liveStreams';
import { formatRelativeDate } from '../social/resolveAuthor';
import ReportModal from '../shared/ReportModal';
import { supabase } from '../../data/supabaseClient';
import './LiveChatRoom.css';

// Chat di una diretta reale (tabella live_messages, legata a un
// live_sessions.id): niente più di globale/finto, ogni diretta ha la sua
// chat. Senza sessionId (nessuna diretta attiva nel mondo) non c'è nulla da
// mostrare: lo decide chi monta questo componente (vedi IncontriLiveExplorer).
export default function LiveChatRoom({ sessionId, user, onOpenAuth }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [reportingId, setReportingId] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      setMessages([]);
      return undefined;
    }
    fetchLiveMessages(sessionId).then(({ messages: list }) => {
      if (list) setMessages(list);
    });
    if (user) recordLiveView(sessionId);

    const channel = subscribeToLiveMessages(sessionId, (row) => {
      setMessages((prev) => [
        ...prev,
        { id: row.id, autoreId: row.user_id, author: { id: row.user_id, name: 'Utente', avatar: '' }, testo: row.testo, data: row.created_at },
      ]);
      // Il mittente vero (nome/avatar) arriva subito dopo con un refetch
      // leggero: evita di dover risolvere il profilo dentro al canale
      // realtime, che non ha accesso a public_profiles pre-caricato.
      fetchLiveMessages(sessionId).then(({ messages: list }) => {
        if (list) setMessages(list);
      });
    });
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, user?.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    const text = draft.trim();
    if (!text || !sessionId) return;
    setDraft('');
    const { error } = await sendLiveMessage(sessionId, text);
    if (error) setSendError(error);
  };

  if (!sessionId) {
    return (
      <div className="rb-live-chat">
        <p className="rb-live-users-hint">Nessuna diretta attiva ora in questo mondo.</p>
      </div>
    );
  }

  return (
    <div className="rb-live-chat">
      <div className="rb-live-chat-notice">🔞 Sezione 18+ · rispetta le regole della community, i messaggi segnalati vengono esaminati</div>

      {sendError && <p className="rb-social-error">⚠️ {sendError}</p>}

      <div className="rb-live-chat-messages" ref={listRef}>
        {messages.map((m) => {
          const isMe = m.autoreId === user?.id;
          return (
            <div key={m.id} className={`rb-live-msg ${isMe ? 'rb-live-msg-me' : ''}`}>
              <img className="rb-live-msg-avatar" src={m.author.avatar} alt="" />
              <div className="rb-live-msg-body">
                <div className="rb-live-msg-head">
                  <span className="rb-live-msg-name">{isMe ? 'Tu' : m.author.name}</span>
                  <span className="rb-live-msg-date">{formatRelativeDate(m.data)}</span>
                </div>
                <p className="rb-live-msg-text">{m.testo}</p>
                {!isMe && (
                  <button type="button" className="rb-live-msg-report" onClick={() => setReportingId(m.id)}>
                    Segnala
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

      {reportingId && (
        <ReportModal
          targetType="live"
          targetId={reportingId}
          targetLabel="questo messaggio"
          onClose={() => setReportingId(null)}
        />
      )}
    </div>
  );
}
