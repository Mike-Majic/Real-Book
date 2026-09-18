import { useState } from 'react';
import './GroupsDirectory.css';

// Piccolo form per creare un gruppo (nome, descrizione, icona emoji,
// colore): l'unico modo per far comparire un nuovo gruppo, dato che ora i
// gruppi sono creati davvero dagli utenti, non più una lista fissa.
function CreateGroupForm({ onCreateGroup, onDone }) {
  const [nome, setNome] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [icona, setIcona] = useState('👥');
  const [colore, setColore] = useState('#1d9bf0');
  const [creating, setCreating] = useState(false);
  const [errore, setErrore] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!nome.trim() || creating) return;
    setCreating(true);
    setErrore('');
    const { error } = await onCreateGroup({ nome, descrizione, icona, colore });
    setCreating(false);
    if (error) {
      setErrore(error);
      return;
    }
    onDone();
  };

  return (
    <form className="rb-group-create-form" onSubmit={submit}>
      <div className="rb-group-create-row">
        <input
          type="text"
          className="rb-group-create-icon-input"
          value={icona}
          onChange={(e) => setIcona(e.target.value.slice(0, 2))}
          maxLength={2}
          aria-label="Icona del gruppo (un emoji)"
        />
        <input
          type="text"
          className="rb-group-create-name-input"
          placeholder="Nome del gruppo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={60}
        />
        <input
          type="color"
          className="rb-group-create-color-input"
          value={colore}
          onChange={(e) => setColore(e.target.value)}
          aria-label="Colore del gruppo"
        />
      </div>
      <textarea
        className="rb-group-create-desc-input"
        placeholder="Di cosa parla il gruppo (facoltativo)"
        value={descrizione}
        onChange={(e) => setDescrizione(e.target.value)}
        rows={2}
        maxLength={200}
      />
      {errore && <p className="rb-group-create-error">⚠️ {errore}</p>}
      <div className="rb-group-create-actions">
        <button type="button" className="rb-group-create-cancel" onClick={onDone}>Annulla</button>
        <button type="submit" className="rb-group-create-submit" disabled={!nome.trim() || creating}>
          {creating ? 'Creazione...' : 'Crea gruppo'}
        </button>
      </div>
    </form>
  );
}

// Elenco dei gruppi del mondo Social, in stile "subreddit": chiunque può
// sfogliarli, iscriversi/crearne uno richiede login (coerente con like/
// commenti/segui). Cliccare la card apre il feed dedicato al gruppo; il
// pulsante Iscriviti/Iscritto è un target separato per non aprire il
// gruppo per sbaglio.
export default function GroupsDirectory({ groups, joinedGroups, postCounts, user, onOpenAuth, onToggleJoin, onOpenGroup, onCreateGroup }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="rb-groups-directory">
      {onCreateGroup && (
        <>
          {showCreate ? (
            <CreateGroupForm onCreateGroup={onCreateGroup} onDone={() => setShowCreate(false)} />
          ) : (
            <button
              type="button"
              className="rb-group-new-btn"
              onClick={() => (user ? setShowCreate(true) : onOpenAuth())}
            >
              + Crea un gruppo
            </button>
          )}
        </>
      )}

      <ul className="rb-groups-grid">
        {groups.map((g) => {
          const joined = joinedGroups.includes(g.id);
          const postCount = postCounts[g.id] ?? 0;
          return (
            <li key={g.id} className="rb-group-card" style={{ '--group-color': g.color }}>
              <button type="button" className="rb-group-card-main" onClick={() => onOpenGroup(g.id)}>
                <span className="rb-group-icon">{g.icon}</span>
                <span className="rb-group-info">
                  <strong>{g.name}</strong>
                  <span className="rb-group-tagline">{g.tagline}</span>
                  <span className="rb-group-stats">
                    {g.memberCount.toLocaleString('it-IT')} membri · {postCount} post
                  </span>
                </span>
              </button>
              <button
                type="button"
                className={`rb-group-join-btn ${joined ? 'joined' : ''}`}
                onClick={() => (user ? onToggleJoin(g.id) : onOpenAuth())}
              >
                {joined ? 'Iscritto ✓' : 'Iscriviti'}
              </button>
            </li>
          );
        })}
        {groups.length === 0 && <p className="rb-social-empty">Nessun gruppo ancora. Creane uno tu!</p>}
      </ul>
    </div>
  );
}
