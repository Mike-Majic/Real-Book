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

// Post/commenti finti tolti su richiesta esplicita, per iniziare a testare
// l'app con dati reali: il feed parte vuoto finché non lo popolano post
// veri creati dagli utenti.
export const INITIAL_POSTS = [];

export const INITIAL_COMMENTS = [];

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
