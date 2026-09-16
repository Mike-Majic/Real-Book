import { useState } from 'react';
import { resolveAuthor, formatRelativeDate } from './resolveAuthor';
import { getGroupById } from '../../data/groups';
import LinkPreview from './LinkPreview';
import PostComposer from './PostComposer';
import './PostCard.css';

const REACTION_EMOJIS = ['❤️', '😂', '👍'];

function Comment({ comment, user, onReact }) {
  const author = resolveAuthor(comment.autoreId, user);
  return (
    <li className="rb-comment">
      <img className="rb-comment-avatar" src={author.avatar} alt={author.name} />
      <div className="rb-comment-body">
        <div className="rb-comment-bubble">
          <strong>{author.name}</strong>
          <p>{comment.testo}</p>
          {comment.gif && <img className="rb-comment-gif" src={comment.gif} alt="GIF" />}
        </div>
        <div className="rb-comment-footer">
          <span className="rb-comment-date">{formatRelativeDate(comment.data)}</span>
          {REACTION_EMOJIS.map((emoji) => {
            const count = comment.reazioni?.[emoji] ?? 0;
            return (
              <button key={emoji} type="button" className="rb-comment-react-btn" onClick={() => onReact(comment.id, emoji)}>
                {emoji} {count > 0 ? count : ''}
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}

// Una card del feed: autore, testo, GIF/link eventuali, like e commenti.
// "commentabile da chiunque" = chiunque usi l'app può leggere/commentare
// (feed pubblico), ma mettere like o commentare richiede di essere
// loggati — coerente con come l'app già gestisce le altre interazioni.
export default function PostCard({
  post,
  comments,
  user,
  onOpenAuth,
  onToggleLike,
  onAddComment,
  onReactToComment,
  trendingRank = null,
  following = [],
  onToggleFollow,
  saved = false,
  onToggleSave,
  onOpenGroup,
}) {
  const [expanded, setExpanded] = useState(false);
  const author = resolveAuthor(post.autoreId, user);
  const myId = 'me';
  const liked = post.mi_piace.includes(myId);
  const postComments = comments.filter((c) => c.post_id === post.id);
  const group = post.gruppo_id ? getGroupById(post.gruppo_id) : null;
  // Il pulsante Segui ha senso solo su post di altri utenti reali (non 'me',
  // non autori non risolvibili): serve un id numerico su cui basare il follow.
  const canFollow = typeof post.autoreId === 'number' && onToggleFollow;
  const isFollowing = canFollow && following.includes(post.autoreId);

  const handleLike = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    onToggleLike(post.id);
  };

  const handleFollow = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    onToggleFollow(post.autoreId);
  };

  const handleSave = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    onToggleSave(post.id);
  };

  return (
    <li className="rb-post-card">
      {trendingRank !== null && (
        <span className="rb-post-trending-badge">🔥 #{trendingRank} di tendenza nel mondo Social</span>
      )}
      <div className="rb-post-header">
        <img className="rb-post-avatar" src={author.avatar} alt={author.name} />
        <div className="rb-post-header-info">
          <strong>{author.name}</strong>
          <span className="rb-post-date">{formatRelativeDate(post.data)}</span>
        </div>
        {canFollow && (
          <button type="button" className={`rb-post-follow-btn ${isFollowing ? 'active' : ''}`} onClick={handleFollow}>
            {isFollowing ? 'Segui già' : '+ Segui'}
          </button>
        )}
      </div>

      {group && (
        <button
          type="button"
          className="rb-post-group-badge"
          style={{ '--group-color': group.color }}
          onClick={() => onOpenGroup?.(group.id)}
        >
          {group.icon} {group.name}
        </button>
      )}

      <p className="rb-post-text">{post.testo}</p>
      {post.gif && <img className="rb-post-gif" src={post.gif} alt="GIF" />}
      {post.link_esterno && <LinkPreview url={post.link_esterno.url} />}

      <div className="rb-post-actions">
        <button type="button" className={`rb-post-action-btn ${liked ? 'active' : ''}`} onClick={handleLike}>
          {liked ? '❤️' : '🤍'} {post.mi_piace.length}
        </button>
        <button type="button" className="rb-post-action-btn" onClick={() => setExpanded((v) => !v)}>
          💬 {postComments.length}
        </button>
        {onToggleSave && (
          <button type="button" className={`rb-post-action-btn rb-post-save-btn ${saved ? 'active' : ''}`} onClick={handleSave}>
            {saved ? '🔖 Salvato' : '🔖 Salva'}
          </button>
        )}
      </div>

      {expanded && (
        <div className="rb-post-comments">
          {postComments.length > 0 && (
            <ul className="rb-comment-list">
              {postComments.map((c) => (
                <Comment key={c.id} comment={c} user={user} onReact={onReactToComment} />
              ))}
            </ul>
          )}
          <PostComposer
            user={user}
            onOpenAuth={onOpenAuth}
            onSubmit={(data) => onAddComment(post.id, data)}
            placeholder="Scrivi un commento..."
            submitLabel="Commenta"
            compact
          />
        </div>
      )}
    </li>
  );
}
