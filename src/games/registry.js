import { lazy } from 'react';

// Famiglie dei minigiochi del mondo Bambini: ognuna raggruppa giochi con la
// stessa "forma" tecnica (stesso motore o stesso tipo di loop), non lo stesso
// tema.
export const MINIGAME_FAMILIES = [
  { id: 'quiz', label: 'Domanda e risposta' },
  { id: 'logica', label: 'Logica a turni' },
  { id: 'arcade', label: 'Arcade in tempo reale' },
  { id: 'sociale', label: 'Sociale/gruppo' },
];

// Registro dei minigiochi: da qui si genera la lista nella UI del mondo
// Bambini (vedi BambiniGames.jsx). Ogni voce: id, nome, famiglia (uno degli
// id di MINIGAME_FAMILIES), fasciaEtaMinima, meccanica (descrizione breve) e
// Component. Component è caricato solo quando il gioco viene aperto (lazy),
// così aggiungere un gioco non appesantisce chi non lo apre.
export const MINIGAMES = [
  {
    id: 'quiz-lampo',
    nome: 'Quiz lampo',
    famiglia: 'quiz',
    fasciaEtaMinima: 6,
    meccanica: 'Trivia veloce a tempo, risposta a scelta multipla',
    Component: lazy(() => import('./quiz/QuizLampo.jsx')),
  },
];
