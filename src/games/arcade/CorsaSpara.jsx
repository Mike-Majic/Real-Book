import { useEffect, useRef, useState } from 'react';
import './CorsaSpara.css';

// Corsa e spara retrò — personaggi e temi ORIGINALI (nessun riferimento a
// giochi esistenti): un piccolo robot da difesa ("Bip") corre su 3 corsie e
// spara ai droni nemici che arrivano da destra. Solo forme geometriche
// disegnate su canvas, nessuna immagine da caricare.
const LANES = [46, 100, 154];
const CANVAS_W = 380;
const CANVAS_H = 200;
const PLAYER_X = 46;

// Livello: quanto sono veloci/frequenti i droni all'inizio, quanto in
// fretta la difficoltà sale nel tempo, e quante vite si hanno.
const SETTINGS = {
  facile: { enemySpeed: 1.6, spawnEvery: 1800, minSpawnEvery: 950, rampDivisor: 30000, lives: 4 },
  medio: { enemySpeed: 2.2, spawnEvery: 1400, minSpawnEvery: 650, rampDivisor: 20000, lives: 3 },
  difficile: { enemySpeed: 2.9, spawnEvery: 1050, minSpawnEvery: 420, rampDivisor: 12000, lives: 2 },
};

function makeEnemy(speed) {
  return {
    lane: Math.floor(Math.random() * 3),
    x: CANVAS_W + 20,
    speed,
    kind: Math.random() < 0.5 ? 'drone' : 'camminatore',
    hit: false,
  };
}

export default function CorsaSpara({ onFinish, difficulty = 'medio' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const settings = SETTINGS[difficulty] ?? SETTINGS.medio;
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(settings.lives);
  const stateRef = useRef(null);

  if (!stateRef.current) {
    stateRef.current = {
      lane: 1,
      enemies: [],
      bullets: [],
      score: 0,
      lives: settings.lives,
      spawnTimer: 0,
      spawnEvery: settings.spawnEvery,
      enemySpeed: settings.enemySpeed,
      elapsed: 0,
      over: false,
    };
  }

  const shoot = () => {
    const s = stateRef.current;
    if (s.over) return;
    s.bullets.push({ x: PLAYER_X + 16, lane: s.lane });
  };

  const moveLane = (delta) => {
    const s = stateRef.current;
    s.lane = Math.min(2, Math.max(0, s.lane + delta));
  };

  const endGame = () => {
    const s = stateRef.current;
    if (s.over) return;
    s.over = true;
    const enemiesDown = Math.round(s.score / 10);
    onFinish(s.score, { detail: `Droni eliminati: ${enemiesDown}` });
  };

  useEffect(() => {
    if (!started) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let lastT = performance.now();

    const onKey = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') moveLane(-1);
      if (e.key === 'ArrowDown' || e.key === 's') moveLane(1);
      if (e.key === ' ' || e.key === 'ArrowRight') shoot();
    };
    window.addEventListener('keydown', onKey);

    const loop = (t) => {
      const s = stateRef.current;
      if (s.over) return;
      const dt = t - lastT;
      lastT = t;
      s.elapsed += dt;

      // difficoltà crescente nel tempo
      s.enemySpeed = settings.enemySpeed + s.elapsed / settings.rampDivisor;
      s.spawnTimer += dt;
      if (s.spawnTimer > s.spawnEvery) {
        s.spawnTimer = 0;
        s.spawnEvery = Math.max(settings.minSpawnEvery, s.spawnEvery - 15);
        s.enemies.push(makeEnemy(s.enemySpeed));
      }

      s.bullets.forEach((b) => { b.x += 8; });
      s.bullets = s.bullets.filter((b) => b.x < CANVAS_W + 20);

      s.enemies.forEach((en) => { en.x -= en.speed; });

      // collisioni proiettile-nemico
      s.enemies.forEach((en) => {
        if (en.hit) return;
        s.bullets.forEach((b) => {
          if (b.hit) return;
          if (b.lane === en.lane && Math.abs(b.x - en.x) < 14) {
            en.hit = true;
            b.hit = true;
            s.score += 10;
            setScore(s.score);
          }
        });
      });
      s.bullets = s.bullets.filter((b) => !b.hit);

      // nemici che raggiungono il giocatore
      s.enemies.forEach((en) => {
        if (en.hit || en.x > PLAYER_X + 18) return;
        en.hit = true;
        s.lives -= 1;
        setLives(s.lives);
        if (s.lives <= 0) endGame();
      });

      s.enemies = s.enemies.filter((en) => !en.hit && en.x > -30);

      // punteggio passivo per la sopravvivenza
      if (Math.floor(s.elapsed / 1000) > Math.floor((s.elapsed - dt) / 1000)) {
        s.score += 1;
        setScore(s.score);
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

  function draw(ctx, s) {
    ctx.fillStyle = '#0a0620';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // strisce retrò di sfondo
    ctx.strokeStyle = 'rgba(212, 246, 52, 0.12)';
    for (let i = 0; i < 6; i++) {
      const y = (i * 40 + (s.elapsed / 8) % 40);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }

    // corsie
    LANES.forEach((y) => {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(0, y + 22);
      ctx.lineTo(CANVAS_W, y + 22);
      ctx.stroke();
    });

    // proiettili
    ctx.fillStyle = '#fde047';
    s.bullets.forEach((b) => {
      ctx.fillRect(b.x, LANES[b.lane] - 3, 12, 6);
    });

    // nemici (forme originali: quadrato = drone, triangolo = camminatore)
    s.enemies.forEach((en) => {
      const y = LANES[en.lane];
      if (en.kind === 'drone') {
        ctx.fillStyle = '#f87171';
        ctx.fillRect(en.x - 12, y - 12, 24, 24);
      } else {
        ctx.fillStyle = '#c084fc';
        ctx.beginPath();
        ctx.moveTo(en.x, y - 14);
        ctx.lineTo(en.x - 14, y + 12);
        ctx.lineTo(en.x + 14, y + 12);
        ctx.closePath();
        ctx.fill();
      }
    });

    // il personaggio "Bip"
    const py = LANES[s.lane];
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(PLAYER_X - 14, py - 12, 24, 24);
    ctx.fillStyle = '#0a0620';
    ctx.fillRect(PLAYER_X - 8, py - 6, 6, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(PLAYER_X + 10, py - 3, 10, 6);
  }

  if (!started) {
    return (
      <div className="rb-corsa-intro">
        <p>Bip deve fermare l’invasione di droni! Cambia corsia ed elimina i nemici prima che ti raggiungano.</p>
        <button type="button" className="rb-corsa-start-btn" onClick={() => setStarted(true)}>
          Via!
        </button>
      </div>
    );
  }

  return (
    <div className="rb-corsa">
      <div className="rb-corsa-topbar">
        <span>Punti: {score}</span>
        <span>{'❤️'.repeat(Math.max(0, lives))}</span>
      </div>
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="rb-corsa-canvas" />
      <div className="rb-corsa-controls">
        <button type="button" onClick={() => moveLane(-1)}>▲</button>
        <button type="button" className="rb-corsa-fire" onClick={shoot}>SPARA</button>
        <button type="button" onClick={() => moveLane(1)}>▼</button>
      </div>
    </div>
  );
}
