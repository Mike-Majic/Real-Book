// Elenco statico usato SOLO per taggare persone/gruppi del mondo Social
// quando si carica una foto dal mondo Arte (vedi FotografiaColumn.jsx) —
// non sono i gruppi reali in cui ci si iscrive: quelli vivono ora su
// Supabase (vedi data/groups.js, il vero CRUD gruppi/iscrizioni).
// Rinominato da groups.js per non confondere le due cose.
export const GROUPS = [
  {
    id: 'fotografia',
    name: 'Fotografia & Tramonti',
    tagline: 'Scatti, luce giusta e il tramonto perfetto',
    icon: '📷',
    color: '#f59e0b',
    memberCount: 1284,
  },
  {
    id: 'musica-indie',
    name: 'Musica Indie & Concerti',
    tagline: "Concerti, scoperte e playlist per chi ama l'indie",
    icon: '🎸',
    color: '#22c55e',
    memberCount: 2107,
  },
  {
    id: 'arte-mostre',
    name: 'Arte & Mostre',
    tagline: 'Gallerie, mostre e arte contemporanea',
    icon: '🖼️',
    color: '#8b5cf6',
    memberCount: 964,
  },
  {
    id: 'cinema',
    name: 'Cinema & Cortometraggi',
    tagline: 'Set, casting e chiacchiere da cinefili',
    icon: '🎬',
    color: '#ef4444',
    memberCount: 1432,
  },
  {
    id: 'mare-barca',
    name: 'Vita in Barca & Mare',
    tagline: 'Uscite in barca e giornate di mare piatto',
    icon: '⛵',
    color: '#0ea5e9',
    memberCount: 871,
  },
  {
    id: 'cucina',
    name: 'Cucina di Casa',
    tagline: 'Ricette della nonna (e disastri in cucina)',
    icon: '🍕',
    color: '#f97316',
    memberCount: 3014,
  },
  {
    id: 'tech',
    name: 'Tech & Fibra',
    tagline: 'Reti, cablaggi e tutto ciò che corre veloce',
    icon: '💻',
    color: '#38bdf8',
    memberCount: 1729,
  },
  {
    id: 'danza-teatro',
    name: 'Danza & Teatro',
    tagline: 'Palco, prove e la magia dello spettacolo dal vivo',
    icon: '🩰',
    color: '#ec4899',
    memberCount: 645,
  },
  {
    id: 'viaggi',
    name: 'Viaggi & Città',
    tagline: "Città nuove, voli in ritardo, scoperte in giro",
    icon: '✈️',
    color: '#a3e635',
    memberCount: 1896,
  },
];

export function getGroupById(id) {
  return GROUPS.find((g) => g.id === id) ?? null;
}
