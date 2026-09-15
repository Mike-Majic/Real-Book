import { useEffect, useState } from 'react';
import { MINIGAMES, MINIGAME_FAMILIES } from '../games/registry';
import MiniGameShell from './minigames/MiniGameShell';
import './BambiniGames.css';

// Elenco dei minigiochi del mondo Bambini, generato dal registro
// (src/games/registry.js) e raggruppato per famiglia. Aprendo un gioco si
// sovrappone il wrapper comune MiniGameShell (Fase A), mai il globo stesso —
// coerente con la scelta di non mostrare profili/posizioni di minori sulla
// mappa: questo mondo resta fatto di giochi, non di persone.
//
// onGameOpenChange avvisa App.jsx quando un gioco è aperto/chiuso, per
// disattivare lo swipe/le frecce di cambio mondo mentre si gioca (altrimenti
// le frecce di giochi come Snake cambierebbero mondo invece di muovere il
// personaggio).
export default function BambiniGames({ world, onGameOpenChange }) {
  const [activeGameId, setActiveGameId] = useState(null);
  const activeGame = MINIGAMES.find((g) => g.id === activeGameId) ?? null;

  useEffect(() => {
    onGameOpenChange?.(!!activeGameId);
  }, [activeGameId, onGameOpenChange]);

  useEffect(() => () => onGameOpenChange?.(false), [onGameOpenChange]);

  return (
    <div className="rb-bambini-games" style={{ '--accent': world.color }}>
      {!activeGame && (
        <div className="rb-bambini-panel">
          <div className="rb-bambini-panel-header">
            <h2>Giochi</h2>
            <p>{MINIGAMES.length} minigiochi, leggeri e pensati per i più piccoli</p>
          </div>

          {MINIGAME_FAMILIES.map((fam) => {
            const games = MINIGAMES.filter((g) => g.famiglia === fam.id);
            if (games.length === 0) return null;
            return (
              <div key={fam.id} className="rb-bambini-family">
                <h3>{fam.label}</h3>
                <div className="rb-bambini-grid">
                  {games.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      className="rb-bambini-card"
                      onClick={() => setActiveGameId(g.id)}
                    >
                      <strong>{g.nome}</strong>
                      <span>{g.meccanica}</span>
                      <em>{g.fasciaEtaMinima}+ anni</em>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeGame && (
        <div className="rb-bambini-game-overlay">
          <button
            type="button"
            className="rb-bambini-close-btn"
            onClick={() => setActiveGameId(null)}
            aria-label="Chiudi gioco"
            title="Chiudi gioco"
          >
            ✕
          </button>
          <MiniGameShell key={activeGame.id} game={activeGame} />
        </div>
      )}
    </div>
  );
}
