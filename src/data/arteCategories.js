// Dati finti per le categorie del mondo Arte & Musica. Nessun backend: servono
// solo a mostrare come funzionerà la ricerca a due colonne con filtro per
// sottofamiglia/genere. Tassonomia a due livelli: categoria -> sottofamiglia.
export const ARTE_CATEGORIES = [
  {
    id: 'libreria',
    label: 'Libreria',
    icon: '📚',
    anchor: { lat: 35, lng: -20 },
    aliases: ['libreria', 'libri', 'libro', 'biblioteca', 'lettura'],
    subfamilies: ['Romanzo', "Romanzo d'esordio", 'Poesia', 'Saggistica', 'Fumetti/Graphic novel', 'Antologia'],
  },
  {
    id: 'musica',
    label: 'Musica',
    icon: '🎵',
    anchor: { lat: -15, lng: 130 },
    aliases: ['musica', 'music', 'canzoni', 'canzone', 'brani'],
    subfamilies: ['Rock', 'Pop', 'Jazz', 'Hip-hop', 'Classica', 'Elettronica'],
  },
  {
    id: 'cinema',
    label: 'Cinema',
    icon: '🎬',
    anchor: { lat: 10, lng: 40 },
    aliases: ['cinema', 'film', 'filmato', 'movie', 'cortometraggio'],
    subfamilies: ['Commedia', 'Drammatico', 'Horror', 'Documentario', 'Animazione'],
  },
  {
    id: 'teatro',
    label: 'Teatro',
    icon: '🎭',
    anchor: { lat: 45, lng: -70 },
    aliases: ['teatro', 'theatre', 'spettacolo', 'commedia teatrale'],
    subfamilies: ['Prosa', 'Musical', 'Improvvisazione', 'Sperimentale'],
  },
  {
    id: 'arti-visive',
    label: 'Arte',
    icon: '🎨',
    anchor: { lat: -30, lng: -55 },
    aliases: ['arte', 'art', 'pittura', 'mostra', 'galleria'],
    subfamilies: ['Pittura', 'Fotografia', 'Scultura', 'Street Art'],
  },
];

// Trova la categoria il cui alias combacia (anche parzialmente) con la query digitata.
export function resolveCategoryQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = ARTE_CATEGORIES.find((c) => c.aliases.includes(q));
  if (exact) return exact;
  return ARTE_CATEGORIES.find((c) => c.aliases.some((a) => a.startsWith(q))) ?? null;
}

export const FEATURED_SEARCHES = {
  libreria: ['Fantascienza italiana', 'Poesia contemporanea', 'Saggistica storica', "Romanzi d'esordio", 'Fumetti indipendenti', 'Autori emergenti'],
  musica: ['Indie italiano', 'Musica elettronica', 'Jazz emergente', 'Cantautorato', 'Producer da scoprire', 'Band esordienti'],
  cinema: ['Cortometraggi', "Cinema d'autore", 'Documentari', 'Registi esordienti', 'Sceneggiature originali', 'Cinema indipendente'],
  teatro: ['Teatro civile', 'Compagnie indipendenti', 'Teatro-danza', 'Testi contemporanei', 'Improvvisazione teatrale'],
  'arti-visive': ['Arte urbana', 'Fotografia analogica', 'Giovani artisti', 'Installazioni', 'Arte digitale'],
};

// Ogni contenuto ha: categoria, sottofamiglia, titolo, autore/artista, anno,
// descrizione breve, media (placeholder), tag liberi.
export const CATEGORY_RESULTS = {
  libreria: [
    { id: 'libreria-1', title: 'Le città sospese', creator: 'Marta Ferrando', year: 2025, subfamily: 'Romanzo', description: 'Un romanzo corale su tre città immaginarie che si sfiorano senza mai incontrarsi.', tags: ['narrativa', 'italiano'] },
    { id: 'libreria-2', title: 'Frammenti di un altrove', creator: 'Nicola Gatti', year: 2024, subfamily: 'Poesia', description: 'Raccolta di versi brevi sul senso di spaesamento nelle grandi città.', tags: ['poesia', 'contemporaneo'] },
    { id: 'libreria-3', title: 'Il peso delle onde', creator: 'Elisa Conte', year: 2025, subfamily: "Romanzo d'esordio", description: "Un'esordiente racconta un'estate al mare che cambia tutto.", tags: ['esordio', 'mare'] },
    { id: 'libreria-4', title: 'Storie di periferia', creator: 'Collettivo Inchiostro', year: 2023, subfamily: 'Antologia', description: 'Otto racconti scritti a più mani sulla vita ai margini delle città.', tags: ['antologia', 'racconti'] },
    { id: 'libreria-5', title: 'Manuale di fughe brevi', creator: 'Davide Serra', year: 2024, subfamily: 'Saggistica', description: 'Saggio leggero su come organizzare piccoli viaggi di fuga dalla routine.', tags: ['saggistica', 'viaggi'] },
    { id: 'libreria-6', title: 'Linee parallele', creator: 'Giada Rossi', year: 2025, subfamily: 'Fumetti/Graphic novel', description: 'Graphic novel autobiografica su un trasloco e una nuova città.', tags: ['fumetto', 'autobiografico'] },
  ],
  musica: [
    { id: 'musica-1', title: 'Controluce', creator: 'Sara Bianchi', year: 2025, subfamily: 'Pop', description: 'Singolo pop con testi introspettivi e arrangiamento minimale.', tags: ['pop', 'singolo'] },
    { id: 'musica-2', title: 'Notturna', creator: 'Kaleido', year: 2024, subfamily: 'Elettronica', description: 'EP di elettronica notturna, quattro tracce strumentali.', tags: ['elettronica', 'ep'] },
    { id: 'musica-3', title: 'Radici', creator: 'Trio Meridiano', year: 2023, subfamily: 'Jazz', description: 'Album jazz acustico registrato in presa diretta.', tags: ['jazz', 'acustico'] },
    { id: 'musica-4', title: 'Bassa marea', creator: 'Nuvole Basse', year: 2025, subfamily: 'Rock', description: 'Singolo rock alternativo con chitarre distorte e ritornello diretto.', tags: ['rock', 'alternativo'] },
    { id: 'musica-5', title: 'Blocco 7', creator: 'MC Fuso', year: 2024, subfamily: 'Hip-hop', description: 'Mixtape hip-hop con produzioni essenziali e testi di quartiere.', tags: ['hip-hop', 'mixtape'] },
    { id: 'musica-6', title: 'Variazioni per archi', creator: 'Ensemble Aurora', year: 2023, subfamily: 'Classica', description: 'Composizione originale per quartetto d’archi in tre movimenti.', tags: ['classica', 'archi'] },
  ],
  cinema: [
    { id: 'cinema-1', title: 'Distanze minime', creator: 'Regia di Luca Parenti', year: 2025, subfamily: 'Drammatico', description: 'Cortometraggio drammatico su due fratelli che si ritrovano dopo anni.', tags: ['drammatico', 'cortometraggio'] },
    { id: 'cinema-2', title: 'Il giardino sommerso', creator: 'Regia di Chiara Nesi', year: 2024, subfamily: 'Animazione', description: 'Cortometraggio d’animazione su un giardino che riappare ogni cento anni.', tags: ['animazione'] },
    { id: 'cinema-3', title: 'Voci fuori campo', creator: 'Regia di Omar Dris', year: 2024, subfamily: 'Documentario', description: 'Documentario su un condominio popolare raccontato dai suoi abitanti.', tags: ['documentario'] },
    { id: 'cinema-4', title: 'Ultimo turno', creator: 'Regia di Giulia Farina', year: 2025, subfamily: 'Commedia', description: 'Commedia notturna ambientata in un bar aperto h24.', tags: ['commedia'] },
    { id: 'cinema-5', title: 'Non guardare indietro', creator: 'Regia di Paolo Amoruso', year: 2023, subfamily: 'Horror', description: 'Cortometraggio horror psicologico girato in un unico piano sequenza.', tags: ['horror'] },
  ],
  teatro: [
    { id: 'teatro-1', title: 'Le stanze vuote', creator: 'Compagnia Ombra Corta', year: 2025, subfamily: 'Prosa', description: 'Testo di prosa contemporanea su una famiglia che svuota una vecchia casa.', tags: ['prosa', 'famiglia'] },
    { id: 'teatro-2', title: 'Note a margine', creator: 'Collettivo Scena Aperta', year: 2024, subfamily: 'Musical', description: 'Piccolo musical indipendente su un gruppo di amici in una band scolastica.', tags: ['musical'] },
    { id: 'teatro-3', title: 'Improvvisamente', creator: 'Improteatro Milano', year: 2025, subfamily: 'Improvvisazione', description: 'Serata di improvvisazione teatrale a tema libero con il pubblico.', tags: ['improvvisazione'] },
    { id: 'teatro-4', title: 'Corpi in transito', creator: 'Compagnia Frontiera', year: 2023, subfamily: 'Sperimentale', description: 'Spettacolo sperimentale che unisce teatro fisico e proiezioni video.', tags: ['sperimentale', 'teatro-danza'] },
    { id: 'teatro-5', title: 'Due sedie', creator: 'Marco Selvi e Anna Torelli', year: 2024, subfamily: 'Prosa', description: 'Dialogo teatrale a due voci su un incontro casuale in sala d’attesa.', tags: ['prosa', 'dialogo'] },
  ],
  'arti-visive': [
    { id: 'arte-1', title: 'Superfici', creator: 'Nadia Colombo', year: 2025, subfamily: 'Pittura', description: 'Serie di dipinti a olio su texture urbane e muri scrostati.', tags: ['pittura', 'urbano'] },
    { id: 'arte-2', title: 'Ore blu', creator: 'Ferran Costa', year: 2024, subfamily: 'Fotografia', description: 'Serie fotografica scattata nell’ora blu in cinque città diverse.', tags: ['fotografia'] },
    { id: 'arte-3', title: 'Radice', creator: 'Studio Terracotta', year: 2023, subfamily: 'Scultura', description: 'Scultura in ceramica ispirata a forme organiche e radici.', tags: ['scultura', 'ceramica'] },
    { id: 'arte-4', title: 'Voci di quartiere', creator: 'Kass', year: 2025, subfamily: 'Street Art', description: 'Murale collettivo realizzato con gli abitanti di un quartiere periferico.', tags: ['street art', 'murale'] },
    { id: 'arte-5', title: 'Interni', creator: 'Bea Lombardi', year: 2024, subfamily: 'Pittura', description: 'Piccoli dipinti a tempera su interni domestici deserti.', tags: ['pittura', 'interni'] },
  ],
};
