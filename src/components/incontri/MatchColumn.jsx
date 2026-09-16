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
// per nome) per scegliere sempre lo stesso messaggio d'apertura finto, e lo
// stesso sottoinsieme "a chi piaci", invece che a caso ad ogni render.
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

function snapshotOf(u) {
  return { id: u.id, name: u.name, avatar: u.avatar, city: u.city };
}

const RIGHT_TABS = [
  { id: 'likesYou', label: 'A chi piaci' },
  { id: 'matches', label: 'I tuoi match' },
  { id: 'messages', label: 'Messaggi' },
  { id: 'favorites', label: 'Preferiti' },
];

// Swipe (stile Tinder): senza backend non esistono "veri" match reciproci —
// mettere "Mi piace" (o accettare in "A chi piaci") crea un match
// immediato, per demo, come avviare una diretta simula solo lo streaming.
// A sinistra il mazzo di profili, a destra 4 schede: chi ti piace, i tuoi
// match, le conversazioni, i preferiti.
export default function MatchColumn({ candidateUsers = [], user, onOpenAuth }) {
  const [decisions, setDecisions] = useState(() => loadStored('rb-match-decisions', {}));
  const [matches, setMatches] = useState(() => loadStored('rb-match-list', []));
  const [chats, setChats] = useState(() => loadStored('rb-match-chats', {}));
  const [favorites, setFavorites] = useState(() => loadStored('rb-match-favorites', []));
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [matchToast, setMatchToast] = useState(null);
  const [draft, setDraft] = useState('');
  const [mobileView, setMobileView] = useState('primary');
  const [rightTab, setRightTab] = useState('matches');
  const [swiping, setSwiping] = useState(null); // { direction: 'left'|'right' }

  const deck = useMemo(
    () => candidateUsers.filter((u) => !decisions[u.id]),
    [candidateUsers, decisions]
  );
  const current = deck[0] ?? null;

  // Sottoinsieme finto (ma stabile) di "chi ti piace": gli ultimi arrivati
  // nel pool, in ordine inverso così non coincide con l'ordine del mazzo.
  const likesYouPool = useMemo(
    () =>
      [...candidateUsers]
        .reverse()
        .filter((u) => !decisions[u.id])
        .slice(0, 6),
    [candidateUsers, decisions]
  );

  const seedChat = (profileId, name, chatsBase) => {
    if (chatsBase[profileId]) return chatsBase;
    const seedMsg = {
      id: `mm-${profileId}`,
      from: 'them',
      testo: OPENING_LINES[hashCode(name) % OPENING_LINES.length],
      data: new Date().toISOString(),
    };
    return { ...chatsBase, [profileId]: [seedMsg] };
  };

  const createMatch = (profile) => {
    const snap = snapshotOf(profile);
    const nextMatches = [...matches, snap];
    setMatches(nextMatches);
    persist('rb-match-list', nextMatches);
    const nextChats = seedChat(snap.id, snap.name, chats);
    setChats(nextChats);
    persist('rb-match-chats', nextChats);
    setMatchToast(snap);
    window.setTimeout(() => setMatchToast(null), 2200);
  };

  const commitDeckDecision = (profile, outcome) => {
    const nextDecisions = { ...decisions, [profile.id]: outcome };
    setDecisions(nextDecisions);
    persist('rb-match-decisions', nextDecisions);
    if (outcome === 'liked') createMatch(profile);
  };

  // "Mi piace"/"Passa" fanno scorrere la card (a destra/sinistra) prima di
  // passare al profilo successivo, invece di scattare via all'istante.
  const decide = (outcome) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!current || swiping) return;
    setSwiping({ direction: outcome === 'liked' ? 'right' : 'left' });
    window.setTimeout(() => {
      commitDeckDecision(current, outcome);
      setSwiping(null);
    }, 320);
  };

  const decideLikesYou = (profile, outcome) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const nextDecisions = { ...decisions, [profile.id]: outcome };
    setDecisions(nextDecisions);
    persist('rb-match-decisions', nextDecisions);
    if (outcome === 'liked') createMatch(profile);
  };

  const toggleFavorite = (profile) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const already = favorites.some((f) => f.id === profile.id);
    const next = already ? favorites.filter((f) => f.id !== profile.id) : [...favorites, snapshotOf(profile)];
    setFavorites(next);
    persist('rb-match-favorites', next);
  };

  const activeMatch = matches.find((m) => m.id === activeMatchId) ?? null;
  const activeMessages = activeMatchId ? chats[activeMatchId] ?? [] : [];

  const openChat = (matchUser) => {
    setActiveMatchId(matchUser.id);
    setRightTab('messages');
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

  // "Messaggi" elenca le conversazioni (un match diventa una conversazione
  // appena c'è un match, col messaggio d'apertura finto già seminato),
  // ordinate per messaggio più recente.
  const conversations = useMemo(
    () =>
      matches
        .filter((m) => chats[m.id]?.length > 0)
        .map((m) => ({ ...m, lastMsg: chats[m.id][chats[m.id].length - 1] }))
        .sort((a, b) => new Date(b.lastMsg.data) - new Date(a.lastMsg.data)),
    [matches, chats]
  );

  const isFavorite = current && favorites.some((f) => f.id === current.id);

  const primary = (
    <div className="rb-match-deck">
      <p className="rb-match-hint">Profili del mondo Incontri: passa o metti mi piace, un mi piace è subito un match.</p>
      {current ? (
        <div className={`rb-match-card ${swiping ? `leaving-${swiping.direction}` : ''}`}>
          <button
            type="button"
            className={`rb-match-fav-btn ${isFavorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(current)}
            aria-label="Aggiungi ai preferiti"
            title="Aggiungi ai preferiti"
          >
            {isFavorite ? '⭐' : '☆'}
          </button>
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
          <button type="button" className="rb-match-pass-btn" onClick={() => decide('passed')} disabled={!!swiping}>✕ Passa</button>
          <button type="button" className="rb-match-like-btn" onClick={() => decide('liked')} disabled={!!swiping}>❤️ Mi piace</button>
        </div>
      )}
    </div>
  );

  const likesYouPane = (
    <ul className="rb-match-list">
      {likesYouPool.length === 0 && <p className="rb-match-pane-empty">Nessuno per ora, torna più tardi.</p>}
      {likesYouPool.map((u) => (
        <li key={u.id} className="rb-match-likes-item">
          <img src={u.avatar} alt="" />
          <span>
            <strong>{u.name}</strong>
            <span className="rb-match-list-city">{u.city}</span>
          </span>
          <div className="rb-match-likes-actions">
            <button type="button" onClick={() => decideLikesYou(u, 'passed')} aria-label="Rifiuta">✕</button>
            <button type="button" onClick={() => decideLikesYou(u, 'liked')} aria-label="Accetta">❤️</button>
          </div>
        </li>
      ))}
    </ul>
  );

  const matchesPane = (
    <ul className="rb-match-list">
      {matches.length === 0 && <p className="rb-match-pane-empty">Metti &quot;Mi piace&quot; a un profilo per iniziare a fare match.</p>}
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
  );

  const messagesPane = activeMatch ? (
    <div className="rb-match-chat-col">
      <button type="button" className="rb-match-chat-back" onClick={() => setActiveMatchId(null)}>← Messaggi</button>
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
    <ul className="rb-match-list">
      {conversations.length === 0 && <p className="rb-match-pane-empty">Nessun messaggio ancora: fai un match per iniziare a chattare.</p>}
      {conversations.map((c) => (
        <li key={c.id}>
          <button type="button" className="rb-match-list-item" onClick={() => openChat(c)}>
            <img src={c.avatar} alt="" />
            <span>
              <strong>{c.name}</strong>
              <span className="rb-match-list-city">{c.lastMsg.testo}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  const favoritesPane = (
    <ul className="rb-match-list">
      {favorites.length === 0 && <p className="rb-match-pane-empty">Tocca la stellina su un profilo per salvarlo qui.</p>}
      {favorites.map((f) => (
        <li key={f.id} className="rb-match-likes-item">
          <img src={f.avatar} alt="" />
          <span>
            <strong>{f.name}</strong>
            <span className="rb-match-list-city">{f.city}</span>
          </span>
          <button
            type="button"
            className="rb-match-fav-remove"
            onClick={() => toggleFavorite(f)}
            aria-label="Togli dai preferiti"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );

  const secondary = (
    <div className="rb-match-secondary-col">
      <div className="rb-match-tabs">
        {RIGHT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rb-match-tab-btn ${rightTab === t.id ? 'active' : ''}`}
            onClick={() => {
              setRightTab(t.id);
              if (t.id !== 'messages') setActiveMatchId(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {rightTab === 'likesYou' && likesYouPane}
      {rightTab === 'matches' && matchesPane}
      {rightTab === 'messages' && messagesPane}
      {rightTab === 'favorites' && favoritesPane}
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
