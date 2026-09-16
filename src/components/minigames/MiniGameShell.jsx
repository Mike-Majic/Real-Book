import { Suspense, useState } from 'react';
import './MiniGameShell.css';

// Fase A — wrapper comune a tutti i minigiochi: schermata iniziale,
// (il punteggio/timer live sono mostrati dal gioco stesso, che varia troppo
// da famiglia a famiglia per un HUD comune), schermata di fine partita con
// "gioca ancora" e "condividi risultato". Ogni gioco riceve solo onFinish
// (score, extra?) e non deve preoccuparsi d'altro.
export default function MiniGameShell({ game }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'playing' | 'ended'
  const [result, setResult] = useState(null);
  const [shareMsg, setShareMsg] = useState('');

  const start = () => {
    setResult(null);
    setShareMsg('');
    setPhase('playing');
  };

  const finish = (score, extra = {}) => {
    setResult({ score, ...extra });
    setPhase('ended');
  };

  const shareResult = async () => {
    const text = `Ho fatto ${result?.score ?? 0} punti a "${game.nome}" su Versemove!`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // annullato dall'utente: nessun errore da mostrare
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareMsg('Risultato copiato negli appunti!');
    } catch {
      setShareMsg(text);
    }
  };

  const Component = game.Component;

  return (
    <div className="rb-minigame-shell">
      <div className="rb-minigame-title">{game.nome}</div>

      {phase === 'intro' && (
        <div className="rb-minigame-panel rb-minigame-intro">
          <p className="rb-minigame-mechanic">{game.meccanica}</p>
          <p className="rb-minigame-age">Consigliato da {game.fasciaEtaMinima}+ anni</p>
          <button type="button" className="rb-minigame-btn-primary" onClick={start}>
            Inizia
          </button>
        </div>
      )}

      {phase === 'playing' && (
        <div className="rb-minigame-panel rb-minigame-play">
          <Suspense fallback={<p className="rb-minigame-loading">Caricamento…</p>}>
            <Component onFinish={finish} />
          </Suspense>
        </div>
      )}

      {phase === 'ended' && (
        <div className="rb-minigame-panel rb-minigame-end">
          <p className="rb-minigame-score">Punteggio: {result?.score}</p>
          {result?.detail && <p className="rb-minigame-detail">{result.detail}</p>}
          <div className="rb-minigame-end-actions">
            <button type="button" className="rb-minigame-btn-primary" onClick={start}>
              Gioca ancora
            </button>
            <button type="button" className="rb-minigame-btn-secondary" onClick={shareResult}>
              Condividi risultato
            </button>
          </div>
          {shareMsg && <p className="rb-minigame-share-msg">{shareMsg}</p>}
        </div>
      )}
    </div>
  );
}
