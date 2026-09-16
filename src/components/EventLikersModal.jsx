import { resolveAuthor } from './social/resolveAuthor';
import './EventLikersModal.css';

// Elenco di chi ha messo "mi piace" a un evento: si apre sia dal badge sul
// marker quadrato sul globo sia dalla card in colonna, stessa lista in
// entrambi i casi (stesso evento, stesso array mi_piace). Per ciascuno: se
// è già un amico, un bottone per scrivergli; altrimenti per mandargli una
// richiesta di amicizia (o "Richiesta inviata" se già fatto).
export default function EventLikersModal({
  event,
  user,
  onOpenAuth,
  friends,
  friendRequestsSent,
  onSendRequest,
  onOpenChat,
  onClose,
}) {
  if (!event) return null;

  const likers = event.mi_piace.map((id) => ({ id, ...resolveAuthor(id, user) }));

  const handleAction = (id, action) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    action(id);
  };

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-event-likers-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <h3>Mi piace</h3>
        <p className="rb-event-likers-subtitle">{event.titolo}</p>

        <ul className="rb-event-likers-list">
          {likers.map((l) => {
            const isMe = l.id === 'me';
            const isFriend = !isMe && friends.includes(l.id);
            const requested = !isMe && friendRequestsSent.includes(l.id);
            return (
              <li key={l.id} className="rb-event-likers-item">
                <img src={l.avatar} alt="" />
                <strong>{isMe ? 'Tu' : l.name}</strong>
                {!isMe && (
                  isFriend ? (
                    <button type="button" onClick={() => handleAction(l.id, onOpenChat)}>Messaggio</button>
                  ) : requested ? (
                    <button type="button" disabled>Richiesta inviata</button>
                  ) : (
                    <button type="button" onClick={() => handleAction(l.id, onSendRequest)}>+ Amico</button>
                  )
                )}
              </li>
            );
          })}
          {likers.length === 0 && <p className="rb-event-likers-empty">Nessun mi piace ancora.</p>}
        </ul>
      </div>
    </div>
  );
}
