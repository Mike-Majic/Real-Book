// Dati finti per le categorie del mondo Arte & Musica (Libreria, Musica, Cinema).
// Nessun backend: servono solo a mostrare come funzionerà la ricerca a due colonne.
export const ARTE_CATEGORIES = [
  { id: 'libreria', label: 'Libreria', icon: '📚' },
  { id: 'musica', label: 'Musica', icon: '🎵' },
  { id: 'cinema', label: 'Cinema', icon: '🎬' },
];

export const FEATURED_SEARCHES = {
  libreria: ['Fantascienza italiana', 'Poesia contemporanea', 'Saggistica storica', "Romanzi d'esordio", 'Fumetti indipendenti', 'Autori emergenti'],
  musica: ['Indie italiano', 'Musica elettronica', 'Jazz emergente', 'Cantautorato', 'Producer da scoprire', 'Band esordienti'],
  cinema: ["Cortometraggi", "Cinema d'autore", 'Documentari', 'Registi esordienti', 'Sceneggiature originali', 'Cinema indipendente'],
};

export const CATEGORY_RESULTS = {
  libreria: [
    { id: 1, title: 'Le città sospese', creator: 'Marta Ferrando', meta: 'Romanzo · 2025' },
    { id: 2, title: 'Frammenti di un altrove', creator: 'Nicola Gatti', meta: 'Poesia · 2024' },
    { id: 3, title: 'Il peso delle onde', creator: 'Elisa Conte', meta: "Romanzo d'esordio · 2025" },
    { id: 4, title: 'Storie di periferia', creator: 'Collettivo Inchiostro', meta: 'Antologia · 2023' },
    { id: 5, title: 'Manuale di fughe brevi', creator: 'Davide Serra', meta: 'Saggistica · 2024' },
  ],
  musica: [
    { id: 1, title: 'Controluce', creator: 'Sara Bianchi', meta: 'Cantautorato · Singolo' },
    { id: 2, title: 'Notturna', creator: 'Kaleido', meta: 'Elettronica · EP' },
    { id: 3, title: 'Radici', creator: 'Trio Meridiano', meta: 'Jazz · Album' },
    { id: 4, title: 'Bassa marea', creator: 'Nuvole Basse', meta: 'Indie rock · Singolo' },
    { id: 5, title: 'Rumore bianco', creator: 'Ines V.', meta: 'Producer · Beat tape' },
  ],
  cinema: [
    { id: 1, title: 'Distanze minime', creator: 'Regia di Luca Parenti', meta: 'Cortometraggio · 12 min' },
    { id: 2, title: 'Il giardino sommerso', creator: 'Regia di Chiara Nesi', meta: "Cinema d'autore · 94 min" },
    { id: 3, title: 'Voci fuori campo', creator: 'Regia di Omar Dris', meta: 'Documentario · 78 min' },
    { id: 4, title: 'Ultimo turno', creator: 'Regia di Giulia Farina', meta: 'Cortometraggio · 18 min' },
    { id: 5, title: 'Sceneggiatura: Controvento', creator: 'di Paolo Amoruso', meta: 'Sceneggiatura originale' },
  ],
};
