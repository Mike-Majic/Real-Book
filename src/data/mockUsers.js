// Utenti finti tolti su richiesta esplicita, per iniziare a testare l'app
// con dati reali: MOCK_USERS resta un array vuoto (non si cancella il file,
// così tutti i punti che lo consultano — resolveAuthor, liste "persone
// vicine", nomi nei contatti bloccati... — continuano a funzionare, restituendo
// semplicemente "nessun risultato" invece di andare in errore).
export const MOCK_USERS = [];

export function usersForWorld(worldId) {
  return MOCK_USERS.filter((u) => u.worlds.includes(worldId));
}
