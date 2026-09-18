import { useEffect, useRef, useState } from 'react';
import './Snake.css';

const GRID = 16;
const CELL = 18;
const CANVAS_SIZE = GRID * CELL;

// Livello: velocità di partenza e quanto può diventare rapido il serpente
// (più basso il numero, più veloce il tick).
const SETTINGS = {
  facile: { start: 180, min: 100 },
  medio: { start: 140, min: 70 },
  difficile: { start: 100, min: 45 },
};

function randomFood(snake) {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
  return pos;
}

// Famiglia 3 (loop in tempo reale su canvas): arcade classico, leggero — solo
// canvas 2D nativo e requestAnimationFrame, nessuna libreria di game engine.
export default function Snake({ onFinish, difficulty = 'medio' }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const rafRef = useRef(null);
  const lastTickRef = useRef(0);
  const settings = SETTINGS[difficulty] ?? SETTINGS.medio;
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);

  if (!stateRef.current) {
    const snake = [{ x: 8, y: 8 }];
    stateRef.current = {
      snake,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: randomFood(snake),
      score: 0,
      speed: settings.start,
      minSpeed: settings.min,
      over: false,
    };
  }

  const tick = (s) => {
    s.dir = s.nextDir;
    const head = s.snake[0];
    const newHead = { x: head.x + s.dir.x, y: head.y + s.dir.y };
    if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) return gameOver(s);
    if (s.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) return gameOver(s);

    s.snake.unshift(newHead);
    if (newHead.x === s.food.x && newHead.y === s.food.y) {
      s.score += 10;
      s.food = randomFood(s.snake);
      s.speed = Math.max(s.minSpeed, s.speed - 3);
      setScore(s.score);
    } else {
      s.snake.pop();
    }
  };

  const gameOver = (s) => {
    s.over = true;
    onFinish(s.score, { detail: `Lunghezza finale: ${s.snake.length}` });
  };

  const draw = (ctx, s) => {
    ctx.fillStyle = '#04140a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#22c55e';
    s.snake.forEach((seg, i) => {
      ctx.globalAlpha = i === 0 ? 1 : 0.75;
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2.6, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    if (!started) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const dirMap = {
      ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
    };
    const onKey = (e) => {
      const nd = dirMap[e.key];
      if (!nd) return;
      const s = stateRef.current;
      if (nd.x === -s.dir.x && nd.y === -s.dir.y) return;
      s.nextDir = nd;
    };
    window.addEventListener('keydown', onKey);

    const loop = (t) => {
      const s = stateRef.current;
      if (s.over) return;
      if (t - lastTickRef.current > s.speed) {
        lastTickRef.current = t;
        tick(s);
      }
      draw(ctx, s);
      if (!s.over) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const setDir = (x, y) => {
    const s = stateRef.current;
    if (x === -s.dir.x && y === -s.dir.y) return;
    s.nextDir = { x, y };
  };

  if (!started) {
    return (
      <div className="rb-snake-intro">
        <p>Mangia i frutti, evita i muri e la tua coda.</p>
        <button type="button" className="rb-snake-start-btn" onClick={() => setStarted(true)}>
          Via!
        </button>
      </div>
    );
  }

  return (
    <div className="rb-snake">
      <p className="rb-snake-score">Punti: {score}</p>
      <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="rb-snake-canvas" />
      <div className="rb-snake-touch">
        <div className="rb-snake-touch-row">
          <button type="button" onClick={() => setDir(0, -1)}>▲</button>
        </div>
        <div className="rb-snake-touch-row">
          <button type="button" onClick={() => setDir(-1, 0)}>◀</button>
          <button type="button" onClick={() => setDir(0, 1)}>▼</button>
          <button type="button" onClick={() => setDir(1, 0)}>▶</button>
        </div>
      </div>
    </div>
  );
}
