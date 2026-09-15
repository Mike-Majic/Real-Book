import { MOCK_USERS } from '../../data/mockUsers';

// autoreId di un post/commento è o un MOCK_USERS.id, o la stringa 'me' per
// ciò che ha creato l'utente loggato in questa sessione.
export function resolveAuthor(autoreId, currentUser) {
  if (autoreId === 'me') {
    return { name: currentUser?.name ?? 'Tu', avatar: currentUser?.avatar ?? '', isMe: true };
  }
  const u = MOCK_USERS.find((m) => m.id === autoreId);
  return u
    ? { name: u.name, avatar: u.avatar, city: u.city, isMe: false }
    : { name: 'Utente', avatar: '', isMe: false };
}

// Data relativa breve ("adesso", "3h fa", "2g fa", oppure la data per le più vecchie).
export function formatRelativeDate(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'adesso';
  if (minutes < 60) return `${minutes}m fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g fa`;
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
}
