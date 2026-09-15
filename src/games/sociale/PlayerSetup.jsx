import { useState } from 'react';
import './PlayerSetup.css';

// Utility condivisa dai giochi di gruppo (Famiglia 4): raccoglie i nomi dei
// giocatori presenti attorno allo stesso dispositivo. Nessun backend/rete:
// la sessione (nomi, turni, punteggi) vive solo nello stato locale della
// partita in corso, si passa il dispositivo di mano in mano.
export default function PlayerSetup({ minPlayers = 2, maxPlayers = 8, onReady }) {
  const [names, setNames] = useState(['', '']);

  const updateName = (i, value) => {
    const next = [...names];
    next[i] = value;
    setNames(next);
  };

  const addPlayer = () => {
    if (names.length < maxPlayers) setNames([...names, '']);
  };

  const removePlayer = (i) => {
    if (names.length > minPlayers) setNames(names.filter((_, idx) => idx !== i));
  };

  const trimmed = names.map((n) => n.trim());
  const validNames = trimmed.filter(Boolean);
  const hasDuplicates = new Set(validNames).size !== validNames.length;
  const canStart = validNames.length >= minPlayers && validNames.length === names.length && !hasDuplicates;

  return (
    <div className="rb-player-setup">
      <p>Chi gioca? (almeno {minPlayers}, tutti sullo stesso dispositivo)</p>
      <div className="rb-player-setup-list">
        {names.map((name, i) => (
          <div key={i} className="rb-player-setup-row">
            <input
              type="text"
              placeholder={`Giocatore ${i + 1}`}
              value={name}
              onChange={(e) => updateName(i, e.target.value)}
              maxLength={16}
            />
            {names.length > minPlayers && (
              <button type="button" onClick={() => removePlayer(i)} aria-label="Rimuovi giocatore">✕</button>
            )}
          </div>
        ))}
      </div>
      {names.length < maxPlayers && (
        <button type="button" className="rb-player-setup-add" onClick={addPlayer}>
          + Aggiungi giocatore
        </button>
      )}
      {hasDuplicates && <p className="rb-player-setup-warning">I nomi devono essere diversi tra loro.</p>}
      <button
        type="button"
        className="rb-player-setup-start"
        disabled={!canStart}
        onClick={() => onReady(validNames)}
      >
        Inizia
      </button>
    </div>
  );
}
