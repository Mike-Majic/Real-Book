import './ProfileModal.css';

export default function ProfileModal({ user, world, onClose }) {
  if (!user) return null;

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-profile-card" style={{ '--accent': world.color }} onClick={(e) => e.stopPropagation()}>
        <button className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>

        <div className="rb-profile-head">
          <img src={user.avatar} alt={user.name} className="rb-profile-avatar" />
          <div>
            <h2>{user.name}{user.age ? `, ${user.age}` : ''}</h2>
            <p className="rb-profile-location">📍 {user.city}, {user.country}</p>
          </div>
        </div>

        {world.id === 'lavoro' ? (
          <div className="rb-profile-job">
            <div className="rb-profile-tag">{user.jobType}</div>
            <h3>{user.jobTitle}</h3>
            <div className="rb-cv-box">
              <span className="rb-cv-icon">📄</span>
              <div>
                <strong>{user.cvFile}</strong>
                <p>Curriculum allegato dal candidato</p>
              </div>
              <button className="rb-btn-primary" disabled title="Disponibile quando arriverà il backend">
                Scarica CV
              </button>
            </div>
          </div>
        ) : world.id === 'arte' ? (
          <div>
            {user.artType && <div className="rb-profile-tag">{user.artType}</div>}
            {user.bio && <p className="rb-profile-bio">{user.bio}</p>}
            <div className="rb-portfolio-grid">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rb-portfolio-tile" />
              ))}
            </div>
          </div>
        ) : (
          <div>
            {user.gender && <div className="rb-profile-tag">{user.gender === 'donna' ? 'Donna' : 'Uomo'}</div>}
            {user.bio && <p className="rb-profile-bio">{user.bio}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
