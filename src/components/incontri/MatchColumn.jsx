import { useMemo, useState } from 'react';
import TwoColumnSwitcher from '../layout/TwoColumnSwitcher';
import './MatchColumn.css';

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Piccolo hash deterministico (non serve robustezza, solo un numero stabile
// per nome) per scegliere sempre lo stesso messaggio d'apertura finto per
// una data persona, invece che a caso ad ogni render.
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const OPENING_LINES = [
  'Ciao! È un piacere essere finiti in match 😊',
  'Ehi, complimenti per il profilo!',
  'Ciao, cosa fai di bello di solito?',
  'Che bello, un match! Come va?',
];

// Card degli swipe (stile Tinder): senza backend non esistono "veri" match
// reciproci — mettere "Mi piace" crea un match immediato, per demo, come
// avviare una diretta simula solo lo streaming. Chi hai già scartato/con
// cui hai già fatto match non ricompare più nel mazzo. Stesso layout a due
// colonne condiviso col resto dell'app (TwoColumnSwitcher): a sinistra il
// mazzo (o la chat del match aperto), a destra la lista dei match.
export default function MatchColumn({ candidateUsers = [], user, onOpenAuth }) {
  const [decisions, setDecisions] = useState(() => loadStored('rb-match-decisions', {}));
  const [matches, setMatches] = useState(() => loadStored('rb-match-list', []));
  const [chats, setChats] = useState(() => loadStored('rb-match-chats', {}));
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [matchToast, setMatchToast] = useState(null);
  const [draft, setDraft] = useState('');
  const [mobileView, setMobileView] = useState('primary');

  const deck = useMemo(
    () => candidateUsers.filter((u) => !decisions[u.id]),
    [candidateUsers, decisions]
  );
  const current = deck[0] ?? null;

  const decide = (outcome) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!current) return;
    const nextDecisions = { ...decisions, [current.id]: outcome };
    setDecisions(nextDecisions);
    persist('rb-match-decisions', nextDecisions);

    if (outcome === 'liked') {
      const snapshot = { id: current.id, name: current.name, avatar: current.avatar, city: current.city };
      const nextMatches = [...matches, snapshot];
      setMatches(nextMatches);
      persist('rb-match-list', nextMatches);
      setMatchToast(snapshot);
      window.setTimeout(() => setMatchToast(null), 2200);
    }
  };

  const activeMatch = matches.find((m) => m.id === activeMatchId) ?? null;
  const activeMessages = activeMatchId ? chats[activeMatchId] ?? [] : [];

  const openChat = (matchUser) => {
    setActiveMatchId(matchUser.id);
    setMobileView('primary');
    if (!chats[matchUser.id]) {
      const seedMsg = {
        id: `mm-${matchUser.id}`,
        from: 'them',
        testo: OPENING_LINES[hashCode(matchUser.name) % OPENING_LINES.length],
        data: new Date().toISOString(),
      };
      const next = { ...chats, [matchUser.id]: [seedMsg] };
      setChats(next);
      persist('rb-match-chats', next);
    }
  };

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeMatchId) return;
    const newMsg = { id: `mm-${Date.now()}`, from: 'me', testo: text, data: new Date().toISOString() };
    const next = { ...chats, [activeMatchId]: [...(chats[activeMatchId] ?? []), newMsg] };
    setChats(next);
    persist('rb-match-chats', next);
    setDraft('');
  };

  const primary = activeMatch ? (
    <div className="rb-match-chat-col">
      <button type="button" className="rb-match-chat-back" onClick={() => setActiveMatchId(null)}>← Match</button>
      <div className="rb-match-chat-header">
        <img src={activeMatch.avatar} alt="" />
        <strong>{activeMatch.name}</strong>
      </div>
      <ul className="rb-match-chat-messages">
        {activeMessages.map((m) => (
          <li key={m.id} className={`rb-match-msg ${m.from === 'me' ? 'me' : ''}`}>
            <span>{m.testo}</span>
          </li>
        ))}
      </ul>
      <form className="rb-match-chat-form" onSubmit={send}>
        <input
          type="text"
          placeholder={user ? 'Scrivi un messaggio...' : 'Accedi per scrivere...'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => !user && onOpenAuth()}
        />
        <button type="submit" className="rb-match-chat-send">Invia</button>
      </form>
    </div>
  ) : (
    <div className="rb-match-deck">
      <p className="rb-match-hint">Profili del mondo Incontri: passa o metti mi piace, un mi piace è subito un match.</p>
      {current ? (
        <div className="rb-match-card">
          <img className="rb-match-card-photo" src={current.avatar} alt={current.name} />
          <div className="rb-match-card-info">
            <strong>{current.name}{current.age ? `, ${current.age}` : ''}</strong>
            <span>{current.city}</span>
            {current.bio && <p>{current.bio}</p>}
          </div>
        </div>
      ) : (
        <p className="rb-match-empty">Nessun altro profilo al momento, torna più tardi 👋</p>
      )}
      {current && (
        <div className="rb-match-actions">
          <button type="button" className="rb-match-pass-btn" onClick={() => decide('passed')}>✕ Passa</button>
          <button type="button" className="rb-match-like-btn" onClick={() => decide('liked')}>❤️ Mi piace</button>
        </div>
      )}
    </div>
  );

  const secondary = (
    <div className="rb-match-list-col">
      <h3>I tuoi match</h3>
      <p>{matches.length > 0 ? `${matches.length} match` : 'Metti "Mi piace" a un profilo per iniziare a fare match.'}</p>
      <ul className="rb-match-list">
        {matches.map((m) => (
          <li key={m.id}>
            <button type="button" className="rb-match-list-item" onClick={() => openChat(m)}>
              <img src={m.avatar} alt="" />
              <span>
                <strong>{m.name}</strong>
                <span className="rb-match-list-city">{m.city}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="rb-match-column">
      <TwoColumnSwitcher
        primary={primary}
        secondary={secondary}
        primaryLabel="Scopri"
        secondaryLabel="Match"
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
      />
      {matchToast && <div className="rb-match-toast">🎉 È un Match con {matchToast.name}!</div>}
    </div>
  );
}
