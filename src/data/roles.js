// Ruoli dell'app: solo tre per ora, come richiesto ("più avanti vediamo
// quanti ruoli dovranno esistere"). L'owner è un'unica mail fissa, non
// modificabile da nessuno tramite il pannello: chi si registra o accede
// con questa esatta mail ottiene il ruolo owner in automatico.
//
// Limite onesto da sapere: questa è un'app senza backend reale, "senza
// backend" vuol dire anche senza verifica dell'email — chiunque digiti
// questa mail nel form di registrazione ottiene il ruolo owner. Una vera
// protezione richiederebbe un server che verifica l'identità (es. invio di
// un'email di conferma), qui non c'è. È una barriera contro i curiosi
// occasionali, non contro chi ha intenzione di aggirarla.
export const OWNER_EMAIL = 'm.colurci@gmail.com';

export const ROLES = {
  OWNER: 'owner',
  MODERATOR: 'moderatore',
  USER: 'utente',
};

export function roleForEmail(email) {
  return (email ?? '').trim().toLowerCase() === OWNER_EMAIL ? ROLES.OWNER : ROLES.USER;
}

export function isStaff(role) {
  return role === ROLES.OWNER || role === ROLES.MODERATOR;
}
