import { useEffect, useMemo, useState } from 'react';
import TwoColumnSwitcher from '../layout/TwoColumnSwitcher';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import { resolveAuthor, formatRelativeDate } from './resolveAuthor';
import { getCityInfo } from '../../data/geo';
import { INITIAL_POSTS, INITIAL_COMMENTS, computeRelevance } from '../../data/socialPosts';
import './SocialFeed.css';

// Ogni tot post filtrati per zona, si intercala il prossimo post in
// classifica per numero di mi piace (1°, poi 2°, ...) tra TUTTI i post
// esistenti, non solo quelli della zona — così chi filtra per regione vede
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

// Mondo Social (Blu): colonna sinistra = feed globale (Fase B), colonna
// destra = i miei post pubblicati, con dettaglio di chi ha messo like e
// commentato (Fase C) — stesso TwoColumnSwitcher già usato da Arte &
// Musica/Nerd/Bambini, non ricostruito da zero. Stato di post/commenti
// tenuto qui (nessun backend) e persistito in localStorage.
export default function SocialFeed({ world, user, onOpenAuth, locationFilters = {} }) {
  const [posts, setPosts] = useState(() => loadStored('rb-social-posts', INITIAL_POSTS));
  const [comments, setComments] = useState(() => loadStored('rb-social-comments', INITIAL_COMMENTS));

  useEffect(() => localStorage.setItem('rb-social-posts', JSON.stringify(posts)), [posts]);
  useEffect(() => localStorage.setItem('rb-social-comments', JSON.stringify(comments)), [comments]);

  const createPost = ({ testo, gif, link_esterno }) => {
    const newPost = {
      id: makeId('post'),
      autoreId: 'me',
      testo,
      data: new Date().toISOString(),
      mi_piace: [],
      commenti: [],
      gif,
      link_esterno,
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

  // Fase B: feed globale ordinato per pertinenza (like + commenti, con peso
  // maggiore ai post recenti — vedi computeRelevance).
  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => computeRelevance(b, comments) - computeRelevance(a, comments)),
    [posts, comments]
  );

  const hasLocationFilter = Boolean(locationFilters.city || locationFilters.region || locationFilters.continent);

  const regionalPosts = useMemo(() => {
    if (!hasLocationFilter) return [];
    return sortedPosts.filter((p) => matchesLocation(p, user, locationFilters));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedPosts, user, locationFilters.city, locationFilters.region, locationFilters.continent, hasLocationFilter]);

  // Con un filtro di zona attivo, il feed è "post della zona" con i più
  // popolari di tutto il mondo Social intercalati ogni 3; senza filtro
  // resta il feed globale per pertinenza di sempre.
  const feedItems = useMemo(() => {
    if (!hasLocationFilter) return sortedPosts.map((post) => ({ post, trendingRank: null }));
    return interleaveTrending(regionalPosts, posts);
  }, [hasLocationFilter, sortedPosts, regionalPosts, posts]);

  // Fase C: solo i post pubblicati dall'utente loggato.
  const myPosts = useMemo(
    () => posts.filter((p) => p.autoreId === 'me').sort((a, b) => new Date(b.data) - new Date(a.data)),
    [posts]
  );

  const primary = (
    <>
      <div className="rb-social-panel-header">
        <h3>Feed</h3>
        <p>
          {hasLocationFilter
            ? `Post da ${locationFilters.city || locationFilters.region || locationFilters.continent}, con i più popolari di tutto il mondo Social intercalati`
            : 'Cosa succede nel mondo Social'}
        </p>
      </div>
      <PostComposer user={user} onOpenAuth={onOpenAuth} onSubmit={createPost} />

      {hasLocationFilter && regionalPosts.length === 0 && (
        <p className="rb-social-empty">Nessun post ancora da questa zona.</p>
      )}

      <ul className="rb-post-list">
        {feedItems.map(({ post, trendingRank }, i) => (
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
          />
        ))}
      </ul>
    </>
  );

  const secondary = (
    <>
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
      <TwoColumnSwitcher primary={primary} secondary={secondary} primaryLabel="Feed" secondaryLabel="I miei post" />
    </div>
  );
}
