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
  {
    id: 'indovina-canzone',
    nome: 'Indovina la canzone',
    famiglia: 'quiz',
    fasciaEtaMinima: 6,
    meccanica: 'Ascolta un’anteprima musicale e indovina il titolo tra 4 opzioni',
    Component: lazy(() => import('./quiz/IndovinaCanzone.jsx')),
  },
  {
    id: 'tris',
    nome: 'Tris',
    famiglia: 'logica',
    fasciaEtaMinima: 5,
    meccanica: '2 giocatori locali o contro una CPU semplice',
    Component: lazy(() => import('./logica/Tris.jsx')),
  },
  {
    id: 'memory',
    nome: 'Memory',
    famiglia: 'logica',
    fasciaEtaMinima: 4,
    meccanica: 'Carte abbinate, da solo o in 2 giocatori locali',
    Component: lazy(() => import('./logica/Memory.jsx')),
  },
  {
    id: 'puzzle-scorrevole',
    nome: 'Puzzle scorrevole',
    famiglia: 'logica',
    fasciaEtaMinima: 6,
    meccanica: 'Rimetti in ordine i numeri facendo scorrere le tessere',
    Component: lazy(() => import('./logica/PuzzleScorrevole.jsx')),
  },
  {
    id: 'snake',
    nome: 'Snake',
    famiglia: 'arcade',
    fasciaEtaMinima: 6,
    meccanica: 'Arcade classico: mangia i frutti ed evita muri e coda',
    Component: lazy(() => import('./arcade/Snake.jsx')),
  },
  {
    id: 'corsa-spara',
    nome: 'Corsa e spara retrò',
    famiglia: 'arcade',
    fasciaEtaMinima: 7,
    meccanica: 'Cambia corsia ed elimina i droni prima che ti raggiungano',
    Component: lazy(() => import('./arcade/CorsaSpara.jsx')),
  },
  {
    id: 'torre-blocchi',
    nome: 'Torre di blocchi',
    famiglia: 'arcade',
    fasciaEtaMinima: 5,
    meccanica: 'Impila blocchi in equilibrio, un tocco alla volta',
    Component: lazy(() => import('./arcade/TorreBlocchi.jsx')),
  },
  {
    id: 'disegna-indovina',
    nome: 'Disegna e indovina',
    famiglia: 'sociale',
    fasciaEtaMinima: 6,
    meccanica: 'A turni, uno disegna una parola e gli altri indovinano a voce',
    Component: lazy(() => import('./sociale/DisegnaIndovina.jsx')),
  },
  {
    id: 'chi-e-piu-probabile',
    nome: 'Chi è più probabile che...',
    famiglia: 'sociale',
    fasciaEtaMinima: 6,
    meccanica: 'Party game di votazione a rotazione, passando il dispositivo',
    Component: lazy(() => import('./sociale/ChiEPiuProbabile.jsx')),
  },
];
