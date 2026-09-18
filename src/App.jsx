import { useEffect, useMemo, useRef, useState } from 'react';
import WorldGlobe, { CATEGORY_FLY_MS } from './components/WorldGlobe';
import TopBar from './components/TopBar';
import SettingsPanel from './components/SettingsPanel';
import ProfileModal from './components/ProfileModal';
import AuthModal from './components/AuthModal';
import ArteExplorer from './components/ArteExplorer';
import BambiniGameExplorer from './components/BambiniGameExplorer';
import SocialWorldExplorer from './components/social/SocialWorldExplorer';
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
import { BAMBINI_CATEGORIES, resolveCategoryQuery as resolveBambiniCategoryQuery } from './games/registry';
import { INCONTRI_CATEGORIES, resolveCategoryQuery as resolveIncontriCategoryQuery } from './data/incontriCategories';
import { SOCIAL_CATEGORIES, resolveCategoryQuery as resolveSocialCategoryQuery } from './data/socialCategories';
import IncontriLiveExplorer from './components/incontri/IncontriLiveExplorer';
import AccessGate from './components/AccessGate';
import { isAdult } from './data/age';
import { SEED_EVENTS, isEventExpired } from './data/events';
import { isStaff } from './data/roles';
import EventLikersModal from './components/EventLikersModal';
import FriendChatModal from './components/FriendChatModal';
import FriendsModal from './components/FriendsModal';
import AdminPanel from './components/AdminPanel';
import ProfileSettingsPanel from './components/ProfileSettingsPanel';
import { getCurrentAccount, subscribeAuthChanges, logoutAccount } from './data/accounts';
import {
  getFriends,
  getSentRequests,
  getReceivedRequests,
  sendFriendRequest as sendFriendRequestApi,
  removeFriend as removeFriendApi,
} from './data/friends';
import { getUnreadCounts, getDirectConversationsMap, subscribeToOwnMessages } from './data/directChat';
import { supabase } from './data/supabaseClient';
import './App.css';

const DEFAULT_FILTERS = { gender: 'Tutti', ageMin: 18, ageMax: 60 };
const DEFAULT_LOCATION_FILTERS = { continent: '', region: '', city: '', distance: 150 };
const DEFAULT_ARTE_FILTER = { category: '', subfamily: '' };
const DEFAULT_VISIBILITY = { nearbyVisible: false, shareLiveLocation: false };

// Mondi che hanno un proprio set di categorie esplorabili sul globo (triangoli
// cliccabili + colonne di ricerca/persone vicine, via ArteExplorer/CategoryColumn).
// Aggiungere un mondo qui basta a fargli usare lo stesso meccanismo, senza copie.
const CATEGORY_WORLDS = {
  arte: { categories: ARTE_CATEGORIES, featured: ARTE_FEATURED, results: ARTE_RESULTS, resolveQuery: resolveArteCategoryQuery },
  nerd: { categories: NERD_CATEGORIES, featured: NERD_FEATURED, results: NERD_RESULTS, resolveQuery: resolveNerdCategoryQuery },
  // Bambini non ha colonne di contenuti (featured/results): i "triangoli"
  // sono i minigiochi stessi, aperti tramite BambiniGameExplorer.
  bambini: { categories: BAMBINI_CATEGORIES, resolveQuery: resolveBambiniCategoryQuery },
  // Incontri: solo "Live" per ora, apre la chat invece di colonne di contenuti.
  incontri: { categories: INCONTRI_CATEGORIES, resolveQuery: resolveIncontriCategoryQuery },
  // Social: solo "World", apre il feed esistente invece di CategoryColumn.
  social: { categories: SOCIAL_CATEGORIES, resolveQuery: resolveSocialCategoryQuery },
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
  // Mentre un minigioco del mondo Bambini è aperto, lo swipe/le frecce non
  // devono cambiare mondo: alcuni giochi (es. Snake) usano le stesse frecce
  // per i propri controlli.
  const [gameplayActive, setGameplayActive] = useState(false);
  const { index, setIndex, containerRef } = useSwipeWorld(WORLDS.length, DEFAULT_WORLD_INDEX, gameplayActive);
  const world = WORLDS[index];
  const categorySet = CATEGORY_WORLDS[world.id] ?? null;
  // Incontri e Lavoro sono riservati ai maggiorenni: l'età è quella vera
  // dell'account (data di nascita in registrazione), non più una
  // dichiarazione con un pulsante.
  const isAgeGatedWorld = world.id === 'incontri' || world.id === 'lavoro';

  // L'account loggato vive su Supabase Auth, non più in localStorage: alla
  // partenza si controlla se il browser ha già una sessione valida
  // (persistita da supabase-js per conto suo) e ci si iscrive ai cambi di
  // sessione (login/logout/refresh token), così lo stato resta sempre
  // coerente anche se scade o cambia altrove.
  const [user, setUser] = useState(null);
  const [justConfirmedEmail, setJustConfirmedEmail] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [filters, setFilters] = useState(() => loadStored('rb-filters', DEFAULT_FILTERS));
  const [locationFilters, setLocationFilters] = useState(() => loadStored('rb-location-filters', DEFAULT_LOCATION_FILTERS));
  const [activeArteCategory, setActiveArteCategory] = useState(null);
  const [arteCategoryPositions, setArteCategoryPositions] = useState({});
  const [arteFilter, setArteFilter] = useState(() => loadStored('rb-arte-filter', DEFAULT_ARTE_FILTER));
  const [arteInitialSubfamily, setArteInitialSubfamily] = useState('');
  const [visibility, setVisibility] = useState(() => loadStored('rb-visibility', DEFAULT_VISIBILITY));
  // Posizione reale del dispositivo, aggiornata in continuo solo mentre
  // "Condividi la mia posizione in tempo reale" è attivo nelle Impostazioni
  // (vedi effect più sotto). Senza consenso attivo non si chiede mai il
  // permesso al browser, e il proprio marker semplicemente non appare sul
  // globo — nessuna posizione "finta" o salvata altrove.
  const [ownPosition, setOwnPosition] = useState(null);
  const geoWatchIdRef = useRef(null);
  const [flyTo, setFlyTo] = useState(null);
  // Eventi del mondo Social e sistema di amicizie: sollevati qui (non dentro
  // SocialFeed) perché servono anche a WorldGlobe (marker quadrato sul
  // globo) e ai due sono montati insieme quando si è nel mondo Social —
  // niente localStorage-bridge come per le foto di Arte, qui serve stato
  // condiviso in tempo reale.
  const [events, setEvents] = useState(() => loadStored('rb-events', SEED_EVENTS));
  // Amicizie e richieste: id soltanto (nomi/avatar li risolve chi li mostra
  // davvero, vedi FriendsModal) — servono qui solo per i controlli rapidi
  // "è già amico?"/"gli ho già scritto?" sparsi nell'app (EventLikersModal,
  // Impostazioni Privacy).
  const [friends, setFriends] = useState([]);
  const [friendRequestsSent, setFriendRequestsSent] = useState([]);
  const [receivedRequestsCount, setReceivedRequestsCount] = useState(0);
  // Non letti per conversazione diretta (id conversazione -> numero) e
  // mappa amico -> conversazione, per mostrare il badge sulla riga giusta
  // nella lista Amici e il totale sull'icona 👥.
  const [unreadByConversation, setUnreadByConversation] = useState(new Map());
  const [friendConversations, setFriendConversations] = useState(new Map());
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const [eventLikersId, setEventLikersId] = useState(null);
  const [activeFriendChatId, setActiveFriendChatId] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  // Timer del pannello che deve ancora aprirsi a volo finito (vedi
  // flyToCategoryThenOpen): tenerlo in un ref per poterlo annullare se nel
  // frattempo si sceglie un'altra categoria o si cambia mondo.
  const pendingOpenRef = useRef(null);
  // Apertura categoria in sospeso quando la navigazione richiede PRIMA un
  // cambio di mondo (vedi navigateToCategory): si esegue in un effect
  // separato, dopo quello qui sotto che azzera activeArteCategory al cambio
  // mondo, altrimenti quell'effect cancellerebbe il timer appena creato
  // (stesso giro di render: world.id cambia, l'effect di reset gira e
  // troverebbe già pendingOpenRef.current impostato dalla nuova apertura).
  const pendingCategoryNavRef = useRef(null);

  // Cambiando mondo si azzera la categoria attiva (è sempre relativa al mondo
  // da cui si esce), altrimenti tornando in un mondo con categorie ci si
  // ritroverebbe un triangolo evidenziato senza pannelli aperti.
  useEffect(() => {
    if (pendingOpenRef.current) {
      clearTimeout(pendingOpenRef.current);
      pendingOpenRef.current = null;
    }
    setActiveArteCategory(null);
    return () => {
      if (pendingOpenRef.current) {
        clearTimeout(pendingOpenRef.current);
        pendingOpenRef.current = null;
      }
    };
  }, [world.id]);

  // Esegue l'apertura categoria rimasta in sospeso da navigateToCategory,
  // ora che il mondo è davvero cambiato e l'effect sopra ha già ripulito lo
  // stato del mondo precedente.
  useEffect(() => {
    if (!pendingCategoryNavRef.current) return;
    const openCategory = pendingCategoryNavRef.current;
    pendingCategoryNavRef.current = null;
    openCategory();
  }, [world.id]);

  useEffect(() => {
    document.documentElement.style.setProperty('--rb-accent', world.color);
  }, [world]);

  // Se chi ha aperto il backend si disconnette (o non è più owner/moderatore,
  // es. l'owner lo declassa da un altro account), il pannello si chiude da solo.
  useEffect(() => {
    if (adminOpen && !isStaff(user?.ruolo)) setAdminOpen(false);
  }, [user, adminOpen]);

  // Ripristina la sessione già salvata dal browser (se c'è) e resta in
  // ascolto di login/logout/refresh — vedi il commento sopra alla
  // dichiarazione di `user`. Se si arriva qui dal link di conferma mail,
  // Supabase mette i token di sessione nell'hash dell'URL: supabase-js li
  // legge da solo e logga subito, qui si nota solo che è successo (per il
  // banner) e si ripulisce l'hash dalla barra degli indirizzi.
  useEffect(() => {
    if (window.location.hash.includes('type=signup')) {
      setJustConfirmedEmail(true);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    let cancelled = false;
    getCurrentAccount().then((account) => {
      if (!cancelled) setUser(account);
    });
    const unsubscribe = subscribeAuthChanges((account) => setUser(account));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!justConfirmedEmail) return undefined;
    const timer = setTimeout(() => setJustConfirmedEmail(false), 6000);
    return () => clearTimeout(timer);
  }, [justConfirmedEmail]);

  useEffect(() => localStorage.setItem('rb-filters', JSON.stringify(filters)), [filters]);
  useEffect(() => localStorage.setItem('rb-location-filters', JSON.stringify(locationFilters)), [locationFilters]);
  useEffect(() => localStorage.setItem('rb-arte-filter', JSON.stringify(arteFilter)), [arteFilter]);
  useEffect(() => localStorage.setItem('rb-visibility', JSON.stringify(visibility)), [visibility]);
  useEffect(() => localStorage.setItem('rb-events', JSON.stringify(events)), [events]);

  // Amicizie/richieste reali (Supabase): ricaricate ad ogni cambio utente
  // (login/logout), e su richiesta esplicita dopo un'azione da FriendsModal
  // (inviata/accettata/rifiutata/rimossa un'amicizia).
  const refreshFriendsState = () => {
    if (!user) {
      setFriends([]);
      setFriendRequestsSent([]);
      setReceivedRequestsCount(0);
      return;
    }
    getFriends().then((list) => setFriends(list.map((f) => f.id)));
    getSentRequests().then((list) => setFriendRequestsSent(list.map((r) => r.toId)));
    getReceivedRequests().then((list) => setReceivedRequestsCount(list.length));
  };
  useEffect(refreshFriendsState, [user?.id]);

  // Badge "non letti": ricaricati ad ogni login/logout, poi aggiornati in
  // tempo reale da un canale globale (RLS limita già ai messaggi delle
  // proprie conversazioni) così il totale sull'icona 👥 e i badge per amico
  // si aggiornano anche a chat chiusa.
  const refreshUnread = () => {
    if (!user) {
      setUnreadByConversation(new Map());
      setFriendConversations(new Map());
      return;
    }
    getUnreadCounts().then(setUnreadByConversation);
    getDirectConversationsMap().then(setFriendConversations);
  };
  useEffect(refreshUnread, [user?.id]);

  useEffect(() => {
    if (!user) return undefined;
    const channel = subscribeToOwnMessages(() => refreshUnread());
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const totalUnreadMessages = useMemo(() => {
    let total = 0;
    for (const n of unreadByConversation.values()) total += n;
    return total;
  }, [unreadByConversation]);

  const unreadByFriend = useMemo(() => {
    const map = new Map();
    for (const [friendId, convId] of friendConversations) {
      const n = unreadByConversation.get(convId);
      if (n) map.set(friendId, n);
    }
    return map;
  }, [friendConversations, unreadByConversation]);

  // Traccia la posizione reale del dispositivo solo mentre l'utente ha
  // attivato "Condividi la mia posizione in tempo reale" nelle Impostazioni:
  // il permesso al browser si chiede solo a quel momento, mai prima. Se lo
  // disattiva, si smette subito di osservare (clearWatch) e il marker
  // sparisce dal globo. Se il permesso viene negato, il toggle si rimette
  // da solo su spento.
  useEffect(() => {
    if (!user || !visibility.shareLiveLocation || !navigator.geolocation) {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      setOwnPosition(null);
      return undefined;
    }

    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setOwnPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setOwnPosition(null);
        setVisibility((v) => ({ ...v, shareLiveLocation: false }));
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, [user, visibility.shareLiveLocation]);

  // Un evento sparisce (dal globo e dalla colonna) a fine giornata della sua
  // data, in automatico: ricalcolato ad ogni render invece che con un timer
  // che ticchetta, la granularità è "un giorno" quindi non serve altro.
  const visibleEvents = useMemo(() => events.filter((e) => !isEventExpired(e)), [events]);

  const createEvent = ({ titolo, citta, lat, lng, data, ora, bio, foto }) => {
    const newEvent = {
      id: `evento-${Date.now()}`,
      autoreId: 'me',
      titolo,
      citta,
      lat,
      lng,
      data,
      ora,
      bio,
      foto,
      gradient: null,
      mi_piace: [],
    };
    setEvents((prev) => [newEvent, ...prev]);
  };

  const toggleEventLike = (eventId) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        const has = e.mi_piace.includes('me');
        return { ...e, mi_piace: has ? e.mi_piace.filter((id) => id !== 'me') : [...e.mi_piace, 'me'] };
      })
    );
  };

  const sendFriendRequest = async (userId) => {
    const { error } = await sendFriendRequestApi(userId);
    if (error) return;
    setFriendRequestsSent((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
  };

  const worldUsers = useMemo(() => {
    const base = usersForWorld(world.id);

    const matchesLocation = (u) => {
      if (locationFilters.city && !u.city.toLowerCase().includes(locationFilters.city.toLowerCase())) return false;
      const info = getCityInfo(u.city);
      if (locationFilters.continent && info?.continent !== locationFilters.continent) return false;
      if (locationFilters.region && info?.region !== locationFilters.region) return false;
      return true;
    };

    return base.filter((u) => {
      if (filters.gender !== 'Tutti' && u.gender !== filters.gender.toLowerCase()) return false;
      if (u.age && (u.age < filters.ageMin || u.age > filters.ageMax)) return false;
      return matchesLocation(u);
    });
  }, [world.id, filters, locationFilters]);

  // Il proprio marker (quando si condivide la posizione in tempo reale) si
  // aggiunge SOPRA ai risultati già filtrati, non dentro: i propri filtri
  // (genere/età/posizione) servono a scoprire gli altri, non a nascondere
  // se stessi dal globo. Se però il mondo corrente non è tra quelli
  // abilitati dall'account (Impostazioni → Personalizza → Mondi), il
  // marker non deve comparire lì per nessuno: disattivare un mondo vuol
  // dire anche sparire da quel mondo agli occhi degli altri.
  const globeUsers = useMemo(() => {
    if (!user || !visibility.shareLiveLocation || !ownPosition) return worldUsers;
    if (!(user.mondiAbilitati ?? []).includes(world.id)) return worldUsers;
    const ownMarker = {
      id: 'me-live',
      name: user.nickname ?? user.name ?? 'Io',
      avatar: user.avatar,
      city: 'La mia posizione',
      country: '',
      lat: ownPosition.lat,
      lng: ownPosition.lng,
      isLive: true,
    };
    return [...worldUsers, ownMarker];
  }, [worldUsers, user, visibility.shareLiveLocation, ownPosition]);

  // Quando la città cercata nei filtri (globali, validi per tutti i mondi) corrisponde
  // a una città nota, il globo ci "vola" sopra.
  const debouncedCityQuery = useDebouncedValue(locationFilters.city, 500);
  useEffect(() => {
    const match = findCityMatch(debouncedCityQuery);
    if (match) setFlyTo({ lat: match.lat, lng: match.lng, key: `city-${match.name}` });
  }, [debouncedCityQuery]);

  // Fa volare la camera sulla categoria e apre il pannello solo a volo
  // finito (stessa durata dell'animazione in WorldGlobe): prima si vede il
  // mondo girare e centrarsi, poi si aprono le colonne — un po' di
  // scenografia, invece del pannello che scatta subito mentre il globo si
  // muove ancora. Vale ovunque si scelga una categoria: pulsante in basso a
  // sinistra, triangolo sul globo, ricerca, scorciatoia da Impostazioni.
  const flyToCategoryThenOpen = (id, pos) => {
    if (pendingOpenRef.current) clearTimeout(pendingOpenRef.current);
    setActiveArteCategory(null);
    setFlyTo({ lat: pos.lat, lng: pos.lng, altitude: 1.3, key: `cat-${id}-${Date.now()}` });
    pendingOpenRef.current = setTimeout(() => {
      setActiveArteCategory(id);
      pendingOpenRef.current = null;
    }, CATEGORY_FLY_MS);
  };

  // Cercando una categoria nel mondo Arte & Musica, il globo vola sul suo triangolo.
  // Si usa la posizione reale del triangolo assegnato (non la "anchor" originale,
  // perché la categoria viene agganciata al triangolo più vicino, non a quel punto
  // esatto), così la camera centra davvero il triangolo e non finisce ai suoi bordi.
  const flyToArteCategory = (cat) => {
    setArteInitialSubfamily('');
    const pos = arteCategoryPositions[cat.id] ?? cat.anchor;
    if (pos) flyToCategoryThenOpen(cat.id, pos);
    else setActiveArteCategory(cat.id);
  };

  // Naviga a una categoria di un mondo qualunque (usato dall'hub testuale
  // del mondo Social, e da applyArteFilter qui sotto): se serve cambia
  // mondo prima, poi vola sulla categoria e apre il pannello. Se il mondo
  // di destinazione non è quello attivo, l'apertura vera e propria si
  // rimanda a dopo il cambio mondo (vedi pendingCategoryNavRef sopra) — non
  // si può volare/aprire nello stesso giro perché arteCategoryPositions
  // appartiene ancora al mondo che si sta lasciando. Uscendo dal mondo
  // Social, SocialFeed si smonta da solo (è mostrato solo quando
  // world.id === 'social'): è così che "si chiudono le colonne".
  const navigateToCategory = (worldId, categoryId, initialSubfamily = '') => {
    const targetIndex = WORLDS.findIndex((w) => w.id === worldId);
    if (targetIndex === -1) return;
    const cat = CATEGORY_WORLDS[worldId]?.categories.find((c) => c.id === categoryId);
    if (!cat) return;
    const sameWorld = targetIndex === index;

    const openCategory = () => {
      setArteInitialSubfamily(initialSubfamily);
      // Le posizioni reali dei triangoli (più precise dell'anchor) valgono
      // solo per il mondo già attivo: per un mondo appena raggiunto si usa
      // sempre l'anchor, che WorldGlobe affina non appena calcola i
      // triangoli del nuovo mondo.
      const pos = (sameWorld ? arteCategoryPositions[cat.id] : null) ?? cat.anchor;
      if (pos) flyToCategoryThenOpen(cat.id, pos);
      else setActiveArteCategory(cat.id);
    };

    if (sameWorld) {
      openCategory();
    } else {
      pendingCategoryNavRef.current = openCategory;
      setIndex(targetIndex);
    }
  };

  // Applica il filtro Categoria/Sottofamiglia scelto nelle Impostazioni: passa
  // al mondo Arte & Musica se serve, apre la categoria e pre-seleziona la
  // sottofamiglia scelta.
  const applyArteFilter = () => {
    if (!arteFilter.category) return;
    navigateToCategory('arte', arteFilter.category, arteFilter.subfamily);
  };

  // Selezionare una categoria (dal triangolo sul globo, o dal pulsante in
  // basso a sinistra) vola e zooma su di essa, aprendo il pannello a volo
  // finito; chiuderla (X, o ri-click sulla categoria già aperta) torna
  // subito alla vista larga.
  const toggleArteCategory = (id) => {
    if (pendingOpenRef.current) {
      clearTimeout(pendingOpenRef.current);
      pendingOpenRef.current = null;
    }
    if (id === null || activeArteCategory === id) {
      setActiveArteCategory(null);
      setFlyTo({ altitude: 2.4, key: `zoom-out-${Date.now()}` });
      return;
    }
    setArteInitialSubfamily('');
    const cat = categorySet?.categories.find((c) => c.id === id);
    const pos = arteCategoryPositions[id] ?? cat?.anchor;
    if (pos) flyToCategoryThenOpen(id, pos);
    else setActiveArteCategory(id);
  };

  // Priorità dei gate sul mondo corrente: prima serve un account, poi (solo
  // su Incontri/Lavoro) serve essere maggiorenni, solo dopo conta se
  // l'utente ha scelto di disattivare questo mondo dalle Impostazioni.
  const needsAuthForWorld = !user;
  const ageBlockedForWorld = isAgeGatedWorld && !needsAuthForWorld && !isAdult(user?.dataNascita);
  const worldDisabledByUser = !needsAuthForWorld && !ageBlockedForWorld && !(user.mondiAbilitati ?? []).includes(world.id);

  return (
    <div className="rb-app" style={{ '--accent': world.color }}>
      <TopBar
        world={world}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onLogout={() => {
          logoutAccount();
          setUser(null);
        }}
        onOpenSettings={() => {
          if (activeArteCategory) toggleArteCategory(activeArteCategory);
          setSettingsOpen(true);
        }}
        onOpenAdmin={() => setAdminOpen(true)}
        onOpenProfile={() => setProfileSettingsOpen(true)}
        onOpenFriends={() => setFriendsModalOpen(true)}
        pendingFriendRequestsCount={receivedRequestsCount + totalUnreadMessages}
      />

      {justConfirmedEmail && (
        <div className="rb-email-confirmed-banner">✅ Mail confermata, bentornato su Versemove!</div>
      )}

      <WorldGlobe
        world={world}
        users={globeUsers}
        onSelectUser={setSelectedUser}
        containerRef={containerRef}
        flyTo={flyTo}
        categories={categorySet?.categories ?? null}
        activeCategory={activeArteCategory}
        onCategorySelect={toggleArteCategory}
        onCategoryPositionsReady={setArteCategoryPositions}
        events={world.id === 'social' ? visibleEvents : []}
        onSelectEvent={(eventId) => setEventLikersId(eventId)}
      />

      {categorySet && world.id !== 'bambini' && world.id !== 'incontri' && world.id !== 'social' && (
        <ArteExplorer
          world={world}
          categorySet={categorySet}
          activeCategory={activeArteCategory}
          onToggleCategory={toggleArteCategory}
          onSearchCategory={flyToArteCategory}
          initialSubfamily={arteInitialSubfamily}
          locationFilters={locationFilters}
          user={user}
          onOpenAuth={() => setAuthOpen(true)}
        />
      )}

      {world.id === 'bambini' && (
        <BambiniGameExplorer
          world={world}
          activeCategory={activeArteCategory}
          onToggleCategory={toggleArteCategory}
          onSearchCategory={flyToArteCategory}
          onGameOpenChange={setGameplayActive}
        />
      )}

      {world.id === 'incontri' && isAdult(user?.dataNascita) && (
        <IncontriLiveExplorer
          world={world}
          activeCategory={activeArteCategory}
          onToggleCategory={toggleArteCategory}
          onSearchCategory={flyToArteCategory}
          user={user}
          onOpenAuth={() => setAuthOpen(true)}
          candidateUsers={worldUsers}
        />
      )}

      {world.id === 'social' && (
        <SocialWorldExplorer
          world={world}
          activeCategory={activeArteCategory}
          onToggleCategory={toggleArteCategory}
          onSearchCategory={flyToArteCategory}
          user={user}
          onOpenAuth={() => setAuthOpen(true)}
          locationFilters={locationFilters}
          onNavigateToCategory={navigateToCategory}
          events={visibleEvents}
          onCreateEvent={createEvent}
          onToggleEventLike={toggleEventLike}
          onOpenEventLikers={(eventId) => setEventLikersId(eventId)}
        />
      )}

      {/* Ogni mondo richiede un account per essere esplorato: su Incontri e
          Lavoro si aggiunge anche il controllo dei 18 anni. Nascosto mentre
          AuthModal è aperto (authOpen) — prima restava sopra il modulo
          (z-index più alto) rendendolo inutilizzabile: sembrava che il
          modulo "non si aprisse", e l'unica cosa cliccabile rimaneva
          "Torna indietro", che riportava al mondo Blu. */}
      {!authOpen && !profileSettingsOpen && (needsAuthForWorld || ageBlockedForWorld || worldDisabledByUser) && (
        <AccessGate
          world={world}
          user={user}
          requireAdult={isAgeGatedWorld}
          disabledByUser={worldDisabledByUser}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenSettings={() => setProfileSettingsOpen(true)}
          onDecline={() => setIndex(DEFAULT_WORLD_INDEX)}
        />
      )}

      <div
        className={`rb-world-tagline ${categorySet ? 'rb-world-tagline-list' : ''} ${
          activeArteCategory ? 'rb-world-tagline-behind' : ''
        }`}
      >
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
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onUpdateUser={(account) => setUser({ ...account, name: account.nickname })}
        filters={filters}
        setFilters={setFilters}
        locationFilters={locationFilters}
        setLocationFilters={setLocationFilters}
        arteFilter={arteFilter}
        setArteFilter={setArteFilter}
        visibility={visibility}
        setVisibility={setVisibility}
        onResetFilters={() => {
          setFilters(DEFAULT_FILTERS);
          setLocationFilters(DEFAULT_LOCATION_FILTERS);
          setArteFilter(DEFAULT_ARTE_FILTER);
          setVisibility(DEFAULT_VISIBILITY);
        }}
        friends={friends}
        onUnfriend={(id) => {
          removeFriendApi(id);
          setFriends((prev) => prev.filter((f) => f !== id));
        }}
      />

      {friendsModalOpen && (
        <FriendsModal
          onClose={() => setFriendsModalOpen(false)}
          onOpenChat={(friendId) => {
            setFriendsModalOpen(false);
            setActiveFriendChatId(friendId);
          }}
          onFriendsChanged={refreshFriendsState}
          unreadByFriend={unreadByFriend}
        />
      )}

      <ProfileModal
        user={selectedUser}
        world={world}
        onClose={() => setSelectedUser(null)}
        viewer={user}
        onOpenAuth={() => setAuthOpen(true)}
      />

      <EventLikersModal
        event={visibleEvents.find((e) => e.id === eventLikersId) ?? null}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        friends={friends}
        friendRequestsSent={friendRequestsSent}
        onSendRequest={sendFriendRequest}
        onOpenChat={(friendId) => {
          setEventLikersId(null);
          setActiveFriendChatId(friendId);
        }}
        onClose={() => setEventLikersId(null)}
      />

      {activeFriendChatId && (
        <FriendChatModal
          friendId={activeFriendChatId}
          user={user}
          onClose={() => setActiveFriendChatId(null)}
          onMessagesRead={refreshUnread}
        />
      )}

      {adminOpen && <AdminPanel user={user} onClose={() => setAdminOpen(false)} />}

      <ProfileSettingsPanel
        open={profileSettingsOpen}
        onClose={() => setProfileSettingsOpen(false)}
        user={user}
        onUpdateUser={(account) => setUser({ ...account, name: account.nickname })}
      />

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
