import { useEffect, useMemo, useState } from 'react';
import TwoColumnSwitcher from '../layout/TwoColumnSwitcher';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import { resolveAuthor, formatRelativeDate } from './resolveAuthor';
import { INITIAL_POSTS, INITIAL_COMMENTS, computeRelevance } from '../../data/socialPosts';
import './SocialFeed.css';

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
export default function SocialFeed({ world, user, onOpenAuth }) {
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

  // Fase C: solo i post pubblicati dall'utente loggato.
  const myPosts = useMemo(
    () => posts.filter((p) => p.autoreId === 'me').sort((a, b) => new Date(b.data) - new Date(a.data)),
    [posts]
  );

  const primary = (
    <>
      <div className="rb-social-panel-header">
        <h3>Feed</h3>
        <p>Cosa succede nel mondo Social</p>
      </div>
      <PostComposer user={user} onOpenAuth={onOpenAuth} onSubmit={createPost} />
      <ul className="rb-post-list">
        {sortedPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            comments={comments}
            user={user}
            onOpenAuth={onOpenAuth}
            onToggleLike={toggleLike}
            onAddComment={addComment}
            onReactToComment={reactToComment}
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
