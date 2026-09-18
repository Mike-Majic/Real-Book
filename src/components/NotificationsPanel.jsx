import { useEffect, useState } from 'react';
import { formatRelativeDate } from './social/resolveAuthor';
import { getMyNotifications, markNotificationsRead } from '../data/notifications';
import ModalOverlay from './ModalOverlay';
import './NotificationsPanel.css';

function notificationLabel(n) {
  return n.tipo === 'super_like'
    ? `${n.actor.name} ti ha mandato un Super Like ⭐`
    : `È un match con ${n.actor.name}! 🎉`;
}

// Pannello notifiche (campanella in alto): match e super like reali,
// popolati da un trigger lato DB. Aprendolo si segnano subito tutte come
// lette (mark_notifications_read) e si azzera il badge sulla campanella.
export default function NotificationsPanel({ onClose, onRead, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMyNotifications(30).then(({ notifications: list }) => {
      if (cancelled) return;
      setNotifications(list ?? []);
      setLoading(false);
    });
    markNotificationsRead().then(() => onRead?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-notifications-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <h3>Notifiche</h3>

        {loading ? (
          <p className="rb-notifications-empty">Caricamento...</p>
        ) : (
          <ul className="rb-notifications-list">
            {notifications.length === 0 && <p className="rb-notifications-empty">Nessuna notifica ancora.</p>}
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`rb-notifications-row ${n.letta ? '' : 'unread'}`}
                  onClick={() => onNavigate(n.tipo)}
                >
                  <img src={n.actor.avatar} alt="" />
                  <span className="rb-notifications-row-text">
                    <strong>{notificationLabel(n)}</strong>
                    <span className="rb-notifications-row-date">{formatRelativeDate(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ModalOverlay>
  );
}
