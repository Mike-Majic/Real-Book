import { useEffect, useMemo, useState } from 'react';
import WorldGlobe from './components/WorldGlobe';
import TopBar from './components/TopBar';
import SettingsPanel from './components/SettingsPanel';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import ArteExplorer from './components/ArteExplorer';
import BambiniGames from './components/BambiniGames';
import { WORLDS, DEFAULT_WORLD_INDEX } from './data/worlds';
import { usersForWorld } from './data/mockUsers';
import { useSwipeWorld } from './hooks/useSwipeWorld';
import { getCityInfo, findCityMatch } from './data/geo';
import {
  ARTE_CATEGORIES,
  FEATURED_SEARCHES as ARTE_FEATURED,
  CATEGORY_RESULTS as ARTE_RESULTS,
  resolveCategoryQuery as resolveArteCategoryQuery,
} from './data/arteCategories';
import {
  NERD_CATEGORIES,
  FEATURED_SEARCHES as NERD_FEATURED,
  CATEGORY_RESULTS as NERD_RESULTS,
  resolveCategoryQuery as resolveNerdCategoryQuery,
} from './data/nerdCategories';
import './App.css';

const DEFAULT_FILTERS = { gender: 'Tutti', ageMin: 18, ageMax: 60 };
const DEFAULT_JOB_FILTERS = { category: '' };
const DEFAULT_LOCATION_FILTERS = { continent: '', region: '', city: '', distance: 150 };
const DEFAULT_ARTE_FILTER = { category: '', subfamily: '' };
const DEFAULT_VISIBILITY = { nearbyVisible: false };

// Mondi che hanno un proprio set di categorie esplorabili sul globo (triangoli
// cliccabili + colonne di ricerca/persone vicine, via ArteExplorer/CategoryColumn).
// Aggiungere un mondo qui basta a fargli usare lo stesso meccanismo, senza copie.
const CATEGORY_WORLDS = {
  arte: { categories: ARTE_CATEGORIES, featured: ARTE_FEATURED, results: ARTE_RESULTS, resolveQuery: resolveArteCategoryQuery },
  nerd: { categories: NERD_CATEGORIES, featured: NERD_FEATURED, results: NERD_RESULTS, resolveQuery: resolveNerdCategoryQuery },
};

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
  const categorySet = CATEGORY_WORLDS[world.id] ?? null;

  const [user, setUser] = useState(() => loadStored('rb-user', null));
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [filters, setFilters] = useState(() => loadStored('rb-filters', DEFAULT_FILTERS));
  const [jobFilters, setJobFilters] = useState(() => loadStored('rb-job-filters', DEFAULT_JOB_FILTERS));
  const [locationFilters, setLocationFilters] = useState(() => loadStored('rb-location-filters', DEFAULT_LOCATION_FILTERS));
  const [activeArteCategory, setActiveArteCategory] = useState(null);
  const [arteCategoryPositions, setArteCategoryPositions] = useState({});
  const [arteFilter, setArteFilter] = useState(() => loadStored('rb-arte-filter', DEFAULT_ARTE_FILTER));
  const [arteInitialSubfamily, setArteInitialSubfamily] = useState('');
  const [visibility, setVisibility] = useState(() => loadStored('rb-visibility', DEFAULT_VISIBILITY));
  const [flyTo, setFlyTo] = useState(null);

  // Cambiando mondo si azzera la categoria attiva (è sempre relativa al mondo
  // da cui si esce), altrimenti tornando in un mondo con categorie ci si
  // ritroverebbe un triangolo evidenziato senza pannelli aperti.
  useEffect(() => {
    setActiveArteCategory(null);
  }, [world.id]);

  useEffect(() => {
    document.documentElement.style.setProperty('--rb-accent', world.color);
  }, [world]);

  useEffect(() => localStorage.setItem('rb-user', JSON.stringify(user)), [user]);
  useEffect(() => localStorage.setItem('rb-filters', JSON.stringify(filters)), [filters]);
  useEffect(() => localStorage.setItem('rb-job-filters', JSON.stringify(jobFilters)), [jobFilters]);
  useEffect(() => localStorage.setItem('rb-location-filters', JSON.stringify(locationFilters)), [locationFilters]);
  useEffect(() => localStorage.setItem('rb-arte-filter', JSON.stringify(arteFilter)), [arteFilter]);
  useEffect(() => localStorage.setItem('rb-visibility', JSON.stringify(visibility)), [visibility]);

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
    setArteInitialSubfamily('');
    const pos = arteCategoryPositions[cat.id] ?? cat.anchor;
    setFlyTo({ lat: pos.lat, lng: pos.lng, key: `cat-${cat.id}-${Date.now()}` });
  };

  // Applica il filtro Categoria/Sottofamiglia scelto nelle Impostazioni: passa
  // al mondo Arte & Musica se serve, apre la categoria e pre-seleziona la
  // sottofamiglia scelta.
  const applyArteFilter = () => {
    if (!arteFilter.category) return;
    const cat = ARTE_CATEGORIES.find((c) => c.id === arteFilter.category);
    if (!cat) return;
    const arteIndex = WORLDS.findIndex((w) => w.id === 'arte');
    if (arteIndex !== index) setIndex(arteIndex);
    setActiveArteCategory(cat.id);
    setArteInitialSubfamily(arteFilter.subfamily);
    const pos = arteCategoryPositions[cat.id] ?? cat.anchor;
    setFlyTo({ lat: pos.lat, lng: pos.lng, altitude: 1.3, key: `settings-cat-${cat.id}-${Date.now()}` });
  };

  // Selezionare una categoria (dal triangolo sul globo, o riaprendola) vola e
  // zooma su di essa come fa la ricerca; chiuderla torna alla vista larga.
  const toggleArteCategory = (id) => {
    setActiveArteCategory((cur) => {
      const next = cur === id ? null : id;
      if (next) {
        const cat = categorySet?.categories.find((c) => c.id === next);
        setArteInitialSubfamily('');
        const pos = arteCategoryPositions[next] ?? cat?.anchor;
        if (pos) setFlyTo({ lat: pos.lat, lng: pos.lng, altitude: 1.3, key: `cat-${next}-${Date.now()}` });
      } else {
        setFlyTo({ altitude: 2.4, key: `zoom-out-${Date.now()}` });
      }
      return next;
    });
  };

  return (
    <div className="rb-app" style={{ '--accent': world.color }}>
      <TopBar
        world={world}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={() => setUser(null)}
        onOpenSettings={() => {
          if (activeArteCategory) toggleArteCategory(activeArteCategory);
          setSettingsOpen(true);
        }}
      />

      <WorldGlobe
        world={world}
        users={worldUsers}
        onSelectUser={setSelectedUser}
        containerRef={containerRef}
        flyTo={flyTo}
        categories={categorySet?.categories ?? null}
        activeCategory={activeArteCategory}
        onCategorySelect={toggleArteCategory}
        onCategoryPositionsReady={setArteCategoryPositions}
      />

      {categorySet && (
        <ArteExplorer
          world={world}
          categorySet={categorySet}
          activeCategory={activeArteCategory}
          onToggleCategory={toggleArteCategory}
          onSearchCategory={flyToArteCategory}
          initialSubfamily={arteInitialSubfamily}
          locationFilters={locationFilters}
        />
      )}

      {world.id === 'bambini' && <BambiniGames world={world} />}

      <div className={`rb-world-tagline ${categorySet ? 'rb-world-tagline-list' : ''}`}>
        {categorySet
          ? categorySet.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`rb-tagline-cat-btn ${activeArteCategory === c.id ? 'active' : ''}`}
                onClick={() => toggleArteCategory(c.id)}
              >
                {c.label}
              </button>
            ))
          : world.tagline}
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
        onApply={() => {
          applyArteFilter();
          setSettingsOpen(false);
        }}
        filters={filters}
        setFilters={setFilters}
        jobFilters={jobFilters}
        setJobFilters={setJobFilters}
        locationFilters={locationFilters}
        setLocationFilters={setLocationFilters}
        arteFilter={arteFilter}
        setArteFilter={setArteFilter}
        visibility={visibility}
        setVisibility={setVisibility}
        onResetFilters={() => {
          setFilters(DEFAULT_FILTERS);
          setJobFilters(DEFAULT_JOB_FILTERS);
          setLocationFilters(DEFAULT_LOCATION_FILTERS);
          setArteFilter(DEFAULT_ARTE_FILTER);
          setVisibility(DEFAULT_VISIBILITY);
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
