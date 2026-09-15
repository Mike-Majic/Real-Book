// Relazione utente-contenuto: chi ha messo "mi piace" o "parteciperò" a un
// contenuto di una categoria del mondo Arte & Musica, e quando. Usata per
// popolare la colonna "Persone vicine" di CategoryColumn — solo dati finti,
// nessun backend. contentId fa riferimento agli id in CATEGORY_RESULTS
// (src/data/arteCategories.js), userId a MOCK_USERS (src/data/mockUsers.js).
export const CONTENT_INTERACTIONS = [
  { id: 'int-1', userId: 1, categoryId: 'libreria', contentId: 'libreria-1', type: 'mi_piace', timestamp: '2026-09-10T18:30:00Z' },
  { id: 'int-2', userId: 4, categoryId: 'libreria', contentId: 'libreria-3', type: 'mi_piace', timestamp: '2026-09-11T09:15:00Z' },
  { id: 'int-3', userId: 3, categoryId: 'musica', contentId: 'musica-2', type: 'mi_piace', timestamp: '2026-09-12T21:05:00Z' },
  { id: 'int-4', userId: 20, categoryId: 'musica', contentId: 'musica-4', type: 'parteciperò', timestamp: '2026-09-13T17:40:00Z' },
  { id: 'int-5', userId: 6, categoryId: 'cinema', contentId: 'cinema-1', type: 'parteciperò', timestamp: '2026-09-09T20:00:00Z' },
  { id: 'int-6', userId: 7, categoryId: 'cinema', contentId: 'cinema-3', type: 'mi_piace', timestamp: '2026-09-10T14:20:00Z' },
  { id: 'int-7', userId: 9, categoryId: 'teatro', contentId: 'teatro-2', type: 'parteciperò', timestamp: '2026-09-14T19:30:00Z' },
  { id: 'int-8', userId: 11, categoryId: 'teatro', contentId: 'teatro-4', type: 'parteciperò', timestamp: '2026-09-12T20:15:00Z' },
  { id: 'int-9', userId: 17, categoryId: 'arti-visive', contentId: 'arte-2', type: 'mi_piace', timestamp: '2026-09-11T11:00:00Z' },
  { id: 'int-10', userId: 1, categoryId: 'arti-visive', contentId: 'arte-4', type: 'parteciperò', timestamp: '2026-09-13T10:45:00Z' },
  { id: 'int-11', userId: 11, categoryId: 'danza', contentId: 'danza-1', type: 'parteciperò', timestamp: '2026-09-14T18:00:00Z' },
  { id: 'int-12', userId: 2, categoryId: 'danza', contentId: 'danza-3', type: 'mi_piace', timestamp: '2026-09-10T22:10:00Z' },
  { id: 'int-13', userId: 2, categoryId: 'podcast', contentId: 'podcast-2', type: 'mi_piace', timestamp: '2026-09-09T08:30:00Z' },
  { id: 'int-14', userId: 20, categoryId: 'podcast', contentId: 'podcast-5', type: 'mi_piace', timestamp: '2026-09-13T07:50:00Z' },
  { id: 'int-15', userId: 1, categoryId: 'fotografia', contentId: 'foto-1', type: 'mi_piace', timestamp: '2026-09-12T16:25:00Z' },
  { id: 'int-16', userId: 3, categoryId: 'fotografia', contentId: 'foto-4', type: 'parteciperò', timestamp: '2026-09-14T09:00:00Z' },
];
