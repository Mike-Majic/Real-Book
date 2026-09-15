// Configurazione dei "mondi" del mappamondo interattivo.
// L'ordine è quello dello swipe a due dita: social -> incontri -> lavoro -> arte -> (torna a social)
export const WORLDS = [
  {
    id: 'social',
    label: 'Social',
    tagline: 'Il tuo mondo, stile Instagram',
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
    color: '#2b2b33',
    colorSoft: 'rgba(43, 43, 51, 0.12)',
    globeColor: '#eef0f3',
    atmosphereColor: '#c9ccd4',
    textOnGlobe: '#14151a',
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
