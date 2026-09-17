// Eventi del mondo Social (Blu): creati da un utente con titolo, città
// (deve essere una città riconosciuta, vedi geo.js — serve per posizionare
// l'icona sul globo), data, ora, bio e una foto. Restano visibili fino a
// fine giornata della data dell'evento, poi vengono tolti in automatico
// (vedi isEventExpired, applicato da App.jsx a ogni caricamento).
//
// Evento: { id, autoreId, titolo, citta, lat, lng, data (YYYY-MM-DD), ora
// (HH:MM), bio, foto (dataURL), mi_piace: [autoreId,...] }

// Un evento "scade" a fine giornata della sua data: dopo la mezzanotte del
// giorno dell'evento non deve più comparire, né sul globo né in colonna.
export function isEventExpired(event) {
  const endOfDay = new Date(`${event.data}T23:59:59`);
  return Date.now() > endOfDay.getTime();
}

// Eventi finti tolti su richiesta esplicita: si parte senza eventi, finché
// non ne crea uno un utente vero.
export const SEED_EVENTS = [];
