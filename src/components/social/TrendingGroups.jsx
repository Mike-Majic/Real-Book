import './TrendingGroups.css';

// Widget "Gruppi di tendenza": i più popolati, con iscrizione rapida —
// stesso ruolo dei "trending" di Reddit/Twitter, per dare voglia di
// esplorare oltre al feed principale.
export default function TrendingGroups({ groups, joinedGroups, user, onOpenAuth, onToggleJoin, onOpenGroup }) {
  return (
    <div className="rb-trending-groups">
      <h4>Gruppi di tendenza</h4>
      <ul>
        {groups.map((g) => {
          const joined = joinedGroups.includes(g.id);
          return (
            <li key={g.id} className="rb-trending-group" style={{ '--group-color': g.color }}>
              <button type="button" className="rb-trending-group-main" onClick={() => onOpenGroup(g.id)}>
                <span className="rb-trending-group-icon">{g.icon}</span>
                <span>{g.name}</span>
              </button>
              <button
                type="button"
                className={`rb-trending-join-btn ${joined ? 'joined' : ''}`}
                onClick={() => (user ? onToggleJoin(g.id) : onOpenAuth())}
              >
                {joined ? '✓' : '+'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
