// Categorie del mondo Incontri (rosso): "Live-chat" (dirette con chat in
// tempo reale) e "Match" (stile Tinder). Stessa struttura di
// BAMBINI_CATEGORIES/ARTE_CATEGORIES, così funziona con lo stesso
// meccanismo di triangoli sul globo (vedi App.jsx, CATEGORY_WORLDS).
//
// Gli anchor sono deliberatamente in mezzo all'oceano (non su una città):
// il triangolo di una categoria è grande e semi-trasparente, se ancorato su
// terraferma finisce sopra ai marker degli utenti di quella zona e li
// nasconde. Sull'acqua non c'è nessuno da coprire.
export const INCONTRI_CATEGORIES = [
  {
    id: 'live',
    label: 'Live-chat',
    icon: '🔴',
    anchor: { lat: 15, lng: -35 }, // Atlantico centrale
    aliases: ['live', 'live-chat', 'livechat', 'diretta', 'chat', 'chat dal vivo'],
    subfamilies: [],
  },
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
