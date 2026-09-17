import { useEffect, useMemo, useState } from 'react';
import TwoColumnSwitcher from '../layout/TwoColumnSwitcher';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import GroupsDirectory from './GroupsDirectory';
import CategoryHub from './CategoryHub';
import EventComposer from './EventComposer';
import EventCard from './EventCard';
import SuggestedUsers from './SuggestedUsers';
import TrendingGroups from './TrendingGroups';
import { resolveAuthor, formatRelativeDate } from './resolveAuthor';
import { getCityInfo } from '../../data/geo';
import { INITIAL_POSTS, INITIAL_COMMENTS, computeRelevance } from '../../data/socialPosts';
import { GROUPS, getGroupById } from '../../data/groups';
import { usersForWorld } from '../../data/mockUsers';
import './SocialFeed.css';

// Ogni tot post "di zona" (tab Per te, con un filtro Dove attivo), si
// intercala il prossimo post in classifica per numero di mi piace (1°, poi
// 2°, ...) tra TUTTI i post esistenti — così chi filtra per regione vede
// comunque cosa va per la maggiore nel resto del mondo Social.
const TRENDING_EVERY = 3;

// Un post è "della zona" se il suo autore ha una città nota che rispetta i
// filtri Dove di Impostazioni (stessa logica già usata altrove in App.jsx
// per gli utenti sul globo, qui applicata ai post). I post senza una città
// nota (es. pubblicati dall'utente loggato in questa demo) non compaiono
// nel feed filtrato per zona: non c'è modo di sapere a quale zona appartengono.
function matchesLocation(post, user, locationFilters) {
  const city = resolveAuthor(post.autoreId, user)?.city;
  if (!city) return false;
  if (locationFilters.city && !city.toLowerCase().includes(locationFilters.city.toLowerCase())) return false;
  const info = getCityInfo(city);
  if (locationFilters.continent && info?.continent !== locationFilters.continent) return false;
  if (locationFilters.region && info?.region !== locationFilters.region) return false;
  return true;
}

// Intercala, ogni TRENDING_EVERY post "di zona", il prossimo post più
// popolare in classifica (per numero di mi piace) tra tutti i post
// esistenti — saltando quelli già presenti nella lista di zona, per non
// mostrare lo stesso post due volte di fila.
function interleaveTrending(regionalPosts, allPosts) {
  const alreadyShown = new Set(regionalPosts.map((p) => p.id));
  const ranking = [...allPosts]
    .filter((p) => !alreadyShown.has(p.id))
    .sort((a, b) => b.mi_piace.length - a.mi_piace.length);

  const items = [];
  let rankIdx = 0;
  regionalPosts.forEach((post, i) => {
    items.push({ post, trendingRank: null });
    if ((i + 1) % TRENDING_EVERY === 0 && rankIdx < ranking.length) {
      items.push({ post: ranking[rankIdx], trendingRank: rankIdx + 1 });
      rankIdx += 1;
    }
  });
  return items;
}

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

let uidCounter = 0;
function makeId(prefix) {
  uidCounter += 1;
  return `${prefix}-${Date.now()}-${uidCounter}`;
}

const FEED_TABS = [
  { id: 'foryou', label: 'Per te' },
  { id: 'following', label: 'Seguiti' },
  { id: 'groups', label: 'Gruppi' },
  { id: 'saved', label: 'Salvati' },
  { id: 'eventi', label: '📅 Eventi' },
  { id: 'mondi', label: '🌍 Mondi' },
];

// Mondo Social (Blu): colonna sinistra = feed (Per te / Seguiti / Gruppi /
// Salvati, con scroll infinito), colonna destra = suggerimenti (persone da
// seguire, gruppi di tendenza) + i miei post. Nessun backend: tutto lo stato
// "reale" (post scritti, follow, gruppi, salvati) vive qui ed è persistito
// in localStorage; i post generati per lo scroll infinito sono marcati
// isFiller e non vengono salvati, per non far crescere lo storage all'infinito.
//
// Il filtro Dove (continente/regione/città) di Impostazioni agisce solo sul
// tab "Per te": in quel caso mostra i post della zona con i più popolari di
// tutto il mondo Social intercalati ogni 3 (vedi interleaveTrending). Gli
// altri tab (Seguiti/Gruppi/Salvati) sono per natura già "filtrati" in un
// altro modo (chi segui, il gruppo scelto, cosa hai salvato) e restano
// invariati dal filtro di zona.
export default function SocialFeed({
  world,
  user,
  onOpenAuth,
  locationFilters = {},
  onNavigateToCategory,
  events = [],
  onCreateEvent,
  onToggleEventLike,
  onOpenEventLikers,
}) {
  const [showEventComposer, setShowEventComposer] = useState(false);
  const [posts, setPosts] = useState(() => loadStored('rb-social-posts', INITIAL_POSTS));
  const [comments, setComments] = useState(() => loadStored('rb-social-comments', INITIAL_COMMENTS));
  const [following, setFollowing] = useState(() => loadStored('rb-social-following', []));
  const [joinedGroups, setJoinedGroups] = useState(() => loadStored('rb-social-joined-groups', []));
  const [savedPosts, setSavedPosts] = useState(() => loadStored('rb-social-saved', []));

  const [feedTab, setFeedTab] = useState('foryou');
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [mobileView, setMobileView] = useState('primary');

  useEffect(
    () => localStorage.setItem('rb-social-posts', JSON.stringify(posts.filter((p) => !p.isFiller))),
    [posts]
  );
  useEffect(
    () => localStorage.setItem('rb-social-comments', JSON.stringify(comments.filter((c) => !c.isFiller))),
    [comments]
  );
  useEffect(() => localStorage.setItem('rb-social-following', JSON.stringify(following)), [following]);
  useEffect(() => localStorage.setItem('rb-social-joined-groups', JSON.stringify(joinedGroups)), [joinedGroups]);
  useEffect(() => localStorage.setItem('rb-social-saved', JSON.stringify(savedPosts)), [savedPosts]);

  const createPost = ({ testo, gif, link_esterno, gruppo_id }) => {
    const newPost = {
      id: makeId('post'),
      autoreId: 'me',
      testo,
      data: new Date().toISOString(),
      mi_piace: [],
      commenti: [],
      gif,
      link_esterno,
      gruppo_id: gruppo_id ?? null,
    };
    setPosts((p) => [newPost, ...p]);
  };

  const toggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const has = p.mi_piace.includes('me');
        return { ...p, mi_piace: has ? p.mi_piace.filter((id) => id !== 'me') : [...p.mi_piace, 'me'] };
      })
    );
  };

  const addComment = (postId, { testo, gif }) => {
    const newComment = {
      id: makeId('c'),
      post_id: postId,
      autoreId: 'me',
      testo,
      data: new Date().toISOString(),
      gif,
      reazioni: {},
    };
    setComments((c) => [...c, newComment]);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, commenti: [...p.commenti, newComment.id] } : p)));
  };

  const reactToComment = (commentId, emoji) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const current = c.reazioni?.[emoji] ?? 0;
        return { ...c, reazioni: { ...c.reazioni, [emoji]: current + 1 } };
      })
    );
  };

  const toggleFollow = (userId) => {
    setFollowing((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const toggleJoinGroup = (groupId) => {
    setJoinedGroups((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
  };

  const toggleSavePost = (postId) => {
    setSavedPosts((prev) => (prev.includes(postId) ? prev.filter((id) => id !== postId) : [...prev, postId]));
  };

  // Apre il feed di un gruppo da qualunque punto dell'app (badge su un post,
  // card nella directory, widget "di tendenza" nella colonna destra) e, su
  // mobile, riporta anche alla colonna principale se si veniva dalla destra.
  const openGroup = (groupId) => {
    setActiveGroupId(groupId);
    setMobileView('primary');
  };

  const isGroupView = Boolean(activeGroupId);
  const activeGroup = isGroupView ? getGroupById(activeGroupId) : null;

  // Feed "Per te": i post curati/scritti dagli utenti restano ordinati per
  // pertinenza tra loro; quelli generati per lo scroll infinito si
  // aggiungono in coda (anch'essi ordinati per pertinenza tra loro) così
  // l'ordine di ciò che si è già visto non "salta" mentre se ne carica altro.
  const forYouList = useMemo(() => {
    const curated = posts.filter((p) => !p.isFiller);
    const filler = posts.filter((p) => p.isFiller);
    const byRelevance = (a, b) => computeRelevance(b, comments) - computeRelevance(a, comments);
    return [...curated.sort(byRelevance), ...filler.sort(byRelevance)];
  }, [posts, comments]);

  const hasLocationFilter = Boolean(locationFilters.city || locationFilters.region || locationFilters.continent);

  const regionalForYou = useMemo(() => {
    if (!hasLocationFilter) return [];
    return forYouList.filter((p) => matchesLocation(p, user, locationFilters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forYouList, user, locationFilters.city, locationFilters.region, locationFilters.continent, hasLocationFilter]);

  // Con un filtro di zona attivo, il tab "Per te" mostra i post della zona
  // con i più popolari di tutto il mondo Social intercalati ogni 3; senza
  // filtro resta il feed per pertinenza di sempre (+ scroll infinito).
  const forYouItems = useMemo(() => {
    if (!hasLocationFilter) return forYouList.map((post) => ({ post, trendingRank: null }));
    return interleaveTrending(regionalForYou, posts);
  }, [hasLocationFilter, forYouList, regionalForYou, posts]);

  const followingList = useMemo(
    () =>
      posts
        .filter((p) => following.includes(p.autoreId) || (p.gruppo_id && joinedGroups.includes(p.gruppo_id)))
        .sort((a, b) => new Date(b.data) - new Date(a.data)),
    [posts, following, joinedGroups]
  );

  const savedList = useMemo(
    () => posts.filter((p) => savedPosts.includes(p.id)).sort((a, b) => new Date(b.data) - new Date(a.data)),
    [posts, savedPosts]
  );

  const groupList = useMemo(
    () =>
      activeGroupId
        ? posts
            .filter((p) => p.gruppo_id === activeGroupId)
            .sort((a, b) => computeRelevance(b, comments) - computeRelevance(a, comments))
        : [],
    [posts, comments, activeGroupId]
  );

  const groupPostCounts = useMemo(() => {
    const counts = {};
    posts.forEach((p) => {
      if (!p.isFiller && p.gruppo_id) counts[p.gruppo_id] = (counts[p.gruppo_id] ?? 0) + 1;
    });
    return counts;
  }, [posts]);

  const suggestedUsers = useMemo(
    () => usersForWorld('social').filter((u) => !following.includes(u.id)).slice(0, 4),
    [following]
  );

  const trendingGroups = useMemo(() => [...GROUPS].sort((a, b) => b.memberCount - a.memberCount).slice(0, 4), []);

  // Eventi in ordine di data/ora più vicina, quelli di oggi prima di domani.
  const eventsSorted = useMemo(
    () => [...events].sort((a, b) => new Date(`${a.data}T${a.ora}`) - new Date(`${b.data}T${b.ora}`)),
    [events]
  );

  // Solo il tab "Per te" (senza gruppo aperto) usa gli item con trendingRank;
  // gli altri tab restano liste semplici, qui uniformate alla stessa forma
  // {post, trendingRank} per riusare un solo blocco di rendering.
  const displayedItems = isGroupView
    ? groupList.map((post) => ({ post, trendingRank: null }))
    : feedTab === 'following'
    ? followingList.map((post) => ({ post, trendingRank: null }))
    : feedTab === 'saved'
    ? savedList.map((post) => ({ post, trendingRank: null }))
    : forYouItems;

  const emptyStateMessage = (() => {
    if (isGroupView || displayedItems.length > 0) return null;
    if (feedTab === 'following') return 'Non segui ancora nessuno. Segui qualcuno o iscriviti a un gruppo per vedere qui i loro post.';
    if (feedTab === 'saved') return 'Non hai ancora salvato nessun post. Tocca 🔖 su un post per ritrovarlo qui.';
    return null;
  })();

  // Solo i post pubblicati dall'utente loggato.
  const myPosts = useMemo(
    () => posts.filter((p) => p.autoreId === 'me').sort((a, b) => new Date(b.data) - new Date(a.data)),
    [posts]
  );

  const feedSubtitle =
    feedTab === 'foryou' && !isGroupView && hasLocationFilter
      ? `Post da ${locationFilters.city || locationFilters.region || locationFilters.continent}, con i più popolari di tutto il mondo Social intercalati`
      : 'Cosa succede nel mondo Social';

  const primary = (
    <>
      <div className="rb-social-panel-header">
        <h3>Feed</h3>
        <p>{feedSubtitle}</p>
      </div>

      <div className="rb-feed-tabs">
        {FEED_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`rb-feed-tab-btn ${!isGroupView && feedTab === t.id ? 'active' : ''}`}
            onClick={() => {
              setActiveGroupId(null);
              setFeedTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isGroupView && activeGroup && (
        <div className="rb-group-feed-header" style={{ '--group-color': activeGroup.color }}>
          <button type="button" className="rb-group-back-btn" onClick={() => setActiveGroupId(null)}>
            ← Gruppi
          </button>
          <span className="rb-group-feed-icon">{activeGroup.icon}</span>
          <div className="rb-group-feed-info">
            <strong>{activeGroup.name}</strong>
            <span>
              {(activeGroup.memberCount + (joinedGroups.includes(activeGroup.id) ? 1 : 0)).toLocaleString('it-IT')} membri
            </span>
          </div>
          <button
            type="button"
            className={`rb-group-join-btn ${joinedGroups.includes(activeGroup.id) ? 'joined' : ''}`}
            onClick={() => (user ? toggleJoinGroup(activeGroup.id) : onOpenAuth())}
          >
            {joinedGroups.includes(activeGroup.id) ? 'Iscritto ✓' : 'Iscriviti'}
          </button>
        </div>
      )}

      {feedTab === 'groups' && !isGroupView ? (
        <GroupsDirectory
          groups={GROUPS}
          joinedGroups={joinedGroups}
          postCounts={groupPostCounts}
          user={user}
          onOpenAuth={onOpenAuth}
          onToggleJoin={toggleJoinGroup}
          onOpenGroup={openGroup}
        />
      ) : feedTab === 'mondi' && !isGroupView ? (
        <CategoryHub onNavigateToCategory={onNavigateToCategory} />
      ) : feedTab === 'eventi' && !isGroupView ? (
        <>
          {showEventComposer ? (
            <EventComposer
              user={user}
              onOpenAuth={onOpenAuth}
              onClose={() => setShowEventComposer(false)}
              onSubmit={(data) => {
                onCreateEvent(data);
                setShowEventComposer(false);
              }}
            />
          ) : (
            <button
              type="button"
              className="rb-event-new-btn"
              onClick={() => (user ? setShowEventComposer(true) : onOpenAuth())}
            >
              + Crea un evento
            </button>
          )}

          {eventsSorted.length === 0 && <p className="rb-social-empty">Nessun evento in programma al momento.</p>}
          <ul className="rb-event-list">
            {eventsSorted.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                user={user}
                onOpenAuth={onOpenAuth}
                onToggleLike={onToggleEventLike}
                onOpenLikers={onOpenEventLikers}
              />
            ))}
          </ul>
        </>
      ) : (
        <>
          {feedTab !== 'saved' && (
            <PostComposer user={user} onOpenAuth={onOpenAuth} onSubmit={createPost} groups={GROUPS} defaultGroupId={activeGroupId} />
          )}

          {hasLocationFilter && feedTab === 'foryou' && !isGroupView && regionalForYou.length === 0 && (
            <p className="rb-social-empty">Nessun post ancora da questa zona.</p>
          )}
          {emptyStateMessage && <p className="rb-social-empty">{emptyStateMessage}</p>}

          <ul className="rb-post-list">
            {displayedItems.map(({ post, trendingRank }, i) => (
              <PostCard
                key={`${post.id}-${i}`}
                post={post}
                comments={comments}
                user={user}
                onOpenAuth={onOpenAuth}
                onToggleLike={toggleLike}
                onAddComment={addComment}
                onReactToComment={reactToComment}
                trendingRank={trendingRank}
                following={following}
                onToggleFollow={toggleFollow}
                saved={savedPosts.includes(post.id)}
                onToggleSave={toggleSavePost}
                onOpenGroup={openGroup}
              />
            ))}
          </ul>
        </>
      )}
    </>
  );

  const secondary = (
    <>
      <SuggestedUsers candidates={suggestedUsers} user={user} onOpenAuth={onOpenAuth} onToggleFollow={toggleFollow} />
      <TrendingGroups
        groups={trendingGroups}
        joinedGroups={joinedGroups}
        user={user}
        onOpenAuth={onOpenAuth}
        onToggleJoin={toggleJoinGroup}
        onOpenGroup={openGroup}
      />

      <div className="rb-social-panel-header">
        <h3>I miei post</h3>
        <p>{user ? `${myPosts.length} pubblicati` : 'Accedi per vedere i tuoi post'}</p>
      </div>

      {!user && <p className="rb-social-empty">Accedi per pubblicare e monitorare i tuoi post.</p>}
      {user && myPosts.length === 0 && (
        <p className="rb-social-empty">Non hai ancora pubblicato nulla. Scrivi il tuo primo post nel feed!</p>
      )}

      {user && myPosts.length > 0 && (
        <ul className="rb-mypost-list">
          {myPosts.map((post) => {
            const postComments = comments.filter((c) => c.post_id === post.id);
            const likers = post.mi_piace.map((id) => resolveAuthor(id, user).name);
            return (
              <li key={post.id} className="rb-mypost-card">
                <p className="rb-mypost-text">{post.testo}</p>
                <span className="rb-mypost-date">{formatRelativeDate(post.data)}</span>
                <div className="rb-mypost-stats">
                  <strong>{post.mi_piace.length}</strong> mi piace · <strong>{postComments.length}</strong> commenti
                </div>
                {likers.length > 0 && <p className="rb-mypost-detail">❤️ Piace a: {likers.join(', ')}</p>}
                {postComments.length > 0 && (
                  <ul className="rb-mypost-comment-detail">
                    {postComments.map((c) => (
                      <li key={c.id}>
                        <strong>{resolveAuthor(c.autoreId, user).name}</strong>: {c.testo}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );

  return (
    <div className="rb-social-feed" style={{ '--accent': world.color }}>
      <TwoColumnSwitcher
        primary={primary}
        secondary={secondary}
        primaryLabel="Feed"
        secondaryLabel="I miei post"
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
      />
    </div>
  );
}
