// Categorie del mondo Lavoro (bianco): per ora solo "Live" (dirette di
// lavoro/carriera su Twitch/YouTube/Kick, incorporate) — stessa struttura
// di INCONTRI_CATEGORIES/SOCIAL_CATEGORIES, stesso meccanismo di triangoli
// sul globo (vedi App.jsx, CATEGORY_WORLDS).
//
// Anchor deliberatamente in mezzo all'oceano, stesso motivo delle altre
// categorie "globali": un triangolo grande e semi-trasparente su
// terraferma finirebbe sopra ai marker degli utenti di quella zona.
export const LAVORO_CATEGORIES = [
  {
    id: 'live',
    label: 'Live',
    icon: '🔴',
    anchor: { lat: -10, lng: -25 }, // Atlantico meridionale
    aliases: ['live', 'diretta', 'dirette', 'streaming'],
    subfamilies: [],
  },
];

export function resolveCategoryQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    LAVORO_CATEGORIES.find(
      (c) => c.label.toLowerCase() === q || c.aliases.some((a) => a.toLowerCase() === q)
    ) ??
    LAVORO_CATEGORIES.find(
      (c) => c.label.toLowerCase().includes(q) || c.aliases.some((a) => a.toLowerCase().includes(q))
    ) ??
    null
  );
}
