import { useEffect, useRef, useState } from 'react';
import './TorreBlocchi.css';

// Torre di blocchi — impila blocchi in equilibrio: quello in cima oscilla a
// sinistra/destra, si "molla" al tocco/tasto e si incastra sul blocco sotto;
// la parte che sporge viene tagliata via. Fisica volutamente semplicissima
// (solo overlap tra rettangoli, nessuna libreria fisica) ma il principio è
// lo stesso del genere "stack": costruttivo, un blocco alla volta.
const CANVAS_W = 260;
const CANVAS_H = 380;
const BLOCK_H = 24;
const COLORS = ['#22c55e', '#4ade80', '#86efac', '#facc15', '#38bdf8'];

// Livello: quanto è veloce (e quanto accelera) il blocco che oscilla, e
// quanto sovrapposizione minima serve per non sbagliare (più alta = più
// facile fallire anche con un buon tiro).
const SETTINGS = {
  facile: { base: 1.3, growth: 0.08, max: 3.2, failThreshold: 2 },
  medio: { base: 1.6, growth: 0.12, max: 4.5, failThreshold: 4 },
  difficile: { base: 2.2, growth: 0.16, max: 6, failThreshold: 8 },
};

export default function TorreBlocchi({ onFinish, difficulty = 'medio' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const settings = SETTINGS[difficulty] ?? SETTINGS.medio;
  const [started, setStarted] = useState(false);
  const [height, setHeight] = useState(0);
  const stateRef = useRef(null);

  if (!stateRef.current) {
    const baseWidth = 140;
    stateRef.current = {
      stack: [{ x: (CANVAS_W - baseWidth) / 2, width: baseWidth }],
      moving: { x: 0, width: baseWidth, dir: 1, speed: settings.base },
      cameraOffset: 0,
      over: false,
      height: 0,
    };
  }

  const spawnMoving = (s) => {
    const top = s.stack[s.stack.length - 1];
    s.moving = { x: 0, width: top.width, dir: 1, speed: Math.min(settings.max, settings.base + s.height * settings.growth) };
  };

  useEffect(() => {
    if (!started) return undefined;
    const s = stateRef.current;
    spawnMoving(s);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drop = () => {
      if (s.over) return;
      const top = s.stack[s.stack.length - 1];
      const movingLeft = s.moving.x;
      const movingRight = s.moving.x + s.moving.width;
      const topLeft = top.x;
      const topRight = top.x + top.width;

      const overlapLeft = Math.max(movingLeft, topLeft);
      const overlapRight = Math.min(movingRight, topRight);
      const overlapWidth = overlapRight - overlapLeft;

      if (overlapWidth <= settings.failThreshold) {
        s.over = true;
        onFinish(s.height * 10, { detail: `Torre alta ${s.height} blocchi` });
        return;
      }

      s.stack.push({ x: overlapLeft, width: overlapWidth });
      s.height += 1;
      setHeight(s.height);

      // la telecamera sale quando la torre supera metà canvas
      if (s.stack.length * BLOCK_H > CANVAS_H * 0.55) {
        s.cameraOffset += BLOCK_H;
      }

      spawnMoving(s);
    };

    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') drop();
    };
    window.addEventListener('keydown', onKey);
    canvas._drop = drop;

    const loop = () => {
      const st = stateRef.current;
      if (st.over) return;
      st.moving.x += st.moving.dir * st.moving.speed;
      if (st.moving.x <= 0 || st.moving.x + st.moving.width >= CANVAS_W) {
        st.moving.dir *= -1;
        st.moving.x = Math.max(0, Math.min(CANVAS_W - st.moving.width, st.moving.x));
      }
      draw(ctx, st);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKey);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  function draw(ctx, s) {
    ctx.fillStyle = '#04140a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    s.stack.forEach((block, i) => {
      // i è la "riga" del blocco a partire dalla base (0 = base): la sua
      // posizione non deve dipendere da quanti blocchi ci sono ORA in totale,
      // altrimenti i blocchi già piazzati "salterebbero" a ogni nuovo tiro.
      const y = CANVAS_H - BLOCK_H * (i + 1) + s.cameraOffset;
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fillRect(block.x, y, block.width, BLOCK_H - 2);
    });

    const movingY = CANVAS_H - BLOCK_H * (s.stack.length + 1) + s.cameraOffset;
    ctx.fillStyle = COLORS[s.stack.length % COLORS.length];
    ctx.fillRect(s.moving.x, movingY, s.moving.width, BLOCK_H - 2);
  }

  const handleTap = () => {
    const canvas = canvasRef.current;
    if (canvas && canvas._drop) canvas._drop();
  };

  if (!started) {
    return (
      <div className="rb-torre-intro">
        <p>Tocca (o premi Spazio) per far cadere il blocco in cima alla torre: se sporge troppo, la parte in eccesso viene tagliata via.</p>
        <button type="button" className="rb-torre-start-btn" onClick={() => setStarted(true)}>
          Via!
        </button>
      </div>
    );
  }

  return (
    <div className="rb-torre">
      <p className="rb-torre-score">Altezza torre: {height}</p>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rb-torre-canvas"
        onPointerDown={handleTap}
      />
      <p className="rb-torre-hint">Tocca l’area di gioco per lasciar cadere il blocco</p>
    </div>
  );
}
