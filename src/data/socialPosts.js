// Fase A — Modello dati dei post del mondo Social (Blu). Nessun backend:
// i post/commenti "veri" (creati dall'utente loggato) vivono nello stato di
// SocialFeed.jsx, persistito in localStorage; questo file fornisce solo la
// forma dei dati e un set di post/commenti finti per popolare il feed.
//
// Post: { id, autoreId, testo, data (ISO), mi_piace: [autoreId,...],
//         commenti: [commentId,...], gif: url|null, link_esterno: {url}|null,
//         gruppo_id: id di GROUPS|null (null = bacheca generale) }
// Commento: { id, post_id, autoreId, testo, data (ISO), gif: url|null,
//             reazioni: { emoji: conteggio } }
//
// autoreId fa riferimento a MOCK_USERS.id, oppure vale 'me' per i post/
// commenti creati dall'utente loggato in questa sessione.

export const INITIAL_POSTS = [
  {
    id: 'post-1',
    autoreId: 1,
    testo: 'Tramonto pazzesco oggi sul lungomare, un’emozione ogni volta 🌅',
    data: '2026-09-15T07:40:00Z',
    mi_piace: [2, 6, 9],
    commenti: ['c-1', 'c-2'],
    gif: null,
    link_esterno: null,
    gruppo_id: 'fotografia',
  },
  {
    id: 'post-2',
    autoreId: 2,
    testo: 'Oggi ho finito l’installazione della fibra in tutto il palazzo, che soddisfazione! 💪',
    data: '2026-09-15T09:15:00Z',
    mi_piace: [1, 20],
    commenti: ['c-3'],
    gif: null,
    link_esterno: null,
    gruppo_id: 'tech',
  },
  {
    id: 'post-3',
    autoreId: 6,
    testo: 'Sto cercando attori per un cortometraggio, chi è interessato scrive in privato!',
    data: '2026-09-13T18:00:00Z',
    mi_piace: [1, 9, 11],
    commenti: [],
    gif: null,
    link_esterno: null,
    gruppo_id: 'cinema',
  },
  {
    id: 'post-4',
    autoreId: 9,
    testo: 'Londra sotto la pioggia ha comunque il suo fascino ☔',
    data: '2026-09-15T06:20:00Z',
    mi_piace: [1],
    commenti: ['c-4'],
    gif: 'https://media.giphy.com/media/3o7aCTPPm4OHfRLSH6/giphy.gif',
    link_esterno: null,
    gruppo_id: 'viaggi',
  },
  {
    id: 'post-5',
    autoreId: 11,
    testo: 'Prova costume di domani sera, non vedo l’ora di ballare 💃',
    data: '2026-09-14T20:00:00Z',
    mi_piace: [6, 9],
    commenti: [],
    gif: null,
    link_esterno: { url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' },
    gruppo_id: 'danza-teatro',
  },
  {
    id: 'post-6',
    autoreId: 13,
    testo: 'Weekend tra gallerie d’arte a New York, consiglio a tutti questa mostra',
    data: '2026-09-15T10:05:00Z',
    mi_piace: [1, 17],
    commenti: ['c-5'],
    gif: null,
    link_esterno: { url: 'https://www.moma.org/calendar/exhibitions' },
    gruppo_id: 'arte-mostre',
  },
  {
    id: 'post-7',
    autoreId: 16,
    testo: 'Il mare oggi era piatto come l’olio, giornata perfetta in barca ⛵',
    data: '2026-09-15T08:50:00Z',
    mi_piace: [2, 20],
    commenti: [],
    gif: null,
    link_esterno: null,
    gruppo_id: 'mare-barca',
  },
  {
    id: 'post-8',
    autoreId: 17,
    testo: 'Concerto indie ieri sera, che scoperta questa band 🎸',
    data: '2026-09-14T09:30:00Z',
    mi_piace: [9, 11, 13],
    commenti: ['c-6', 'c-7'],
    gif: null,
    link_esterno: null,
    gruppo_id: 'musica-indie',
  },
  {
    id: 'post-9',
    autoreId: 20,
    testo: 'Live streaming stasera alle 21, vi aspetto! 🎥',
    data: '2026-09-15T11:00:00Z',
    mi_piace: [2],
    commenti: [],
    gif: null,
    link_esterno: null,
    gruppo_id: null,
  },
  {
    id: 'post-10',
    autoreId: 4,
    testo: 'Pizza fatta in casa stasera, ricetta della nonna 🍕',
    data: '2026-09-12T19:45:00Z',
    mi_piace: [16],
    commenti: [],
    gif: null,
    link_esterno: null,
    gruppo_id: 'cucina',
  },
];

export const INITIAL_COMMENTS = [
  { id: 'c-1', post_id: 'post-1', autoreId: 2, testo: 'Bellissimo! Dove l’hai scattata?', data: '2026-09-15T07:55:00Z', gif: null, reazioni: { '❤️': 2 } },
  { id: 'c-2', post_id: 'post-1', autoreId: 6, testo: 'Wow, che colori 😍', data: '2026-09-15T08:10:00Z', gif: null, reazioni: {} },
  { id: 'c-3', post_id: 'post-2', autoreId: 20, testo: 'Grande lavoro! Quando tocca al mio palazzo? 😄', data: '2026-09-15T09:30:00Z', gif: null, reazioni: { '👍': 1 } },
  { id: 'c-4', post_id: 'post-4', autoreId: 1, testo: 'Anche a me piace la pioggia, in fondo', data: '2026-09-15T06:40:00Z', gif: null, reazioni: {} },
  { id: 'c-5', post_id: 'post-6', autoreId: 1, testo: 'La segno in agenda, grazie della dritta!', data: '2026-09-15T10:20:00Z', gif: null, reazioni: { '🙌': 1 } },
  { id: 'c-6', post_id: 'post-8', autoreId: 9, testo: 'Nome della band? Devo ascoltarli', data: '2026-09-14T10:00:00Z', gif: null, reazioni: {} },
  { id: 'c-7', post_id: 'post-8', autoreId: 11, testo: 'Ero lì anche io, serata pazzesca 🎶', data: '2026-09-14T10:15:00Z', gif: null, reazioni: { '❤️': 1, '🎉': 1 } },
];

// Punteggio di "pertinenza" per ordinare il feed globale: like + commenti,
// con un peso maggiore ai post più recenti (fino al doppio nelle prime 48
// ore, poi torna al punteggio base) — nessun algoritmo complesso, solo un
// criterio semplice e spiegabile, in attesa di un vero backend.
export function computeRelevance(post, allComments) {
  const commentCount = allComments.filter((c) => c.post_id === post.id).length;
  const engagement = post.mi_piace.length + commentCount;
  const ageHours = (Date.now() - new Date(post.data).getTime()) / 3_600_000;
  const recencyBoost = Math.max(0, 48 - ageHours) / 48; // 1 = appena pubblicato, 0 = da 48h+
  return engagement * (1 + recencyBoost);
}
