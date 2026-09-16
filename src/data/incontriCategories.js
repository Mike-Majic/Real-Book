// Categorie del mondo Incontri (rosso): per ora solo "Live-chat", dirette
// con chat in tempo reale. Stessa struttura di BAMBINI_CATEGORIES/
// ARTE_CATEGORIES, così funziona con lo stesso meccanismo di triangoli sul
// globo (vedi App.jsx, CATEGORY_WORLDS).
export const INCONTRI_CATEGORIES = [
  {
    id: 'live',
    label: 'Live-chat',
    icon: '🔴',
    anchor: { lat: 41.9, lng: 12.5 },
    aliases: ['live', 'live-chat', 'livechat', 'diretta', 'chat', 'chat dal vivo'],
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
