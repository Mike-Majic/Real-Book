import { useState } from 'react';
import PlayerSetup from './PlayerSetup';
import './ChiEPiuProbabile.css';

// Situazioni buffe e innocue, adatte a tutte le età: nessun tema sensibile,
// coerente con il mondo Bambini.
const PROMPTS = [
  'si addormenta guardando un film',
  'ride per primo durante un gioco',
  'vince una gara di corsa',
  'dimentica dove ha messo le sue cose',
  'canta sotto la doccia',
  'mangia l’ultimo pezzo di torta',
  'si perde anche con la mappa in mano',
  'inventa la scusa più buffa',
  'vince a un gioco da tavolo',
  'fa ridere tutti a tavola',
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROUNDS = 8;

// Famiglia 4 (sociale/gruppo): party game di votazione a rotazione, sessione
// locale "passa il dispositivo". Per ogni situazione, ogni giocatore vota (a
// turno, passandosi il telefono) chi tra il gruppo la rappresenta meglio;
// alla fine si somma chi ha ricevuto più voti in totale. Nessuna chat
// libera: solo il tocco su un nome.
export default function ChiEPiuProbabile({ onFinish }) {
  const [players, setPlayers] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [voterIndex, setVoterIndex] = useState(0);
  const [phase, setPhase] = useState('handoff'); // handoff | voting
  const [tally, setTally] = useState({});

  const startGame = (names) => {
    const initialTally = {};
    names.forEach((n) => { initialTally[n] = 0; });
    setPlayers(names);
    setPrompts(shuffle(PROMPTS).slice(0, ROUNDS));
    setTally(initialTally);
    setRoundIndex(0);
    setVoterIndex(0);
    setPhase('handoff');
  };

  const finishGame = (finalTally) => {
    const ranking = Object.entries(finalTally).sort((a, b) => b[1] - a[1]);
    const detail = ranking.map(([n, v]) => `${n}: ${v} voti`).join(' · ');
    onFinish(ranking[0]?.[1] ?? 0, { detail });
  };

  const castVote = (name) => {
    const newTally = { ...tally, [name]: (tally[name] || 0) + 1 };
    setTally(newTally);

    if (voterIndex + 1 < players.length) {
      setVoterIndex((v) => v + 1);
      setPhase('handoff');
    } else if (roundIndex + 1 < prompts.length) {
      setRoundIndex((r) => r + 1);
      setVoterIndex(0);
      setPhase('handoff');
    } else {
      finishGame(newTally);
    }
  };

  if (!players) {
    return <PlayerSetup minPlayers={3} maxPlayers={8} onReady={startGame} />;
  }

  const voter = players[voterIndex];
  const prompt = prompts[roundIndex];

  if (phase === 'handoff') {
    return (
      <div className="rb-probabile-phase">
        <p className="rb-probabile-round">Situazione {roundIndex + 1}/{prompts.length}</p>
        <p className="rb-probabile-hint">Passa il dispositivo a</p>
        <p className="rb-probabile-voter">{voter}</p>
        <button type="button" className="rb-probabile-btn" onClick={() => setPhase('voting')}>
          Pronto a votare
        </button>
      </div>
    );
  }

  return (
    <div className="rb-probabile-phase">
      <p className="rb-probabile-round">Situazione {roundIndex + 1}/{prompts.length}</p>
      <p className="rb-probabile-prompt">Chi tra voi è più probabile che… {prompt}?</p>
      <div className="rb-probabile-options">
        {players.map((name) => (
          <button key={name} type="button" className="rb-probabile-option" onClick={() => castVote(name)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
