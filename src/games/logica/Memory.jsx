import { useState } from 'react';
import './Memory.css';

const EMOJIS = ['🐶', '🐱', '🐵', '🦊', '🐸', '🐧', '🦁', '🐨', '🐰', '🐼', '🐯', '🐮'];

// Livello: quante coppie di carte ci sono (più coppie = griglia più grande
// da tenere a mente = più difficile).
const SETTINGS = {
  facile: { pairs: 6, cols: 4, cell: 56 },
  medio: { pairs: 8, cols: 4, cell: 56 },
  difficile: { pairs: 12, cols: 6, cell: 44 },
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(pairs) {
  const symbols = EMOJIS.slice(0, pairs);
  return shuffle([...symbols, ...symbols]).map((symbol, i) => ({ id: i, symbol }));
}

// Famiglia 2: carte abbinate, da solo (punteggio in base ai tentativi) o in
// 2 giocatori locali a turni (vince chi trova più coppie).
export default function Memory({ onFinish, difficulty = 'medio' }) {
  const { pairs, cols, cell } = SETTINGS[difficulty] ?? SETTINGS.medio;
  const [mode, setMode] = useState(null); // null | 'solo' | '2p'
  const [deck] = useState(() => buildDeck(pairs)); // fissato all'avvio della partita
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [busy, setBusy] = useState(false);

  const finishGame = (finalMoves, finalScores) => {
    if (mode === 'solo') {
      const score = Math.max(0, pairs * 30 - finalMoves * 10);
      onFinish(score, { detail: `${finalMoves} tentativi per trovare tutte le coppie` });
    } else {
      const winnerIdx = finalScores[0] === finalScores[1] ? null : finalScores[0] > finalScores[1] ? 0 : 1;
      const detail = winnerIdx === null
        ? 'Pareggio!'
        : `Vince il giocatore ${winnerIdx + 1} (${finalScores[winnerIdx]} coppie contro ${finalScores[1 - winnerIdx]})`;
      onFinish(100, { detail });
    }
  };

  const handleFlip = (i) => {
    if (busy || flipped.includes(i) || matched.includes(i)) return;
    const nextFlipped = [...flipped, i];
    setFlipped(nextFlipped);
    if (nextFlipped.length < 2) return;

    setBusy(true);
    const [a, b] = nextFlipped;
    const isMatch = deck[a].symbol === deck[b].symbol;
    const newMoves = moves + 1;
    setMoves(newMoves);

    if (isMatch) {
      const newMatched = [...matched, a, b];
      const newScores = mode === '2p' ? scores.map((s, idx) => (idx === turn ? s + 1 : s)) : scores;
      setTimeout(() => {
        setMatched(newMatched);
        setFlipped([]);
        setScores(newScores);
        setBusy(false);
        if (newMatched.length === deck.length) finishGame(newMoves, newScores);
      }, 500);
    } else {
      setTimeout(() => {
        setFlipped([]);
        setBusy(false);
        if (mode === '2p') setTurn((t) => 1 - t);
      }, 800);
    }
  };

  if (!mode) {
    return (
      <div className="rb-memory-setup">
        <p>Scegli come giocare:</p>
        <button type="button" className="rb-memory-mode-btn" onClick={() => setMode('solo')}>
          Da solo
        </button>
        <button type="button" className="rb-memory-mode-btn" onClick={() => setMode('2p')}>
          2 giocatori locali
        </button>
      </div>
    );
  }

  return (
    <div className="rb-memory">
      <p className="rb-memory-status">
        {mode === 'solo' ? `Tentativi: ${moves}` : `Turno: giocatore ${turn + 1} · ${scores[0]} - ${scores[1]}`}
      </p>
      <div className="rb-memory-grid" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)` }}>
        {deck.map((card, i) => {
          const isVisible = flipped.includes(i) || matched.includes(i);
          return (
            <button
              key={card.id}
              type="button"
              className={`rb-memory-card ${isVisible ? 'flipped' : ''}`}
              style={{ width: cell, height: cell, fontSize: Math.round(cell * 0.42) }}
              onClick={() => handleFlip(i)}
              aria-disabled={isVisible}
            >
              {isVisible ? card.symbol : '❔'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
