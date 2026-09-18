import { useEffect, useState } from 'react';
import './ForzaQuattro.css';

const ROWS = 6;
const COLS = 7;
const CENTER = Math.floor(COLS / 2);

function emptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function cloneBoard(board) {
  return board.map((row) => [...row]);
}

function validCols(board) {
  const cols = [];
  for (let c = 0; c < COLS; c++) if (board[ROWS - 1][c] === null) cols.push(c);
  return cols;
}

function dropRow(board, col) {
  for (let r = 0; r < ROWS; r++) if (board[r][col] === null) return r;
  return -1;
}

// Applica una mossa (senza modificare l'originale) e restituisce dove è
// finita la pedina, o null se la colonna è piena.
function applyMove(board, col, symbol) {
  const row = dropRow(board, col);
  if (row === -1) return null;
  const next = cloneBoard(board);
  next[row][col] = symbol;
  return { board: next, row, col };
}

function checkWinnerAt(board, row, col, symbol) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (const [dr, dc] of directions) {
    let count = 1;
    for (const sign of [1, -1]) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === symbol) {
        count++;
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (count >= 4) return true;
  }
  return false;
}

function isFull(board) {
  return board[ROWS - 1].every((v) => v !== null);
}

function centerPreferredMove(cols) {
  const sorted = [...cols].sort((a, b) => Math.abs(a - CENTER) - Math.abs(b - CENTER));
  const bestDist = Math.abs(sorted[0] - CENTER);
  const best = sorted.filter((c) => Math.abs(c - CENTER) === bestDist);
  return best[Math.floor(Math.random() * best.length)];
}

// Valuta quanto è buona una "finestra" di 4 celle per chi valuta (symbol):
// 4 in fila è la vittoria, 3 con uno spazio libero è una minaccia da
// costruire/temere, 2 con due spazi liberi conta poco ma indirizza la CPU.
function evaluateWindow(cells, symbol, oppSymbol) {
  const countSym = cells.filter((c) => c === symbol).length;
  const countOpp = cells.filter((c) => c === oppSymbol).length;
  const countEmpty = cells.filter((c) => c === null).length;
  let score = 0;
  if (countSym === 4) score += 100;
  else if (countSym === 3 && countEmpty === 1) score += 5;
  else if (countSym === 2 && countEmpty === 2) score += 2;
  if (countOpp === 3 && countEmpty === 1) score -= 4;
  return score;
}

function evaluateBoard(board, symbol) {
  const oppSymbol = symbol === 'R' ? 'Y' : 'R';
  let score = 0;
  for (let r = 0; r < ROWS; r++) if (board[r][CENTER] === symbol) score += 3;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += evaluateWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], symbol, oppSymbol);
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      score += evaluateWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], symbol, oppSymbol);
    }
  }
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += evaluateWindow(
        [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]],
        symbol,
        oppSymbol
      );
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      score += evaluateWindow(
        [board[r][c], board[r - 1][c + 1], board[r - 2][c + 2], board[r - 3][c + 3]],
        symbol,
        oppSymbol
      );
    }
  }
  return score;
}

// Minimax con potatura alpha-beta, profondità limitata (il Forza 4 è troppo
// grande per esplorarlo tutto come nel Tris): la CPU "difficile" guarda
// alcune mosse avanti e valuta le posizioni non terminali con evaluateBoard.
function minimax(board, depth, alpha, beta, maximizing, cpuSymbol, humanSymbol, lastMove) {
  if (lastMove && checkWinnerAt(board, lastMove.row, lastMove.col, lastMove.symbol)) {
    return { score: lastMove.symbol === cpuSymbol ? 100000 + depth : -100000 - depth, col: lastMove.col };
  }
  const cols = validCols(board);
  if (cols.length === 0) return { score: 0, col: null };
  if (depth === 0) return { score: evaluateBoard(board, cpuSymbol), col: null };

  const symbol = maximizing ? cpuSymbol : humanSymbol;
  let best = { score: maximizing ? -Infinity : Infinity, col: cols[0] };
  for (const c of cols) {
    const move = applyMove(board, c, symbol);
    const result = minimax(move.board, depth - 1, alpha, beta, !maximizing, cpuSymbol, humanSymbol, {
      row: move.row,
      col: c,
      symbol,
    });
    if (maximizing) {
      if (result.score > best.score) best = { score: result.score, col: c };
      alpha = Math.max(alpha, result.score);
    } else {
      if (result.score < best.score) best = { score: result.score, col: c };
      beta = Math.min(beta, result.score);
    }
    if (alpha >= beta) break;
  }
  return best;
}

function cpuColumn(board, cpuSymbol, humanSymbol, difficulty) {
  const cols = validCols(board);
  if (difficulty === 'facile') {
    return cols[Math.floor(Math.random() * cols.length)];
  }
  if (difficulty === 'difficile') {
    return minimax(board, 5, -Infinity, Infinity, true, cpuSymbol, humanSymbol, null).col;
  }
  // medio: vince se può, blocca se serve, altrimenti va verso il centro.
  for (const c of cols) {
    const move = applyMove(board, c, cpuSymbol);
    if (checkWinnerAt(move.board, move.row, c, cpuSymbol)) return c;
  }
  for (const c of cols) {
    const move = applyMove(board, c, humanSymbol);
    if (checkWinnerAt(move.board, move.row, c, humanSymbol)) return c;
  }
  return centerPreferredMove(cols);
}

// Famiglia 2 (logica a turni), pensato per essere un gradino più
// impegnativo del Tris: griglia più grande, e sul livello difficile la CPU
// gioca con un vero minimax (a profondità limitata, non a colpo d'occhio).
export default function ForzaQuattro({ onFinish, difficulty = 'medio' }) {
  const [mode, setMode] = useState(null); // null | '2p' | 'cpu'
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState('R');
  const [winner, setWinner] = useState(null); // 'R' | 'Y' | 'draw' | null
  const [thinking, setThinking] = useState(false);

  const dropIn = (col, symbol) => {
    const move = applyMove(board, col, symbol);
    if (!move) return null;
    setBoard(move.board);
    if (checkWinnerAt(move.board, move.row, col, symbol)) {
      setWinner(symbol);
      setTimeout(() => {
        if (mode === 'cpu') {
          const score = symbol === 'R' ? 100 : 0;
          const detail = symbol === 'R' ? 'Hai vinto tu!' : 'Ha vinto il computer.';
          onFinish(score, { detail });
        } else {
          onFinish(100, { detail: `Ha vinto il giocatore ${symbol === 'R' ? '1 (rosso)' : '2 (giallo)'}!` });
        }
      }, 1000);
    } else if (isFull(move.board)) {
      setWinner('draw');
      setTimeout(() => onFinish(50, { detail: 'Pareggio, griglia piena!' }), 1000);
    } else {
      setTurn(symbol === 'R' ? 'Y' : 'R');
    }
    return move;
  };

  const playCol = (col) => {
    if (winner || thinking) return;
    if (mode === 'cpu' && turn !== 'R') return;
    dropIn(col, turn);
  };

  // Mossa della CPU quando tocca a "Y": la minimax difficile può richiedere
  // qualche decina di millisecondi, per questo gira dopo il render (mai a
  // blocco dell'interfaccia) con un piccolo indicatore "sta pensando".
  useEffect(() => {
    if (mode !== 'cpu' || winner || turn !== 'Y') return undefined;
    setThinking(true);
    const t = setTimeout(() => {
      const col = cpuColumn(board, 'Y', 'R', difficulty);
      setThinking(false);
      if (col !== null && col !== undefined) dropIn(col, 'Y');
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, turn, board, winner]);

  const startGame = (m) => {
    setMode(m);
    setBoard(emptyBoard());
    setTurn('R');
    setWinner(null);
  };

  if (!mode) {
    return (
      <div className="rb-forza4-setup">
        <p>Scegli come giocare:</p>
        <button type="button" className="rb-forza4-mode-btn" onClick={() => startGame('2p')}>
          2 giocatori locali
        </button>
        <button type="button" className="rb-forza4-mode-btn" onClick={() => startGame('cpu')}>
          Contro il computer
        </button>
      </div>
    );
  }

  return (
    <div className="rb-forza4">
      <p className="rb-forza4-status">
        {winner
          ? winner === 'draw'
            ? 'Pareggio!'
            : `Vince ${winner === 'R' ? '🔴' : '🟡'}!`
          : thinking
          ? 'Il computer sta pensando…'
          : `Turno: ${turn === 'R' ? '🔴' : '🟡'}`}
      </p>
      <div className="rb-forza4-board">
        {Array.from({ length: COLS }, (_, c) => (
          <button
            key={c}
            type="button"
            className="rb-forza4-col"
            onClick={() => playCol(c)}
            disabled={!!winner || thinking || board[ROWS - 1][c] !== null}
          >
            {Array.from({ length: ROWS }, (_, r) => ROWS - 1 - r).map((r) => (
              <span key={r} className={`rb-forza4-cell ${board[r][c] ? `filled-${board[r][c]}` : ''}`} />
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}
