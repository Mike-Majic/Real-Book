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
  {
    id: 'danza',
    label: 'Danza',
    icon: '💃',
    anchor: { lat: 55, lng: 25 },
    aliases: ['danza', 'dance', 'ballo', 'coreografia'],
    subfamilies: ['Contemporanea', 'Classica', 'Hip-hop', 'Improvvisazione', 'Performance'],
  },
  {
    id: 'podcast',
    label: 'Podcast',
    icon: '🎙️',
    anchor: { lat: -45, lng: 145 },
    aliases: ['podcast', 'audio', 'puntata', 'episodio'],
    subfamilies: ['Narrativo', 'Intervista', 'True crime', 'Attualità', 'Comico'],
  },
  {
    id: 'fotografia',
    label: 'Fotografia',
    icon: '📷',
    anchor: { lat: 5, lng: -100 },
    aliases: ['fotografia', 'foto', 'fotografico', 'scatto', 'photography'],
    subfamilies: ['Ritratto', 'Reportage', 'Analogica', 'Still life', 'Paesaggio'],
  },
  {
    id: 'live',
    label: 'Live',
    icon: '🎤',
    anchor: { lat: -60, lng: 0 },
    aliases: ['live', 'concerto', 'concerti', 'dal vivo', 'dj set'],
    subfamilies: ['Concerti', 'DJ set', 'Reading dal vivo', 'Session acustiche', 'Festival'],
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
  danza: ['Danza contemporanea', 'Coreografi emergenti', 'Hip-hop urbano', 'Performance site-specific', 'Compagnie indipendenti'],
  podcast: ['True crime italiano', 'Interviste indipendenti', 'Podcast narrativi', 'Attualità e società', 'Podcast comici'],
  fotografia: ['Fotografia di strada', 'Reportage sociale', 'Analogica e pellicola', 'Ritratti in bianco e nero', 'Paesaggi urbani'],
  live: ['Concerti indipendenti', 'DJ set emergenti', 'Reading dal vivo', 'Session acustiche', 'Festival di quartiere'],
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
  danza: [
    { id: 'danza-1', title: 'Linee sospese', creator: 'Compagnia Vento Obliquo', year: 2025, subfamily: 'Contemporanea', description: 'Assolo di danza contemporanea su musica elettronica dal vivo.', tags: ['contemporanea', 'assolo'] },
    { id: 'danza-2', title: 'Passo doppio', creator: 'Elena Marchi e Toni Russo', year: 2024, subfamily: 'Classica', description: 'Pas de deux ispirato al repertorio classico con innesti moderni.', tags: ['classica', 'duo'] },
    { id: 'danza-3', title: 'Blocco B', creator: 'Crew Asfalto', year: 2025, subfamily: 'Hip-hop', description: 'Coreografia di crew hip-hop urbana girata in un parcheggio.', tags: ['hip-hop', 'crew'] },
    { id: 'danza-4', title: 'Senza spartito', creator: 'Collettivo Riva', year: 2023, subfamily: 'Improvvisazione', description: 'Sessione di improvvisazione a contatto tra quattro danzatori.', tags: ['improvvisazione'] },
    { id: 'danza-5', title: 'Cortile', creator: 'Studio Perimetro', year: 2024, subfamily: 'Performance', description: 'Performance site-specific realizzata in un cortile condominiale.', tags: ['performance', 'site-specific'] },
  ],
  podcast: [
    { id: 'podcast-1', title: 'Il caso della villa chiusa', creator: 'Voci di Confine', year: 2025, subfamily: 'True crime', description: 'Serie true crime in cinque puntate su un caso irrisolto degli anni novanta.', tags: ['true crime', 'serie'] },
    { id: 'podcast-2', title: 'Due sedie e un microfono', creator: 'Radio Bassa Voce', year: 2024, subfamily: 'Intervista', description: 'Interviste lunghe e senza fretta a persone comuni con storie fuori dal comune.', tags: ['intervista'] },
    { id: 'podcast-3', title: 'Cronache di quartiere', creator: 'Redazione Aperta', year: 2025, subfamily: 'Attualità', description: 'Rassegna settimanale di attualità raccontata da chi vive i quartieri.', tags: ['attualità', 'settimanale'] },
    { id: 'podcast-4', title: 'Tre minuti di ritardo', creator: 'Nico e Fede', year: 2024, subfamily: 'Comico', description: 'Podcast comico su piccoli disastri quotidiani, episodi brevi.', tags: ['comico', 'breve'] },
    { id: 'podcast-5', title: 'La stanza accanto', creator: 'Ilaria Petrucci', year: 2023, subfamily: 'Narrativo', description: 'Fiction audio a puntate ambientata in un condominio di provincia.', tags: ['narrativo', 'fiction'] },
  ],
  fotografia: [
    { id: 'foto-1', title: 'Angoli ciechi', creator: 'Renzo Ialenti', year: 2025, subfamily: 'Reportage', description: 'Reportage su mestieri quasi scomparsi nei centri storici italiani.', tags: ['reportage'] },
    { id: 'foto-2', title: 'Controcampo', creator: 'Marika Sole', year: 2024, subfamily: 'Ritratto', description: 'Serie di ritratti in bianco e nero a giovani atleti dilettanti.', tags: ['ritratto', 'bianco e nero'] },
    { id: 'foto-3', title: 'Rullino 14', creator: 'Filippo Marra', year: 2023, subfamily: 'Analogica', description: 'Rullino sviluppato a mano, scatti di viaggio non pianificati.', tags: ['analogica', 'viaggio'] },
    { id: 'foto-4', title: 'Tavola imbandita', creator: 'Chiara Vezzosi', year: 2025, subfamily: 'Still life', description: 'Still life minimalisti su oggetti domestici di uso quotidiano.', tags: ['still life'] },
    { id: 'foto-5', title: 'Linee di città', creator: 'Omar Testa', year: 2024, subfamily: 'Paesaggio', description: 'Paesaggi urbani all’alba in cinque città europee diverse.', tags: ['paesaggio', 'urbano'] },
  ],
  live: [
    { id: 'live-a1', title: 'Notte al Forte', creator: 'Collettivo Suono Vivo', year: 2025, subfamily: 'Concerti', description: 'Concerto indipendente in un forte storico riadattato a spazio culturale.', tags: ['concerto', 'indipendente'] },
    { id: 'live-a2', title: 'Deriva Set', creator: 'DJ Mara Volt', year: 2024, subfamily: 'DJ set', description: 'Set elettronico dal vivo registrato durante un festival estivo.', tags: ['dj set', 'elettronica'] },
    { id: 'live-a3', title: 'Parole a Voce Alta', creator: 'Collettivo Inchiostro Vivo', year: 2025, subfamily: 'Reading dal vivo', description: 'Serata di reading poetico dal vivo con accompagnamento musicale.', tags: ['reading', 'poesia'] },
    { id: 'live-a4', title: 'Acustico in Cortile', creator: 'Nina Ferraro', year: 2024, subfamily: 'Session acustiche', description: 'Session acustica intima registrata in un cortile condominiale.', tags: ['acustico', 'intimo'] },
    { id: 'live-a5', title: 'Festival delle Piccole Etichette', creator: 'Rete Indie Records', year: 2023, subfamily: 'Festival', description: 'Festival di due giorni dedicato a etichette discografiche indipendenti.', tags: ['festival', 'indie'] },
  ],
};
