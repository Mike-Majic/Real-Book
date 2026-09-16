// Casella postale condivisa tra owner e moderatori: qui arrivano le
// richieste urgenti degli utenti (es. cambio nickname/nome fuori dal
// lasso temporale consentito). Nessun vero server: un canale interno
// all'app, salvato in locale come il resto.
const STORAGE_KEY = 'rb-mod-mailbox';

function loadMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getMailboxMessages() {
  return [...loadMessages()].sort((a, b) => new Date(b.data) - new Date(a.data));
}

export function sendMailboxMessage({ fromAccountId, fromNickname, subject, body }) {
  const messages = loadMessages();
  const msg = {
    id: `mail-${Date.now()}`,
    fromAccountId,
    fromNickname,
    subject,
    body,
    data: new Date().toISOString(),
    letto: false,
  };
  messages.push(msg);
  saveMessages(messages);
  return msg;
}

export function markMessageRead(messageId) {
  const messages = loadMessages();
  const idx = messages.findIndex((m) => m.id === messageId);
  if (idx === -1) return;
  messages[idx] = { ...messages[idx], letto: true };
  saveMessages(messages);
}

export function unreadMailboxCount() {
  return loadMessages().filter((m) => !m.letto).length;
}
