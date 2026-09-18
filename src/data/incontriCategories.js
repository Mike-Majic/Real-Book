// Categorie del mondo Incontri (rosso): solo "Match" (stile Tinder) — le
// live sono state spostate nei mondi Social e Lavoro (vedi
// liveStreams.js), qui restano solo gli incontri. Stessa struttura di
// BAMBINI_CATEGORIES/ARTE_CATEGORIES, così funziona con lo stesso
// meccanismo di triangoli sul globo (vedi App.jsx, CATEGORY_WORLDS).
//
// L'anchor è deliberatamente in mezzo all'oceano (non su una città): il
// triangolo di una categoria è grande e semi-trasparente, se ancorato su
// terraferma finisce sopra ai marker degli utenti di quella zona e li
// nasconde. Sull'acqua non c'è nessuno da coprire.
export const INCONTRI_CATEGORIES = [
  {
    id: 'match',
    label: 'Match',
    icon: '💘',
    anchor: { lat: -20, lng: -140 }, // Pacifico meridionale
    aliases: ['match', 'tinder', 'mi piace', 'incontri rapidi', 'swipe'],
    subfamilies: [],
  },
];

export function resolveCategoryQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    INCONTRI_CATEGORIES.find(
      (c) => c.label.toLowerCase() === q || c.aliases.some((a) => a.toLowerCase() === q)
    ) ??
    INCONTRI_CATEGORIES.find(
      (c) => c.label.toLowerCase().includes(q) || c.aliases.some((a) => a.toLowerCase().includes(q))
    ) ??
    null
  );
}
