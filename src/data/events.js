// Eventi del mondo Social (Blu): creati da un utente con titolo, città
// (deve essere una città riconosciuta, vedi geo.js — serve per posizionare
// l'icona sul globo), data, ora, bio e una foto. Restano visibili fino a
// fine giornata della data dell'evento, poi vengono tolti in automatico
// (vedi isEventExpired, applicato da App.jsx a ogni caricamento).
//
// Evento: { id, autoreId, titolo, citta, lat, lng, data (YYYY-MM-DD), ora
// (HH:MM), bio, foto (dataURL), mi_piace: [autoreId,...] }

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}

// Un evento "scade" a fine giornata della sua data: dopo la mezzanotte del
// giorno dell'evento non deve più comparire, né sul globo né in colonna.
export function isEventExpired(event) {
  const endOfDay = new Date(`${event.data}T23:59:59`);
  return Date.now() > endOfDay.getTime();
}

// Un paio di eventi finti di partenza, con data "oggi"/"domani" così sono
// sempre visibili a prescindere da quando si prova l'app (non hanno una
// foto vera: sfondo a gradiente, stesso principio di artePhotos.js, per non
// dipendere da immagini esterne nei contenuti dimostrativi).
export const SEED_EVENTS = [
  {
    id: 'seed-evento-1',
    autoreId: 1,
    titolo: 'Aperitivo tra fotografi',
    citta: 'Roma',
    lat: 41.9028,
    lng: 12.4964,
    data: todayPlus(0),
    ora: '19:00',
    bio: 'Ritrovo informale per chi ama la fotografia di strada, si scattano quattro foto insieme e poi aperitivo.',
    foto: null,
    gradient: 'linear-gradient(160deg,#f59e0b,#7c2d12)',
    mi_piace: [2, 6],
  },
  {
    id: 'seed-evento-2',
    autoreId: 11,
    titolo: 'Jam session danza contemporanea',
    citta: 'Parigi',
    lat: 48.8566,
    lng: 2.3522,
    data: todayPlus(1),
    ora: '18:30',
    bio: 'Studio aperto per chiunque voglia improvvisare qualche passo, livello libero.',
    foto: null,
    gradient: 'linear-gradient(160deg,#ec4899,#4a044e)',
    mi_piace: [9],
  },
];
