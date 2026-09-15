import { useEffect, useMemo, useState } from 'react';
import WorldGlobe from './components/WorldGlobe';
import TopBar from './components/TopBar';
import SettingsPanel from './components/SettingsPanel';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import ArteExplorer from './components/ArteExplorer';
import { WORLDS, DEFAULT_WORLD_INDEX } from './data/worlds';
import { usersForWorld } from './data/mockUsers';
import { useSwipeWorld } from './hooks/useSwipeWorld';
import { getCityInfo, findCityMatch } from './data/geo';
import { ARTE_CATEGORIES } from './data/arteCategories';
import './App.css';

const DEFAULT_FILTERS = { gender: 'Tutti', ageMin: 18, ageMax: 60 };
const DEFAULT_JOB_FILTERS = { category: '' };
const DEFAULT_LOCATION_FILTERS = { continent: '', region: '', city: '', distance: 150 };

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
  const { index, setIndex, containerRef } = useSwipeWorld(WORLDS.length, DEFAULT_WORLD_INDEX);
  const world = WORLDS[index];

  const [user, setUser] = useState(() => loadStored('rb-user', null));
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [filters, setFilters] = useState(() => loadStored('rb-filters', DEFAULT_FILTERS));
  const [jobFilters, setJobFilters] = useState(() => loadStored('rb-job-filters', DEFAULT_JOB_FILTERS));
  const [locationFilters, setLocationFilters] = useState(() => loadStored('rb-location-filters', DEFAULT_LOCATION_FILTERS));
  const [activeArteCategory, setActiveArteCategory] = useState(null);
  const [arteCategoryPositions, setArteCategoryPositions] = useState({});
  const [flyTo, setFlyTo] = useState(null);

  // Uscendo dal mondo Arte & Musica si azzera la categoria attiva, altrimenti
  // tornandoci si ritroverebbe un triangolo evidenziato senza pannelli aperti.
  useEffect(() => {
    if (world.id !== 'arte') setActiveArteCategory(null);
  }, [world.id]);

  useEffect(() => {
    document.documentElement.style.setProperty('--rb-accent', world.color);
  }, [world]);

  useEffect(() => localStorage.setItem('rb-user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('rb-filters', JSON.stringify(filters)), [filters]);
  useEffect(() => localStorage.setItem('rb-job-filters', JSON.stringify(jobFilters)), [jobFilters]);
  useEffect(() => localStorage.setItem('rb-location-filters', JSON.stringify(locationFilters)), [locationFilters]);

  const worldUsers = useMemo(() => {
    const base = usersForWorld(world.id);

    const matchesLocation = (u) => {
      if (locationFilters.city && !u.city.toLowerCase().includes(locationFilters.city.toLowerCase())) return false;
      const info = getCityInfo(u.city);
      if (locationFilters.continent && info?.continent !== locationFilters.continent) return false;
      if (locationFilters.region && info?.region !== locationFilters.region) return false;
      return true;
    };

    if (world.id === 'incontri' || world.id === 'social') {
      return base.filter((u) => {
        if (filters.gender !== 'Tutti' && u.gender !== filters.gender.toLowerCase()) return false;
        if (u.age && (u.age < filters.ageMin || u.age > filters.ageMax)) return false;
        return matchesLocation(u);
      });
    }

    if (world.id === 'lavoro') {
      return base.filter((u) => {
        if (jobFilters.category && u.jobType !== jobFilters.category) return false;
        return matchesLocation(u);
      });
    }

    return base;
  }, [world.id, filters, jobFilters, locationFilters]);

  // Quando la città cercata nei filtri (globali, validi per tutti i mondi) corrisponde
  // a una città nota, il globo ci "vola" sopra.
  const debouncedCityQuery = useDebouncedValue(locationFilters.city, 500);
  useEffect(() => {
    const match = findCityMatch(debouncedCityQuery);
    if (match) setFlyTo({ lat: match.lat, lng: match.lng, key: `city-${match.name}` });
  }, [debouncedCityQuery]);

  // Cercando una categoria nel mondo Arte & Musica, il globo vola sul suo triangolo.
  // Si usa la posizione reale del triangolo assegnato (non la "anchor" originale,
  // perché la categoria viene agganciata al triangolo più vicino, non a quel punto
  // esatto), così la camera centra davvero il triangolo e non finisce ai suoi bordi.
  const flyToArteCategory = (cat) => {
    setActiveArteCategory(cat.id);
    const pos = arteCategoryPositions[cat.id] ?? cat.anchor;
    setFlyTo({ lat: pos.lat, lng: pos.lng, key: `cat-${cat.id}-${Date.now()}` });
  };

  const toggleArteCategory = (id) => {
    setActiveArteCategory((cur) => (cur === id ? null : id));
  };

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
        categories={world.id === 'arte' ? ARTE_CATEGORIES : null}
        activeCategory={activeArteCategory}
        onCategorySelect={toggleArteCategory}
        onCategoryPositionsReady={setArteCategoryPositions}
      />

      {world.id === 'arte' && (
        <ArteExplorer
          world={world}
          activeCategory={activeArteCategory}
          onToggleCategory={toggleArteCategory}
          onSearchCategory={flyToArteCategory}
        />
      )}

      <div className="rb-world-tagline">
        {world.id === 'arte' ? ARTE_CATEGORIES.map((c) => c.label).join(', ') : world.tagline}
      </div>

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
        locationFilters={locationFilters}
        setLocationFilters={setLocationFilters}
        onResetFilters={() => {
          setFilters(DEFAULT_FILTERS);
          setJobFilters(DEFAULT_JOB_FILTERS);
          setLocationFilters(DEFAULT_LOCATION_FILTERS);
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
