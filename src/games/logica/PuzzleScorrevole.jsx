import { useRef, useState } from 'react';
import './PuzzleScorrevole.css';

const SIZE = 4;

function makeSolved() {
  const arr = Array.from({ length: SIZE * SIZE - 1 }, (_, i) => i + 1);
  arr.push(0); // 0 = casella vuota
  return arr;
}

function neighbors(pos) {
  const row = Math.floor(pos / SIZE);
  const col = pos % SIZE;
  const n = [];
  if (row > 0) n.push(pos - SIZE);
  if (row < SIZE - 1) n.push(pos + SIZE);
  if (col > 0) n.push(pos - 1);
  if (col < SIZE - 1) n.push(pos + 1);
  return n;
}

// Mescola facendo mosse valide a partire dalla soluzione (mai lo scambio
// diretto di due tessere a caso): garantisce che il puzzle resti risolvibile.
function shuffleBoard(board, steps = 150) {
  const b = [...board];
  let emptyPos = b.indexOf(0);
  let lastPos = -1;
  for (let i = 0; i < steps; i++) {
    const options = neighbors(emptyPos).filter((p) => p !== lastPos);
    const swapWith = options[Math.floor(Math.random() * options.length)];
    [b[emptyPos], b[swapWith]] = [b[swapWith], b[emptyPos]];
    lastPos = emptyPos;
    emptyPos = swapWith;
  }
  return b;
}

function isSolved(board) {
  return board.every((v, i) => (i === board.length - 1 ? v === 0 : v === i + 1));
}

// Famiglia 2 (costruttivo/logico): fai scorrere le tessere per rimettere in
// ordine i numeri, nessun timer che mette fretta, solo mosse.
export default function PuzzleScorrevole({ onFinish }) {
  const [board, setBoard] = useState(() => shuffleBoard(makeSolved()));
  const [moves, setMoves] = useState(0);
  const startRef = useRef(Date.now());

  const tryMove = (pos) => {
    const emptyPos = board.indexOf(0);
    if (!neighbors(emptyPos).includes(pos)) return;
    const next = [...board];
    [next[emptyPos], next[pos]] = [next[pos], next[emptyPos]];
    setBoard(next);
    const newMoves = moves + 1;
    setMoves(newMoves);
    if (isSolved(next)) {
      const seconds = Math.round((Date.now() - startRef.current) / 1000);
      const score = Math.max(10, 500 - newMoves * 3 - seconds);
      setTimeout(() => onFinish(score, { detail: `${newMoves} mosse in ${seconds}s` }), 400);
    }
  };

  return (
    <div className="rb-puzzle15">
      <p className="rb-puzzle15-moves">Mosse: {moves}</p>
      <div className="rb-puzzle15-grid">
        {board.map((v, i) => (
          <button
            key={i}
            type="button"
            className={`rb-puzzle15-tile ${v === 0 ? 'empty' : ''}`}
            onClick={() => tryMove(i)}
            disabled={v === 0}
          >
            {v !== 0 ? v : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
