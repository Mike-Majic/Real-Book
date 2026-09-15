// Dati finti per le categorie del mondo Nerd. Stessa forma di arteCategories.js
// (categoria -> sottofamiglia, ricerche in evidenza, risultati), così il
// componente condiviso CategoryColumn funziona identico per entrambi i mondi.
export const NERD_CATEGORIES = [
  {
    id: 'giochi-tavolo',
    label: 'Giochi da tavolo & carte',
    icon: '🎲',
    anchor: { lat: 40, lng: 0 },
    aliases: ['giochi da tavolo', 'giochi di carte', 'boardgame', 'board game', 'carte collezionabili'],
    subfamilies: ['Strategici', 'Party game', 'Carte collezionabili', 'Cooperativi', 'Giochi di ruolo da tavolo'],
  },
  {
    id: 'gaming-pc',
    label: 'Gaming PC',
    icon: '🖥️',
    anchor: { lat: -20, lng: -60 },
    aliases: ['gaming pc', 'pc gaming', 'steam'],
    subfamilies: ['FPS', 'RPG', 'Strategia', 'Simulazione', 'Indie'],
  },
  {
    id: 'gaming-ps',
    label: 'Gaming PS',
    icon: '🎮',
    anchor: { lat: 20, lng: 100 },
    aliases: ['gaming ps', 'playstation', 'ps5', 'ps4'],
    subfamilies: ['Esclusive PlayStation', 'Azione/Avventura', 'Sportivi', 'Multiplayer online', 'Retrocompatibili'],
  },
  {
    id: 'gaming-xbox',
    label: 'Gaming XBOX',
    icon: '🕹️',
    anchor: { lat: -40, lng: 20 },
    aliases: ['gaming xbox', 'xbox', 'game pass'],
    subfamilies: ['Esclusive Xbox', 'Game Pass', 'Sparatutto', 'Sportivi', 'Co-op'],
  },
  {
    id: 'cosplay',
    label: 'Cosplay',
    icon: '🦸',
    anchor: { lat: 60, lng: -100 },
    aliases: ['cosplay', 'costume', 'cosplayer'],
    subfamilies: ['Anime/Manga', 'Videogiochi', 'Fumetti/Comics', 'Armor building', 'Prop making'],
  },
  {
    id: 'streaming',
    label: 'Streaming & Content creation',
    icon: '🎥',
    anchor: { lat: -10, lng: -150 },
    aliases: ['streaming', 'content creation', 'content creator', 'twitch', 'youtube'],
    subfamilies: ['Live streaming', 'YouTube', 'Editing video', 'Grafica/Overlay', 'Community management'],
  },
  {
    id: 'nerd-live',
    label: 'Live',
    icon: '🏆',
    anchor: { lat: 5, lng: 60 },
    aliases: ['live', 'eventi', 'fiera', 'fiere', 'torneo', 'tornei', 'convention'],
    subfamilies: ['Fiere ed eventi', 'Tornei eSports', 'Raduni cosplay', 'Incontri con creator', 'Anteprime e presentazioni'],
  },
];

// Trova la categoria il cui alias combacia (anche parzialmente) con la query digitata.
export function resolveCategoryQuery(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = NERD_CATEGORIES.find((c) => c.aliases.includes(q));
  if (exact) return exact;
  return NERD_CATEGORIES.find((c) => c.aliases.some((a) => a.startsWith(q))) ?? null;
}

export const FEATURED_SEARCHES = {
  'giochi-tavolo': ['Giochi cooperativi', 'Party game per gruppi grandi', 'Carte collezionabili rare', 'Giochi di ruolo per principianti', 'Strategici tedeschi', 'Giochi per due'],
  'gaming-pc': ['Build economiche', 'RPG open world', 'Indie da scoprire', 'FPS competitivi', 'Simulatori realistici'],
  'gaming-ps': ['Esclusive PS5', 'Platform co-op', 'Giochi retrocompatibili', 'Multiplayer online', 'Nuove uscite PlayStation'],
  'gaming-xbox': ['Game Pass consigliati', 'Sparatutto multiplayer', 'Co-op locale', 'Serie esclusive Xbox'],
  cosplay: ['Cosplay principianti', 'Prop making fai da te', 'Costumi da videogiochi', 'Materiali economici', 'Armor in EVA foam'],
  streaming: ['Setup streaming economico', 'Crescere su Twitch', 'Editing per YouTube', 'Overlay personalizzati', 'Community building'],
  'nerd-live': ['Fiere del fumetto', 'Tornei locali', 'Raduni cosplay', 'Q&A con content creator', 'Anteprime giochi'],
};

// Ogni contenuto ha: categoria, sottofamiglia, titolo, autore/studio, anno,
// descrizione breve, tag liberi. Nomi di prodotti/studi inventati.
export const CATEGORY_RESULTS = {
  'giochi-tavolo': [
    { id: 'gdt-1', title: 'Sentieri di Brannoc', creator: 'Officina Ludica', year: 2025, subfamily: 'Strategici', description: 'Gioco di strategia territoriale per 2-4 giocatori, partite da 90 minuti.', tags: ['strategico', 'gestione risorse'] },
    { id: 'gdt-2', title: 'Caos in Cucina', creator: 'Party Games Italia', year: 2024, subfamily: 'Party game', description: 'Party game a squadre, perfetto per serate numerose.', tags: ['party', 'gruppo'] },
    { id: 'gdt-3', title: 'Arcani di Ferro TCG', creator: 'Nova Carte', year: 2023, subfamily: 'Carte collezionabili', description: 'Gioco di carte collezionabili con meccaniche di deck-building competitivo.', tags: ['tcg', 'deck building'] },
    { id: 'gdt-4', title: 'Naufraghi', creator: 'Isola Games', year: 2025, subfamily: 'Cooperativi', description: 'Sopravvivenza cooperativa su un’isola deserta, contro il tempo.', tags: ['cooperativo', 'sopravvivenza'] },
    { id: 'gdt-5', title: 'Cronache di Valdenor', creator: 'Tavola Rotonda Studio', year: 2024, subfamily: 'Giochi di ruolo da tavolo', description: 'Gioco di ruolo fantasy da tavolo con campagna modulare per principianti.', tags: ['gdr', 'fantasy'] },
  ],
  'gaming-pc': [
    { id: 'pc-1', title: 'Frammenti di Cenere', creator: 'Studio Meridian', year: 2025, subfamily: 'RPG', description: 'RPG open world con sistema di scelte morali e crafting profondo.', tags: ['rpg', 'open world'] },
    { id: 'pc-2', title: 'Zero Perimetro', creator: 'Bitforge', year: 2024, subfamily: 'FPS', description: 'FPS competitivo 5v5 con mappe verticali e abilità uniche.', tags: ['fps', 'competitivo'] },
    { id: 'pc-3', title: 'Colonie di Kestra', creator: 'Orbit Interactive', year: 2023, subfamily: 'Strategia', description: 'Strategico gestionale spaziale con costruzione di basi e diplomazia.', tags: ['strategia', 'gestionale'] },
    { id: 'pc-4', title: 'Rotta 27', creator: 'Piccolo Studio', year: 2025, subfamily: 'Indie', description: 'Platform indie narrativo con pixel art disegnata a mano.', tags: ['indie', 'platform'] },
    { id: 'pc-5', title: 'Officina Meccanica', creator: 'Gearsmith', year: 2024, subfamily: 'Simulazione', description: 'Simulatore di officina con riparazione di veicoli dettagliata.', tags: ['simulazione', 'crafting'] },
  ],
  'gaming-ps': [
    { id: 'ps-1', title: 'Ombre di Katara', creator: 'Red Lantern Studio', year: 2025, subfamily: 'Esclusive PlayStation', description: 'Action-adventure esclusivo con combattimenti cinematici e mondo aperto.', tags: ['esclusiva', 'action'] },
    { id: 'ps-2', title: 'Sentiero Spezzato', creator: 'Horizon Forge', year: 2024, subfamily: 'Azione/Avventura', description: 'Avventura narrativa post-apocalittica con esplorazione libera.', tags: ['avventura', 'narrativo'] },
    { id: 'ps-3', title: 'Rush League', creator: 'Velocity Games', year: 2023, subfamily: 'Sportivi', description: 'Simulatore di corse arcade con campionati online stagionali.', tags: ['sportivo', 'corse'] },
    { id: 'ps-4', title: 'Fronte Notturno', creator: 'Umbra Team', year: 2025, subfamily: 'Multiplayer online', description: 'Sparatutto multiplayer a squadre con stagioni competitive.', tags: ['multiplayer', 'pvp'] },
    { id: 'ps-5', title: 'Retrò Arcade Collection', creator: 'Pixel Legacy', year: 2022, subfamily: 'Retrocompatibili', description: 'Raccolta di classici arcade rimasterizzati per console moderne.', tags: ['retro', 'arcade'] },
  ],
  'gaming-xbox': [
    { id: 'xb-1', title: 'Custodi del Nord', creator: 'Frostwind Studio', year: 2025, subfamily: 'Esclusive Xbox', description: 'RPG d’azione esclusivo ambientato in un mondo nordico innevato.', tags: ['esclusiva', 'rpg'] },
    { id: 'xb-2', title: 'Passaggio Segreto', creator: 'Lumen Games', year: 2024, subfamily: 'Game Pass', description: 'Avventura puzzle disponibile al lancio su abbonamento.', tags: ['game pass', 'puzzle'] },
    { id: 'xb-3', title: 'Linea di Fuoco', creator: 'Blackout Studio', year: 2023, subfamily: 'Sparatutto', description: 'Sparatutto tattico a squadre con distruttibilità degli ambienti.', tags: ['sparatutto', 'tattico'] },
    { id: 'xb-4', title: 'Campionato Locale', creator: 'Court Games', year: 2025, subfamily: 'Sportivi', description: 'Simulatore sportivo con gestione carriera e tornei locali.', tags: ['sportivo', 'carriera'] },
    { id: 'xb-5', title: 'Spedizione Doppia', creator: 'Twin Peak Studio', year: 2024, subfamily: 'Co-op', description: 'Platform cooperativo pensato per due giocatori in split-screen.', tags: ['co-op', 'platform'] },
  ],
  cosplay: [
    { id: 'cos-1', title: 'Guida armor in EVA foam', creator: 'Chiara Ferrante', year: 2025, subfamily: 'Armor building', description: 'Tutorial passo passo per costruire un’armatura leggera in EVA foam.', tags: ['tutorial', 'armor'] },
    { id: 'cos-2', title: 'Cosplay di Lyra Nightshade', creator: 'Marco Pini', year: 2024, subfamily: 'Videogiochi', description: 'Ricostruzione dettagliata di un personaggio videoludico, con wig styling.', tags: ['videogiochi', 'wig'] },
    { id: 'cos-3', title: 'Spada runica in prop making', creator: 'Fabio Neri', year: 2023, subfamily: 'Prop making', description: 'Costruzione di una spada scenica in foam con dettagli luminosi.', tags: ['prop', 'luci'] },
    { id: 'cos-4', title: 'Cosplay da manga shonen', creator: 'Yuki Conti', year: 2025, subfamily: 'Anime/Manga', description: 'Riproduzione fedele di un costume tratto da un manga shonen popolare.', tags: ['anime', 'manga'] },
    { id: 'cos-5', title: 'Supereroina indipendente', creator: 'Sara Lombardi', year: 2024, subfamily: 'Fumetti/Comics', description: 'Costume originale ispirato ai fumetti indipendenti italiani.', tags: ['fumetti', 'originale'] },
  ],
  streaming: [
    { id: 'str-1', title: 'Setup da 300 euro', creator: 'Davide Colombo', year: 2025, subfamily: 'Live streaming', description: 'Guida a un setup di streaming economico ma efficace per iniziare.', tags: ['setup', 'principianti'] },
    { id: 'str-2', title: 'Dal caos al montaggio', creator: 'Giorgia Fabbri', year: 2024, subfamily: 'Editing video', description: 'Workflow di editing per trasformare ore di live in video da 10 minuti.', tags: ['editing', 'workflow'] },
    { id: 'str-3', title: 'Overlay minimal pack', creator: 'Studio Pixel Nero', year: 2025, subfamily: 'Grafica/Overlay', description: 'Pacchetto di overlay minimali gratuiti per streamer emergenti.', tags: ['grafica', 'overlay'] },
    { id: 'str-4', title: 'Crescere senza bot', creator: 'Community Reale', year: 2023, subfamily: 'Community management', description: 'Strategie organiche per costruire una community attiva e reale.', tags: ['community', 'crescita'] },
    { id: 'str-5', title: 'Serie documentario indie dev', creator: 'Canale Bit a Bit', year: 2024, subfamily: 'YouTube', description: 'Serie di interviste a sviluppatori indipendenti italiani.', tags: ['youtube', 'interviste'] },
  ],
  'nerd-live': [
    { id: 'live-n1', title: 'Fiera del Fumetto di Ardea', creator: 'Collettivo Nerd Lazio', year: 2025, subfamily: 'Fiere ed eventi', description: 'Due giorni di fumetti, giochi e cosplay in un centro fieristico locale.', tags: ['fiera', 'fumetti'] },
    { id: 'live-n2', title: 'Torneo Amatoriale FPS', creator: 'Lega Locale eSports', year: 2025, subfamily: 'Tornei eSports', description: 'Torneo a eliminazione diretta aperto a squadre amatoriali.', tags: ['torneo', 'esports'] },
    { id: 'live-n3', title: 'Raduno Cosplay di Primavera', creator: 'Associazione Cosplayers Uniti', year: 2024, subfamily: 'Raduni cosplay', description: 'Incontro all’aperto per cosplayer con photoshoot di gruppo.', tags: ['raduno', 'cosplay'] },
    { id: 'live-n4', title: 'Q&A con uno sviluppatore indie', creator: 'Community Bit a Bit', year: 2025, subfamily: 'Incontri con creator', description: 'Serata di domande e risposte con lo sviluppatore di un gioco indie italiano.', tags: ['creator', 'indie'] },
    { id: 'live-n5', title: 'Anteprima gioco da tavolo', creator: 'Officina Ludica', year: 2024, subfamily: 'Anteprime e presentazioni', description: 'Presentazione in anteprima di un nuovo gioco da tavolo con demo giocabile.', tags: ['anteprima', 'gdt'] },
  ],
};
