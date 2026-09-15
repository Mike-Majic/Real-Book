import { useEffect, useMemo, useState } from 'react';
import WorldGlobe from './components/WorldGlobe';
import TopBar from './components/TopBar';
import SettingsPanel from './components/SettingsPanel';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import { WORLDS } from './data/worlds';
import { usersForWorld } from './data/mockUsers';
import { useSwipeWorld } from './hooks/useSwipeWorld';
import { getCityInfo, findCityMatch } from './data/geo';
import './App.css';

const DEFAULT_FILTERS = { gender: 'Tutti', continent: '', region: '', ageMin: 18, ageMax: 60, city: '', distance: 100 };
const DEFAULT_JOB_FILTERS = { continent: '', region: '', city: '', distance: 150, category: '' };

// Aspetta che l'utente finisca di digitare prima di far "volare" il globo sulla città cercata.
function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// Piccolo mappamondo (invece di un semplice puntino) per il selettore dei mondi:
// cerchio esterno + meridiano + equatore, colorato con il colore del mondo.
function MiniGlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </svg>
  );
}

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
        const info = getCityInfo(u.city);
        if (filters.continent && info?.continent !== filters.continent) return false;
        if (filters.region && info?.region !== filters.region) return false;
        return true;
      });
    }

    if (world.id === 'lavoro') {
      return base.filter((u) => {
        if (jobFilters.city && !u.city.toLowerCase().includes(jobFilters.city.toLowerCase())) return false;
        if (jobFilters.category && u.jobType !== jobFilters.category) return false;
        const info = getCityInfo(u.city);
        if (jobFilters.continent && info?.continent !== jobFilters.continent) return false;
        if (jobFilters.region && info?.region !== jobFilters.region) return false;
        return true;
      });
    }

    return base;
  }, [world.id, filters, jobFilters]);

  // Quando la città cercata nei filtri corrisponde a una città nota, il globo ci "vola" sopra.
  const activeCityQuery = world.id === 'lavoro' ? jobFilters.city : filters.city;
  const debouncedCityQuery = useDebouncedValue(activeCityQuery, 500);
  const flyTo = useMemo(() => {
    const match = findCityMatch(debouncedCityQuery);
    return match ? { lat: match.lat, lng: match.lng, key: match.name } : null;
  }, [debouncedCityQuery]);

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
        flyTo={flyTo}
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
          >
            <MiniGlobeIcon />
          </button>
        ))}
      </nav>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        filters={filters}
        setFilters={setFilters}
        jobFilters={jobFilters}
        setJobFilters={setJobFilters}
        onResetFilters={() => {
          setFilters(DEFAULT_FILTERS);
          setJobFilters(DEFAULT_JOB_FILTERS);
        }}
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
