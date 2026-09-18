import { useEffect, useState } from 'react';
import { formatRelativeDate } from './social/resolveAuthor';
import { fetchProfilesMap } from '../data/posts';
import { startDirectConversation, fetchMessages, sendMessage, markConversationRead } from '../data/directChat';
import ModalOverlay from './ModalOverlay';
import './FriendChatModal.css';

// Messaggi privati con un altro utente reale: apre (o riusa) una vera
// conversazione diretta su Supabase (start_direct_conversation), non più
// una copia locale per browser — chi scrive e chi legge vedono davvero lo
// stesso scambio. Non c'è aggiornamento in tempo reale: riaprendo la chat
// si rivedono anche i messaggi arrivati nel frattempo dall'altra parte.
export default function FriendChatModal({ friendId, user, onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const load = async () => {
      const [{ conversationId: convId, error: convError }, profilesMap] = await Promise.all([
        startDirectConversation(friendId),
        fetchProfilesMap([friendId]),
      ]);
      if (cancelled) return;
      if (convError) {
        setError(convError);
        setLoading(false);
        return;
      }
      setFriend(profilesMap.get(friendId) ?? { id: friendId, name: 'Utente', avatar: '' });
      setConversationId(convId);
      const { messages: fetched, error: msgError } = await fetchMessages(convId);
      if (cancelled) return;
      if (msgError) {
        setError(msgError);
        setLoading(false);
        return;
      }
      setMessages(fetched);
      setLoading(false);
      markConversationRead(convId);
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [friendId]);

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !conversationId || sending) return;
    setSending(true);
    const { id, createdAt, error: sendError } = await sendMessage(conversationId, text);
    setSending(false);
    if (sendError) {
      setError(sendError);
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        id,
        conversationId,
        senderId: user.id,
        author: { id: user.id, name: user.nickname || user.username || 'Tu', avatar: user.avatar || '' },
        testo: text,
        data: createdAt,
      },
    ]);
    setDraft('');
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-friend-chat-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <div className="rb-friend-chat-header">
          {friend && (
            <>
              <img src={friend.avatar} alt="" />
              <strong>{friend.name}</strong>
            </>
          )}
        </div>

        {loading && <p className="rb-friend-chat-empty">Caricamento...</p>}
        {error && <p className="rb-privacy-error">⚠️ {error}</p>}

        {!loading && !error && (
          <ul className="rb-friend-chat-messages">
            {messages.length === 0 && <p className="rb-friend-chat-empty">Nessun messaggio ancora, scrivi il primo!</p>}
            {messages.map((m) => (
              <li key={m.id} className={`rb-friend-chat-msg ${m.senderId === user.id ? 'me' : ''}`}>
                <span>{m.testo}</span>
                <span className="rb-friend-chat-date">{formatRelativeDate(m.data)}</span>
              </li>
            ))}
          </ul>
        )}

        <form className="rb-friend-chat-form" onSubmit={send}>
          <input
            type="text"
            placeholder="Scrivi un messaggio..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={loading || Boolean(error) || !conversationId}
          />
          <button type="submit" disabled={sending || loading || Boolean(error) || !conversationId}>Invia</button>
        </form>
      </div>
    </ModalOverlay>
  );
}
