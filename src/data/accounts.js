import { OWNER_EMAIL, ROLES, roleForEmail } from './roles';

const STORAGE_KEY = 'rb-accounts';

const NICKNAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1 settimana
const NAME_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000; // 3 mesi

function loadAccounts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function randomPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function getAccounts() {
  return loadAccounts();
}

export function findAccountByEmail(email) {
  const q = (email ?? '').trim().toLowerCase();
  if (!q) return null;
  return loadAccounts().find((a) => a.email === q) ?? null;
}

function isNicknameTaken(nickname, excludeId) {
  const q = nickname.trim().toLowerCase();
  return loadAccounts().some((a) => a.id !== excludeId && a.nickname.trim().toLowerCase() === q);
}

// Registra un nuovo account. Nessun vero backend: password, mail e data di
// nascita vivono solo in questo browser (localStorage), come il resto dei
// dati dell'app — vedi il commento in roles.js sui limiti di questo per
// l'owner. nome/cognome non si chiedono qui (si aggiungono più avanti nel
// profilo): solo nickname è obbligatorio da subito, è quello con cui si
// appare nell'app.
export function registerAccount({ username, nickname, email, password, phone, backupEmail, attachments, dataNascita }) {
  const cleanEmail = (email ?? '').trim().toLowerCase();
  if (!username?.trim() || !nickname?.trim() || !cleanEmail || !password || !dataNascita) {
    return { error: 'Nome utente, nickname, mail, password e data di nascita sono obbligatori.' };
  }
  if (findAccountByEmail(cleanEmail)) {
    return { error: 'Questa mail ha già un account.' };
  }
  if (isNicknameTaken(nickname, null)) {
    return { error: 'Questo nickname è già in uso.' };
  }
  const accounts = loadAccounts();
  const account = {
    id: `acc-${Date.now()}`,
    username: username.trim(),
    nickname: nickname.trim(),
    nome: '',
    cognome: '',
    email: cleanEmail,
    password,
    phone: phone?.trim() || '',
    backupEmail: backupEmail?.trim().toLowerCase() || '',
    dataNascita,
    attachments: attachments ?? [],
    ruolo: roleForEmail(cleanEmail),
    verificato: false,
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(cleanEmail)}`,
    createdAt: new Date().toISOString(),
    lastNicknameChangeAt: null,
    lastNameChangeAt: null,
  };
  accounts.push(account);
  saveAccounts(accounts);
  return { account };
}

export function loginAccount(email, password) {
  const account = findAccountByEmail(email);
  if (!account || account.password !== password) {
    return { error: 'Mail o password non corretti.' };
  }
  return { account };
}

// Solo l'owner può chiamare questa (il controllo va fatto da chi la usa,
// qui c'è comunque una guardia): il ruolo dell'owner stesso non si tocca
// mai, nemmeno da un altro account che provasse a farlo.
export function updateAccountRole(accountId, newRole) {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.id === accountId);
  if (idx === -1) return { error: 'Utente non trovato.' };
  if (accounts[idx].email === OWNER_EMAIL || accounts[idx].ruolo === ROLES.OWNER) {
    return { error: "Il ruolo dell'owner non è modificabile." };
  }
  if (newRole !== ROLES.MODERATOR && newRole !== ROLES.USER) {
    return { error: 'Ruolo non valido.' };
  }
  accounts[idx] = { ...accounts[idx], ruolo: newRole };
  saveAccounts(accounts);
  return { account: accounts[idx] };
}

// Quanto manca (ms) al prossimo cambio nickname consentito: 0 se libero.
export function nicknameCooldownRemaining(account) {
  if (!account?.lastNicknameChangeAt) return 0;
  const elapsed = Date.now() - new Date(account.lastNicknameChangeAt).getTime();
  return Math.max(0, NICKNAME_COOLDOWN_MS - elapsed);
}

// Quanto manca (ms) al prossimo cambio nome/cognome consentito: 0 se libero.
export function nameCooldownRemaining(account) {
  if (!account?.lastNameChangeAt) return 0;
  const elapsed = Date.now() - new Date(account.lastNameChangeAt).getTime();
  return Math.max(0, NAME_COOLDOWN_MS - elapsed);
}

export function updateNickname(accountId, newNickname) {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.id === accountId);
  if (idx === -1) return { error: 'Utente non trovato.' };
  const account = accounts[idx];
  const trimmed = (newNickname ?? '').trim();
  if (!trimmed) return { error: 'Il nickname non può essere vuoto.' };
  if (nicknameCooldownRemaining(account) > 0) {
    return { error: 'Puoi cambiare nickname solo una volta a settimana.' };
  }
  if (isNicknameTaken(trimmed, accountId)) {
    return { error: 'Questo nickname è già in uso.' };
  }
  accounts[idx] = { ...account, nickname: trimmed, lastNicknameChangeAt: new Date().toISOString() };
  saveAccounts(accounts);
  return { account: accounts[idx] };
}

// Prima volta che si imposta nome/cognome (erano vuoti) non c'è cooldown:
// la regola vale per i CAMBI, non per il primo inserimento.
export function updateName(accountId, nome, cognome) {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.id === accountId);
  if (idx === -1) return { error: 'Utente non trovato.' };
  const account = accounts[idx];
  const hadName = Boolean(account.nome || account.cognome);
  if (hadName && nameCooldownRemaining(account) > 0) {
    return { error: 'Puoi cambiare nome e cognome solo una volta ogni 3 mesi.' };
  }
  accounts[idx] = {
    ...account,
    nome: (nome ?? '').trim(),
    cognome: (cognome ?? '').trim(),
    lastNameChangeAt: new Date().toISOString(),
  };
  saveAccounts(accounts);
  return { account: accounts[idx] };
}

// Genera una password temporanea e la sostituisce: senza un vero server non
// si può inviarla per mail, va comunicata a mano (es. dalla casella
// condivisa dei moderatori) — per questo viene restituita una sola volta,
// non resta consultabile da nessuna parte dopo.
export function resetAccountPassword(accountId) {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.id === accountId);
  if (idx === -1) return { error: 'Utente non trovato.' };
  const newPassword = randomPassword();
  accounts[idx] = { ...accounts[idx], password: newPassword };
  saveAccounts(accounts);
  return { account: accounts[idx], newPassword };
}

// Verifica tramite documento: senza un vero servizio di controllo identità
// è owner/moderatori a esaminare gli allegati caricati in registrazione e
// segnare l'account come verificato a mano.
export function setAccountVerified(accountId, verificato) {
  const accounts = loadAccounts();
  const idx = accounts.findIndex((a) => a.id === accountId);
  if (idx === -1) return { error: 'Utente non trovato.' };
  accounts[idx] = { ...accounts[idx], verificato: Boolean(verificato) };
  saveAccounts(accounts);
  return { account: accounts[idx] };
}
