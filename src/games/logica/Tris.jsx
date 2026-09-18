import { useEffect, useState } from 'react';
import './Tris.css';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function checkWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 'draw' : null;
}

function freeCells(board) {
  return board.map((v, i) => (v ? null : i)).filter((v) => v !== null);
}

// CPU "medio": vince se può, blocca l'avversario se serve, altrimenti
// preferisce il centro, poi gli angoli, altrimenti una casella a caso.
function cpuMoveMedio(board, cpuSymbol, humanSymbol) {
  const tryEach = (symbol) => {
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      const b = [...board];
      b[i] = symbol;
      if (checkWinner(b) === symbol) return i;
    }
    return -1;
  };
  let move = tryEach(cpuSymbol);
  if (move === -1) move = tryEach(humanSymbol);
  if (move === -1 && !board[4]) move = 4;
  if (move === -1) {
    const corners = [0, 2, 6, 8].filter((i) => !board[i]);
    if (corners.length) move = corners[Math.floor(Math.random() * corners.length)];
  }
  if (move === -1) {
    const free = freeCells(board);
    move = free[Math.floor(Math.random() * free.length)];
  }
  return move;
}

// CPU "difficile": minimax con gioco perfetto — non perde mai, vince ogni
// errore dell'avversario. Sulla griglia 3x3 (al massimo 9 mosse) esplorare
// tutto l'albero è istantaneo, nessun bisogno di potatura alpha-beta.
function minimaxScore(board, isCpuTurn, cpuSymbol, humanSymbol) {
  const winner = checkWinner(board);
  if (winner === cpuSymbol) return 10;
  if (winner === humanSymbol) return -10;
  if (winner === 'draw') return 0;

  const symbol = isCpuTurn ? cpuSymbol : humanSymbol;
  const scores = freeCells(board).map((i) => {
    const b = [...board];
    b[i] = symbol;
    return minimaxScore(b, !isCpuTurn, cpuSymbol, humanSymbol);
  });
  return isCpuTurn ? Math.max(...scores) : Math.min(...scores);
}

function cpuMoveDifficile(board, cpuSymbol, humanSymbol) {
  let best = { index: -1, score: -Infinity };
  for (const i of freeCells(board)) {
    const b = [...board];
    b[i] = cpuSymbol;
    const score = minimaxScore(b, false, cpuSymbol, humanSymbol);
    if (score > best.score) best = { index: i, score };
  }
  return best.index;
}

function cpuMove(board, cpuSymbol, humanSymbol, difficulty) {
  if (difficulty === 'facile') {
    const free = freeCells(board);
    return free[Math.floor(Math.random() * free.length)];
  }
  if (difficulty === 'difficile') return cpuMoveDifficile(board, cpuSymbol, humanSymbol);
  return cpuMoveMedio(board, cpuSymbol, humanSymbol);
}

// Famiglia 2 (logica a turni/griglia): 2 giocatori locali o contro una CPU
// semplice, nessun timer, stato locale immutabile a ogni mossa.
export default function Tris({ onFinish, difficulty = 'medio' }) {
  const [mode, setMode] = useState(null); // null | '2p' | 'cpu'
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X');
  const [winner, setWinner] = useState(null);

  const playAt = (i) => {
    if (board[i] || winner) return;
    const next = [...board];
    next[i] = turn;
    setBoard(next);
    const w = checkWinner(next);
    if (w) {
      setWinner(w);
      setTimeout(() => {
        if (mode === 'cpu') {
          const score = w === 'draw' ? 50 : w === 'X' ? 100 : 0;
          const detail = w === 'draw' ? 'Pareggio!' : w === 'X' ? 'Hai vinto tu!' : 'Ha vinto il computer.';
          onFinish(score, { detail });
        } else {
          onFinish(100, { detail: w === 'draw' ? 'Pareggio!' : `Ha vinto il giocatore ${w}!` });
        }
      }, 900);
    } else {
      setTurn((t) => (t === 'X' ? 'O' : 'X'));
    }
  };

  // Mossa della CPU quando tocca a "O".
  useEffect(() => {
    if (mode !== 'cpu' || winner || turn !== 'O') return undefined;
    const t = setTimeout(() => {
      const move = cpuMove(board, 'O', 'X', difficulty);
      if (move !== undefined && move !== -1) playAt(move);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turn, board, winner]);

  if (!mode) {
    return (
      <div className="rb-tris-setup">
        <p>Scegli come giocare:</p>
        <button type="button" className="rb-tris-mode-btn" onClick={() => setMode('2p')}>
          2 giocatori locali
        </button>
        <button type="button" className="rb-tris-mode-btn" onClick={() => setMode('cpu')}>
          Contro il computer
        </button>
      </div>
    );
  }

  return (
    <div className="rb-tris">
      <p className="rb-tris-status">
        {winner ? (winner === 'draw' ? 'Pareggio!' : `Vince ${winner}!`) : `Turno: ${turn}`}
      </p>
      <div className="rb-tris-grid">
        {board.map((v, i) => (
          <button
            key={i}
            type="button"
            className={`rb-tris-cell ${v ? `filled-${v}` : ''}`}
            onClick={() => playAt(i)}
            disabled={!!v || !!winner || (mode === 'cpu' && turn === 'O')}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
