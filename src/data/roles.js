// Ruoli dell'app: solo tre per ora, come richiesto ("più avanti vediamo
// quanti ruoli dovranno esistere"). L'assegnazione del ruolo owner (mail
// fissa m.colurci@gmail.com) e la sua immutabilità sono decise lato
// server, dentro Supabase (trigger di registrazione + funzione
// set_account_role) — qui restano solo le etichette usate dall'interfaccia.
export const ROLES = {
  OWNER: 'owner',
  MODERATOR: 'moderatore',
  USER: 'utente',
};

export function isStaff(role) {
  return role === ROLES.OWNER || role === ROLES.MODERATOR;
}
