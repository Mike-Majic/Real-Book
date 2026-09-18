import { useEffect, useRef, useState } from 'react';
import PlayerSetup from './PlayerSetup';
import './DisegnaIndovina.css';

// Livello: parole facili da disegnare (oggetti semplici e riconoscibili) a
// via via più difficili (azioni ed emozioni, molto meno dirette da rendere
// con un disegno).
const WORDS_BY_DIFFICULTY = {
  facile: ['cane', 'gatto', 'sole', 'casa', 'pallone', 'pesce', 'fiore', 'stella', 'ombrello', 'gelato'],
  medio: [
    'cane', 'gatto', 'sole', 'casa', 'albero', 'pallone', 'pesce', 'fiore',
    'stella', 'nuvola', 'bicicletta', 'farfalla', 'montagna', 'barca',
    'ombrello', 'gelato', 'libro', 'gufo', 'castello', 'arcobaleno',
  ],
  difficile: [
    'sorpresa', 'nuotare', 'amicizia', 'coraggio', 'inciampare', 'festeggiare',
    'addormentarsi', 'nascondino', 'terremoto', 'orchestra', 'vulcano',
    'imbarazzo', 'competizione', 'avventura', 'esploratore', 'gentilezza',
  ],
};

const ROUND_SECONDS = 60;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Famiglia 4 (sociale/gruppo): sessione locale "passa il dispositivo" — un
// disegnatore alla volta (a rotazione tra tutti i giocatori) disegna una
// parola segreta, gli altri guardano lo stesso schermo e indovinano a voce;
// alla fine del round si segna chi ha indovinato. Nessuna chat libera: solo
// le interazioni previste dal gioco (disegno + spunta di chi ha indovinato).
export default function DisegnaIndovina({ onFinish, difficulty = 'medio' }) {
  const wordsPool = WORDS_BY_DIFFICULTY[difficulty] ?? WORDS_BY_DIFFICULTY.medio;
  const [players, setPlayers] = useState(null);
  const [order, setOrder] = useState([]);
  const [round, setRound] = useState(0);
  const [words, setWords] = useState([]);
  const [phase, setPhase] = useState('handoff'); // handoff | reveal | drawing | guessResult
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [scores, setScores] = useState({});
  const [guessed, setGuessed] = useState([]);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);

  const startGame = (names) => {
    const initialScores = {};
    names.forEach((n) => { initialScores[n] = 0; });
    setPlayers(names);
    setOrder(shuffle(names.map((_, i) => i)));
    setWords(shuffle(wordsPool));
    setScores(initialScores);
    setRound(0);
    setGuessed([]);
    setPhase('handoff');
  };

  const artist = players ? players[order[round]] : null;
  const others = players ? players.filter((p) => p !== artist) : [];
  const word = words[round % words.length];

  useEffect(() => {
    if (phase !== 'drawing') return undefined;
    if (timeLeft <= 0) {
      setPhase('guessResult');
      return undefined;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  useEffect(() => {
    if (phase !== 'drawing') return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [phase, round]);

  const pointerPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    drawingRef.current = true;
    lastPointRef.current = pointerPos(e);
  };

  const onPointerMove = (e) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const p = pointerPos(e);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
  };

  const onPointerUp = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const toggleGuessed = (name) => {
    setGuessed((g) => (g.includes(name) ? g.filter((n) => n !== name) : [...g, name]));
  };

  const confirmRound = () => {
    const newScores = { ...scores };
    guessed.forEach((name) => { newScores[name] = (newScores[name] || 0) + 1; });
    setScores(newScores);

    if (round + 1 >= order.length) {
      const ranking = Object.entries(newScores).sort((a, b) => b[1] - a[1]);
      const detail = ranking.map(([n, s]) => `${n}: ${s}`).join(' · ');
      onFinish(ranking[0]?.[1] ?? 0, { detail: `Punti indovinati: ${detail}` });
    } else {
      setRound((r) => r + 1);
      setGuessed([]);
      setPhase('handoff');
      setTimeLeft(ROUND_SECONDS);
    }
  };

  if (!players) {
    return <PlayerSetup minPlayers={3} maxPlayers={8} onReady={startGame} />;
  }

  if (phase === 'handoff') {
    return (
      <div className="rb-disegna-phase">
        <p className="rb-disegna-big">Passa il dispositivo a</p>
        <p className="rb-disegna-artist">{artist}</p>
        <p className="rb-disegna-hint">Gli altri non guardino lo schermo finché non tocca a loro disegnare!</p>
        <button type="button" className="rb-disegna-btn" onClick={() => setPhase('reveal')}>
          Ho capito, tocca a me
        </button>
      </div>
    );
  }

  if (phase === 'reveal') {
    return (
      <div className="rb-disegna-phase">
        <p className="rb-disegna-hint">La tua parola da disegnare:</p>
        <p className="rb-disegna-word">{word}</p>
        <button type="button" className="rb-disegna-btn" onClick={() => setPhase('drawing')}>
          Inizia a disegnare
        </button>
      </div>
    );
  }

  if (phase === 'drawing') {
    return (
      <div className="rb-disegna-drawing">
        <div className="rb-disegna-topbar">
          <span>{artist} disegna: {word}</span>
          <span className="rb-disegna-timer">{timeLeft}s</span>
        </div>
        <canvas
          ref={canvasRef}
          width={280}
          height={220}
          className="rb-disegna-canvas"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        <div className="rb-disegna-drawing-actions">
          <button type="button" onClick={clearCanvas}>Cancella</button>
          <button type="button" className="rb-disegna-btn" onClick={() => setPhase('guessResult')}>
            Ho finito
          </button>
        </div>
      </div>
    );
  }

  // guessResult
  return (
    <div className="rb-disegna-phase">
      <p className="rb-disegna-hint">La parola era:</p>
      <p className="rb-disegna-word">{word}</p>
      <p className="rb-disegna-hint">Chi ha indovinato?</p>
      <div className="rb-disegna-guess-list">
        {others.map((name) => (
          <button
            key={name}
            type="button"
            className={`rb-disegna-guess-chip ${guessed.includes(name) ? 'active' : ''}`}
            onClick={() => toggleGuessed(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <button type="button" className="rb-disegna-btn" onClick={confirmRound}>
        {round + 1 >= order.length ? 'Vedi la classifica finale' : 'Prossimo turno'}
      </button>
    </div>
  );
}
