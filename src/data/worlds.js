// Configurazione dei "mondi" del mappamondo interattivo.
// L'ordine è quello dello swipe a due dita: social -> incontri -> lavoro -> arte -> (torna a social)
export const WORLDS = [
  {
    id: 'social',
    label: 'Social',
    tagline: 'Mondo Social',
    color: '#1d9bf0',
    colorSoft: 'rgba(29, 155, 240, 0.18)',
    globeColor: '#04101f',
    atmosphereColor: '#1d9bf0',
    textOnGlobe: '#eaf6ff',
  },
  {
    id: 'incontri',
    label: 'Incontri',
    tagline: 'Conosci persone vicino a te',
    color: '#ff3860',
    colorSoft: 'rgba(255, 56, 96, 0.18)',
    globeColor: '#1f0409',
    atmosphereColor: '#ff3860',
    textOnGlobe: '#ffeaf0',
  },
  {
    id: 'lavoro',
    label: 'Lavoro',
    tagline: 'Curriculum e opportunità',
    color: '#e7eaf2',
    colorSoft: 'rgba(231, 234, 242, 0.16)',
    globeColor: '#0a0b10',
    atmosphereColor: '#e7eaf2',
    textOnGlobe: '#f5f6fa',
  },
  {
    id: 'arte',
    label: 'Arte & Musica',
    tagline: 'Musica, cinema, teatro, arte',
    color: '#8b5cf6',
    colorSoft: 'rgba(139, 92, 246, 0.18)',
    globeColor: '#120a1f',
    atmosphereColor: '#8b5cf6',
    textOnGlobe: '#f3ecff',
  },
  {
    id: 'bambini',
    label: 'Bambini',
    // Mondo ancora vuoto di proposito: niente profili/posizioni di minori sulla mappa.
    // Conterrà giochi pensati per i più piccoli, da progettare a parte.
    tagline: 'Giochi per i più piccoli — in arrivo',
    color: '#22c55e',
    colorSoft: 'rgba(34, 197, 94, 0.18)',
    globeColor: '#03130a',
    atmosphereColor: '#22c55e',
    textOnGlobe: '#e9fff2',
  },
  {
    id: 'nerd',
    label: 'Nerd',
    // Mondo vuoto: il contenuto (gaming? tech? fumetti?) va ancora deciso.
    tagline: 'Tecnologia, gaming, community — in arrivo',
    color: '#d4f634',
    colorSoft: 'rgba(212, 246, 52, 0.18)',
    globeColor: '#0c0f02',
    atmosphereColor: '#d4f634',
    textOnGlobe: '#fbffe8',
  },
];

export const JOB_CATEGORIES = [
  'Elettronica',
  'Meccanica',
  'Industriale',
  'Istruttore',
  'Edilizia',
  'Informatica / IT',
  'Logistica',
  'Ristorazione',
  'Sanità',
  'Altro',
];
