import { useEffect, useMemo, useState } from 'react';
import { MOCK_USERS } from '../data/mockUsers';
import { CONTENT_INTERACTIONS } from '../data/contentInteractions';
import { findCityMatch, getCityInfo, distanceKm } from '../data/geo';
import './CategoryColumn.css';

// Layout desktop (due colonne affiancate) solo se ENTRAMBE le condizioni sono
// vere: orizzontale E almeno 700px di larghezza. Una tavoletta in verticale,
// o un telefono ruotato ma stretto, restano nel layout mobile.
const DESKTOP_QUERY = '(orientation: landscape) and (min-width: 700px)';

function useIsDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function SwitchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 7l-4 5 4 5" />
      <path d="M16 7l4 5-4 5" />
    </svg>
  );
}

// Componente unico e parametrizzato per esplorare una categoria: riceve
// l'oggetto categoria (nome, sottofamiglie...) più i suoi contenuti/ricerche
// in evidenza come prop, senza importare i dati di un mondo specifico. Usato
// da qualunque mondo con un proprio set di categorie (Arte & Musica, Nerd, e
// futuri) — nessuna copia per categoria né per mondo. Montare con
// key={category.id} così lo stato di ricerca/filtro riparte pulito ogni volta
// che cambia la categoria attiva.
//
// Colonna principale (sinistra su desktop, prima su mobile): contenuti della
// categoria a livello globale, ricerca + suggerimenti + lista risultati.
// Colonna secondaria (destra su desktop, raggiungibile con lo switch su
// mobile): persone vicine (secondo il filtro Distanza di Impostazioni) che
// hanno messo mi piace o parteciperò a un contenuto della categoria — solo
// chi ha attivato "Visibile agli altri utenti vicino a te".
//
// Desktop (orizzontale + largo): due colonne affiancate, come prima.
// Mobile (verticale, o stretto anche in orizzontale): una sola colonna a
// piena larghezza (di default la principale), con una maniglia fissa sul
// bordo destro che scorre per mostrare la colonna secondaria.
export default function CategoryColumn({ category, initialSubfamily = '', locationFilters = {}, featured = [], allResults = [] }) {
  const [resultsQuery, setResultsQuery] = useState('');
  const [subfamilyFilter, setSubfamilyFilter] = useState(initialSubfamily);
  const [mobileView, setMobileView] = useState('results'); // 'results' | 'nearby'
  const isDesktop = useIsDesktopLayout();

  const results = useMemo(() => {
    return allResults.filter((r) => {
      if (subfamilyFilter && r.subfamily !== subfamilyFilter) return false;
      if (!resultsQuery.trim()) return true;
      const q = resultsQuery.trim().toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.creator.toLowerCase().includes(q) ||
        r.subfamily.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [allResults, resultsQuery, subfamilyFilter]);

  // La "tua posizione" per il calcolo delle vicinanze è la città impostata nel
  // filtro "Dove" di Impostazioni (lo stesso usato altrove per gli altri
  // mondi). Senza una città impostata non c'è un punto di riferimento, quindi
  // la colonna mostra un suggerimento invece di una lista finta di "vicini".
  const myCity = useMemo(() => findCityMatch(locationFilters?.city ?? ''), [locationFilters?.city]);
  const maxDistanceKm = locationFilters?.distance ?? 150;

  const nearbyPeople = useMemo(() => {
    if (!myCity) return [];
    return CONTENT_INTERACTIONS
      .filter((it) => it.categoryId === category.id)
      .map((it) => {
        const person = MOCK_USERS.find((u) => u.id === it.userId);
        const content = allResults.find((r) => r.id === it.contentId);
        return person && content ? { ...it, person, content } : null;
      })
      .filter(Boolean)
      .filter(({ person }) => person.visibleNearby)
      .filter(({ person }) => {
        const info = getCityInfo(person.city);
        if (!info) return false;
        return distanceKm(myCity.lat, myCity.lng, info.lat, info.lng) <= maxDistanceKm;
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [category.id, allResults, myCity, maxDistanceKm]);

  const resultsContent = (
    <>
      <div className="rb-arte-panel-header">
        <h3>{category.label}</h3>
      </div>

      {featured.length > 0 && (
        <div className="rb-arte-suggestion-row">
          {featured.map((term) => (
            <button key={term} className="rb-arte-suggestion-chip" onClick={() => setResultsQuery(term)}>
              {term}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        className="rb-arte-search-input"
        placeholder={`Cerca in ${category.label}...`}
        value={resultsQuery}
        onChange={(e) => setResultsQuery(e.target.value)}
      />

      <div className="rb-arte-subfamily-row">
        <button
          className={`rb-arte-subfamily-chip ${subfamilyFilter === '' ? 'active' : ''}`}
          onClick={() => setSubfamilyFilter('')}
        >
          Tutti
        </button>
        {category.subfamilies.map((sf) => (
          <button
            key={sf}
            className={`rb-arte-subfamily-chip ${subfamilyFilter === sf ? 'active' : ''}`}
            onClick={() => setSubfamilyFilter(subfamilyFilter === sf ? '' : sf)}
          >
            {sf}
          </button>
        ))}
      </div>

      <ul className="rb-arte-results-list">
        {results.length === 0 && <li className="rb-arte-no-results">Nessun risultato.</li>}
        {results.map((r) => (
          <li key={r.id} className="rb-arte-result-card">
            <div className="rb-arte-result-thumb" />
            <div>
              <strong>{r.title}</strong>
              <p>{r.creator}</p>
              <span>{r.subfamily} · {r.year}</span>
              <p className="rb-arte-result-desc">{r.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );

  const nearbyContent = (
    <>
      {!isDesktop && (
        <button className="rb-arte-mobile-back" onClick={() => setMobileView('results')}>
          ← Torna a {category.label}
        </button>
      )}
      <div className="rb-arte-panel-header">
        <h3>Persone vicine</h3>
        <p>Chi, vicino a te, segue {category.label}</p>
      </div>

      {!myCity && (
        <p className="rb-arte-no-results">
          Imposta la tua città nel filtro "Dove" di Impostazioni per vedere chi è nelle vicinanze.
        </p>
      )}

      {myCity && nearbyPeople.length === 0 && (
        <p className="rb-arte-no-results">Nessuno nelle vicinanze per ora, in questa categoria.</p>
      )}

      {myCity && nearbyPeople.length > 0 && (
        <ul className="rb-arte-nearby-list">
          {nearbyPeople.map(({ id, person, content, type }) => (
            <li key={id} className="rb-arte-nearby-card">
              <img className="rb-arte-nearby-avatar" src={person.avatar} alt={person.name} />
              <div>
                <strong>{person.name}</strong>
                <p>{type === 'parteciperò' ? `Parteciperà a ${content.title}` : `Gli piace ${content.title}`}</p>
                <span>{person.city}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (isDesktop) {
    return (
      <>
        <aside className="rb-arte-panel rb-arte-panel-left">{resultsContent}</aside>
        <aside className="rb-arte-panel rb-arte-panel-right">{nearbyContent}</aside>
      </>
    );
  }

  return (
    <div className="rb-arte-mobile-stage">
      <div className={`rb-arte-mobile-track ${mobileView === 'nearby' ? 'show-secondary' : ''}`}>
        <div className="rb-arte-mobile-slide">{resultsContent}</div>
        <div className="rb-arte-mobile-slide">{nearbyContent}</div>
      </div>
      <button
        className="rb-arte-edge-handle"
        onClick={() => setMobileView((v) => (v === 'results' ? 'nearby' : 'results'))}
        aria-label={mobileView === 'results' ? 'Mostra persone vicine' : `Torna a ${category.label}`}
        title={mobileView === 'results' ? 'Persone vicine' : category.label}
      >
        <SwitchIcon />
      </button>
    </div>
  );
}
