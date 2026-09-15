import { useEffect, useMemo, useState } from 'react';
import WorldGlobe from './components/WorldGlobe';
import TopBar from './components/TopBar';
import SettingsPanel from './components/SettingsPanel';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import { WORLDS } from './data/worlds';
import { usersForWorld } from './data/mockUsers';
import { useSwipeWorld } from './hooks/useSwipeWorld';
import './App.css';

const DEFAULT_FILTERS = { gender: 'Tutti', ageMin: 18, ageMax: 60, city: '', distance: 100 };
const DEFAULT_JOB_FILTERS = { city: '', distance: 150, category: '' };

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const { index, setIndex, containerRef } = useSwipeWorld(WORLDS.length, 0);
  const world = WORLDS[index];

  const [user, setUser] = useState(() => loadStored('rb-user', null));
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [filters, setFilters] = useState(() => loadStored('rb-filters', DEFAULT_FILTERS));
  const [jobFilters, setJobFilters] = useState(() => loadStored('rb-job-filters', DEFAULT_JOB_FILTERS));

  useEffect(() => {
    document.documentElement.style.setProperty('--rb-accent', world.color);
  }, [world]);

  useEffect(() => localStorage.setItem('rb-user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('rb-filters', JSON.stringify(filters)), [filters]);
  useEffect(() => localStorage.setItem('rb-job-filters', JSON.stringify(jobFilters)), [jobFilters]);

  const worldUsers = useMemo(() => {
    const base = usersForWorld(world.id);

    if (world.id === 'incontri' || world.id === 'social') {
      return base.filter((u) => {
        if (filters.gender !== 'Tutti' && u.gender !== filters.gender.toLowerCase()) return false;
        if (u.age && (u.age < filters.ageMin || u.age > filters.ageMax)) return false;
        if (filters.city && !u.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
        return true;
      });
    }

    if (world.id === 'lavoro') {
      return base.filter((u) => {
        if (jobFilters.city && !u.city.toLowerCase().includes(jobFilters.city.toLowerCase())) return false;
        if (jobFilters.category && u.jobType !== jobFilters.category) return false;
        return true;
      });
    }

    return base;
  }, [world.id, filters, jobFilters]);

  return (
    <div className="rb-app" style={{ '--accent': world.color }}>
      <TopBar
        world={world}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={() => setUser(null)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <WorldGlobe
        world={world}
        users={worldUsers}
        onSelectUser={setSelectedUser}
        containerRef={containerRef}
      />

      <div className="rb-world-tagline">{world.tagline}</div>

      <nav className="rb-world-dots" aria-label="Cambia mondo">
        {WORLDS.map((w, i) => (
          <button
            key={w.id}
            className={`rb-world-dot ${i === index ? 'active' : ''}`}
            style={{ '--dot-color': w.color }}
            onClick={() => setIndex(i)}
            aria-label={`Vai al mondo ${w.label}`}
            title={w.label}
          />
        ))}
      </nav>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        filters={filters}
        setFilters={setFilters}
        jobFilters={jobFilters}
        setJobFilters={setJobFilters}
      />

      <ProfileModal user={selectedUser} world={world} onClose={() => setSelectedUser(null)} />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLogin={(u) => {
          setUser(u);
          setAuthOpen(false);
        }}
      />
    </div>
  );
}
