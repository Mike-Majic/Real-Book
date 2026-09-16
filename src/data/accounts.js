import { OWNER_EMAIL, ROLES, roleForEmail } from './roles';

const STORAGE_KEY = 'rb-accounts';

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

export function getAccounts() {
  return loadAccounts();
}

export function findAccountByEmail(email) {
  const q = (email ?? '').trim().toLowerCase();
  if (!q) return null;
  return loadAccounts().find((a) => a.email === q) ?? null;
}

// Registra un nuovo account. Nessun vero backend: password ed email vivono
// solo in questo browser (localStorage), come il resto dei dati dell'app —
// vedi il commento in roles.js sui limiti di questo per l'owner.
export function registerAccount({ username, nickname, email, password, phone, backupEmail, attachments }) {
  const cleanEmail = (email ?? '').trim().toLowerCase();
  if (!username?.trim() || !nickname?.trim() || !cleanEmail || !password) {
    return { error: 'Nome utente, nickname, mail e password sono obbligatori.' };
  }
  if (findAccountByEmail(cleanEmail)) {
    return { error: 'Questa mail ha già un account.' };
  }
  const accounts = loadAccounts();
  const account = {
    id: `acc-${Date.now()}`,
    username: username.trim(),
    nickname: nickname.trim(),
    email: cleanEmail,
    password,
    phone: phone?.trim() || '',
    backupEmail: backupEmail?.trim().toLowerCase() || '',
    attachments: attachments ?? [],
    ruolo: roleForEmail(cleanEmail),
    avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(cleanEmail)}`,
    createdAt: new Date().toISOString(),
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
