import './GroupsDirectory.css';

// Elenco dei gruppi del mondo Social, in stile "subreddit": chiunque può
// sfogliarli, iscriversi richiede login (coerente con like/commenti/segui).
// Cliccare la card apre il feed dedicato al gruppo; il pulsante Iscriviti/
// Iscritto è un target separato per non aprire il gruppo per sbaglio.
export default function GroupsDirectory({ groups, joinedGroups, postCounts, user, onOpenAuth, onToggleJoin, onOpenGroup }) {
  return (
    <ul className="rb-groups-grid">
      {groups.map((g) => {
        const joined = joinedGroups.includes(g.id);
        const members = g.memberCount + (joined ? 1 : 0);
        const postCount = postCounts[g.id] ?? 0;
        return (
          <li key={g.id} className="rb-group-card" style={{ '--group-color': g.color }}>
            <button type="button" className="rb-group-card-main" onClick={() => onOpenGroup(g.id)}>
              <span className="rb-group-icon">{g.icon}</span>
              <span className="rb-group-info">
                <strong>{g.name}</strong>
                <span className="rb-group-tagline">{g.tagline}</span>
                <span className="rb-group-stats">
                  {members.toLocaleString('it-IT')} membri · {postCount} post
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
    </ul>
  );
}
