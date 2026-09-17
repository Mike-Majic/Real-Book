import { supabase } from './supabaseClient';

const NICKNAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 1 settimana
const NAME_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000; // 3 mesi

// Converte la riga di public.profiles (snake_case, come arriva da Supabase)
// nella forma camelCase che il resto dell'app già si aspetta — così i
// componenti (TopBar, AgeGate, ProfileSettingsPanel, AdminPanel...) non
// hanno dovuto cambiare nomi di campo passando da localStorage a Supabase.
function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    nome: row.nome ?? '',
    cognome: row.cognome ?? '',
    email: row.email,
    phone: row.phone ?? '',
    backupEmail: row.backup_email ?? '',
    dataNascita: row.data_nascita,
    attachments: row.attachments ?? [],
    tipoAccount: row.tipo_account ?? 'persona',
    ragioneSociale: row.ragione_sociale ?? '',
    partitaIva: row.partita_iva ?? '',
    codiceFiscale: row.codice_fiscale ?? '',
    pec: row.pec ?? '',
    codiceSdi: row.codice_sdi ?? '',
    genere: row.genere ?? '',
    pronomi: row.pronomi ?? '',
    terminiAccettatiAt: row.termini_accettati_at,
    consensoMarketing: row.consenso_marketing ?? false,
    mondiAbilitati: row.mondi_abilitati ?? [],
    ruolo: row.ruolo,
    verificato: row.verificato,
    avatar: row.avatar_url,
    createdAt: row.created_at,
    lastNicknameChangeAt: row.last_nickname_change_at,
    lastNameChangeAt: row.last_name_change_at,
  };
}

async function fetchOwnProfile() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', auth.user.id).single();
  if (error) return null;
  return mapProfile(data);
}

// Account attualmente loggato (se una sessione Supabase è già salvata dal
// browser): usato all'avvio dell'app al posto del vecchio
// loadStored('rb-user', null) su localStorage.
export async function getCurrentAccount() {
  return fetchOwnProfile();
}

// Notifica ad ogni cambio di sessione (login, logout, refresh token,
// scadenza): l'app tiene lo stato utente sempre coerente con quello che
// Supabase pensa sia vero, invece di fidarsi solo dello stato locale.
export function subscribeAuthChanges(callback) {
  const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (!session) {
      callback(null);
      return;
    }
    callback(await fetchOwnProfile());
  });
  return () => sub.subscription.unsubscribe();
}

// Elenco account: la RLS di Supabase decide da sola cosa restituire (solo
// la propria riga per un utente normale, tutte per owner/moderatori) — non
// serve nessun controllo qui.
export async function getAccounts() {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
  if (error) return [];
  return data.map(mapProfile);
}

// Registra un nuovo account con Supabase Auth (email+password reale). Il
// ruolo (owner per m.colurci@gmail.com, altrimenti utente) e la riga in
// profiles li crea da soli un trigger lato server alla registrazione.
// Se il progetto richiede la conferma via mail, signUp non restituisce
// subito una sessione: in quel caso avatar ed eventuali allegati non
// possono essere caricati adesso (serve essere autenticati) e vanno gestiti
// dopo la conferma, al primo login.
export async function registerAccount({
  username,
  nickname,
  email,
  password,
  phone,
  backupEmail,
  attachments,
  dataNascita,
  tipoAccount,
  ragioneSociale,
  partitaIva,
  codiceFiscale,
  pec,
  codiceSdi,
  genere,
  pronomi,
  termsAcceptedAt,
  consensoMarketing,
  mondiAbilitati,
}) {
  const cleanEmail = (email ?? '').trim().toLowerCase();
  if (!username?.trim() || !nickname?.trim() || !cleanEmail || !password || !dataNascita) {
    return { error: 'Nome utente, nickname, mail, password e data di nascita sono obbligatori.' };
  }
  if (!genere) {
    return { error: 'Seleziona il genere.' };
  }
  if (!mondiAbilitati?.length) {
    return { error: 'Scegli almeno un mondo da abilitare.' };
  }
  if (!termsAcceptedAt) {
    return { error: 'Devi accettare i Termini di servizio e l\'Informativa Privacy per registrarti.' };
  }
  if (tipoAccount === 'azienda' && !ragioneSociale?.trim()) {
    return { error: 'Inserisci la ragione sociale per un account azienda.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      // Senza questo, il link nella mail di conferma riporta a una pagina
      // generica di Supabase invece che a Versemove: qui gli si dice dove
      // tornare dopo la verifica (Supabase deve avere questo indirizzo
      // nell'elenco "Redirect URLs" delle impostazioni Auth, altrimenti lo
      // ignora e torna comunque alla pagina generica).
      emailRedirectTo: window.location.origin + import.meta.env.BASE_URL,
      data: {
        username: username.trim(),
        nickname: nickname.trim(),
        phone: phone?.trim() || '',
        backupEmail: backupEmail?.trim().toLowerCase() || '',
        dataNascita,
        tipoAccount: tipoAccount === 'azienda' ? 'azienda' : 'persona',
        ragioneSociale: ragioneSociale?.trim() || '',
        partitaIva: partitaIva?.trim() || '',
        codiceFiscale: codiceFiscale?.trim() || '',
        pec: pec?.trim() || '',
        codiceSdi: codiceSdi?.trim() || '',
        genere,
        pronomi: pronomi?.trim() || '',
        termsAcceptedAt,
        consensoMarketing: Boolean(consensoMarketing),
        mondiAbilitati,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  // Sessione subito attiva: l'avatar di default (nessun vero upload) e gli
  // eventuali allegati caricati in registrazione si possono sistemare ora.
  const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(cleanEmail)}`;
  await supabase.rpc('update_own_avatar', { p_avatar_url: avatar });

  if (attachments?.length) {
    for (const att of attachments) {
      await uploadAttachment(data.user.id, att);
    }
  }

  const account = await fetchOwnProfile();
  return { account };
}

export async function loginAccount(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email: (email ?? '').trim().toLowerCase(),
    password,
  });
  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { error: 'Devi prima confermare la mail: controlla la posta (anche spam).', needsEmailConfirmation: true };
    }
    return { error: 'Mail o password non corretti.' };
  }
  const account = await fetchOwnProfile();
  if (!account) {
    return { error: 'Account non trovato.' };
  }
  return { account };
}

export async function logoutAccount() {
  await supabase.auth.signOut();
}

// Rimanda la mail di conferma: serve se il link della prima è scaduto, è
// già stato aperto senza completare la conferma, o semplicemente non è
// arrivata. Non serve rifare la registrazione: l'account esiste già, solo
// non confermato.
export async function resendConfirmationEmail(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: (email ?? '').trim().toLowerCase(),
    options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
  });
  if (error) return { error: error.message };
  return {};
}

// Carica un file nel bucket privato "attachments" (sotto il proprio uid,
// imposto dalle policy di storage) e lo registra nel profilo tramite la
// funzione add_own_attachment. `file` è un File/Blob del browser.
export async function uploadAttachment(userId, file) {
  const path = `${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);
  if (uploadError) return { error: uploadError.message };
  const { error: rpcError } = await supabase.rpc('add_own_attachment', { p_name: file.name, p_path: path });
  if (rpcError) return { error: rpcError.message };
  return { attachment: { name: file.name, path } };
}

// Solo l'owner può chiamare questa con successo (lo garantisce la funzione
// lato server: verifica il ruolo di chi chiama e blocca comunque la riga
// dell'owner, chiunque provi a toccarla).
export async function updateAccountRole(accountId, newRole) {
  const { error } = await supabase.rpc('set_account_role', { p_id: accountId, p_ruolo: newRole });
  if (error) return { error: error.message };
  return {};
}

export async function setAccountVerified(accountId, verificato) {
  const { error } = await supabase.rpc('set_account_verified', { p_id: accountId, p_verificato: Boolean(verificato) });
  if (error) return { error: error.message };
  return {};
}

// Quanto manca (ms) al prossimo cambio nickname consentito: 0 se libero.
// Solo per la UI (badge/countdown) — il limite vero lo applica la funzione
// update_own_nickname lato server, non ci si può fidare del client per
// questo.
export function nicknameCooldownRemaining(account) {
  if (!account?.lastNicknameChangeAt) return 0;
  const elapsed = Date.now() - new Date(account.lastNicknameChangeAt).getTime();
  return Math.max(0, NICKNAME_COOLDOWN_MS - elapsed);
}

export function nameCooldownRemaining(account) {
  if (!account?.lastNameChangeAt) return 0;
  const elapsed = Date.now() - new Date(account.lastNameChangeAt).getTime();
  return Math.max(0, NAME_COOLDOWN_MS - elapsed);
}

export async function updateNickname(accountId, newNickname) {
  const { error } = await supabase.rpc('update_own_nickname', { p_nickname: (newNickname ?? '').trim() });
  if (error) return { error: error.message };
  return { account: await fetchOwnProfile() };
}

export async function updateName(accountId, nome, cognome) {
  const { error } = await supabase.rpc('update_own_name', {
    p_nome: (nome ?? '').trim(),
    p_cognome: (cognome ?? '').trim(),
  });
  if (error) return { error: error.message };
  return { account: await fetchOwnProfile() };
}

// Non genera più una password temporanea: usa il reset nativo di Supabase
// Auth, che invia una mail con un link all'indirizzo dell'account. Chi
// chiama (owner/moderatore dal pannello, o l'utente stesso dal login) non
// vede mai una password in chiaro.
export async function resetAccountPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail((email ?? '').trim().toLowerCase());
  if (error) return { error: error.message };
  return {};
}

// Aggiorna tipo account, ragione sociale/P.IVA, genere e pronomi dopo la
// registrazione (es. dal pannello Impostazioni). La funzione lato server
// valida i valori consentiti e tocca solo la riga di chi chiama.
export async function updateAccountDetails(accountId, {
  tipoAccount,
  ragioneSociale,
  partitaIva,
  codiceFiscale,
  pec,
  codiceSdi,
  genere,
  pronomi,
}) {
  const { error } = await supabase.rpc('update_own_account_details', {
    p_tipo_account: tipoAccount,
    p_ragione_sociale: ragioneSociale ?? '',
    p_partita_iva: partitaIva ?? '',
    p_codice_fiscale: codiceFiscale ?? '',
    p_pec: pec ?? '',
    p_codice_sdi: codiceSdi ?? '',
    p_genere: genere,
    p_pronomi: pronomi ?? '',
  });
  if (error) return { error: error.message };
  return { account: await fetchOwnProfile() };
}

// Cambia i mondi abilitati per l'account (dalle Impostazioni). La funzione
// lato server applica il limite di 4 cambi a settimana e valida gli id dei
// mondi — qui si passa semplicemente l'elenco completo desiderato (non un
// singolo toggle), più semplice da tenere sincronizzato con la UI.
export async function setOwnWorlds(mondi) {
  const { error } = await supabase.rpc('set_own_worlds', { p_mondi: mondi });
  if (error) return { error: error.message };
  return { account: await fetchOwnProfile() };
}
