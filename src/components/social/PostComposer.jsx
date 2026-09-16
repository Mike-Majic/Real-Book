import { useEffect, useState } from 'react';
import EmojiPicker from './EmojiPicker';
import GifPicker from './GifPicker';
import './PostComposer.css';

// Composer riusato sia per scrivere un nuovo post sia per scrivere un
// commento (compact=true): testo obbligatorio (o almeno una GIF), emoji e
// GIF tramite i due picker della Fase A, link esterno opzionale (Fase D si
// occupa di anteprima/conferma, qui si salva solo l'URL).
export default function PostComposer({
  user,
  onOpenAuth,
  onSubmit,
  placeholder = 'A cosa stai pensando?',
  submitLabel = 'Pubblica',
  compact = false,
  // Passato solo dal composer principale del feed (non da quello dei
  // commenti): permette di scegliere se pubblicare in bacheca generale o
  // in uno dei gruppi, come iscriversi/postare in un subreddit.
  groups = null,
  defaultGroupId = null,
}) {
  const [text, setText] = useState('');
  const [gif, setGif] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [groupId, setGroupId] = useState(defaultGroupId);

  // Se si apre il feed di un gruppo diverso, il composer riparte
  // preselezionando quel gruppo (non lo stato interno di prima).
  useEffect(() => setGroupId(defaultGroupId), [defaultGroupId]);

  const requireAuth = () => {
    if (!user) {
      onOpenAuth();
      return true;
    }
    return false;
  };

  const canSubmit = text.trim().length > 0 || !!gif;

  const submit = (e) => {
    e.preventDefault();
    if (requireAuth() || !canSubmit) return;
    onSubmit({
      testo: text.trim(),
      gif,
      link_esterno: linkUrl.trim() ? { url: linkUrl.trim() } : null,
      gruppo_id: groups ? groupId : undefined,
    });
    setText('');
    setGif(null);
    setLinkUrl('');
    setShowLinkInput(false);
    setShowGifPicker(false);
    if (groups) setGroupId(defaultGroupId);
  };

  return (
    <form className={`rb-post-composer ${compact ? 'compact' : ''}`} onSubmit={submit}>
      {groups && (
        <select
          className="rb-composer-group-select"
          value={groupId ?? ''}
          onChange={(e) => setGroupId(e.target.value || null)}
          onFocus={() => requireAuth()}
          aria-label="Pubblica in"
        >
          <option value="">🌐 Bacheca generale</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.icon} {g.name}
            </option>
          ))}
        </select>
      )}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => requireAuth()}
        placeholder={placeholder}
        rows={compact ? 2 : 3}
      />

      {gif && (
        <div className="rb-composer-gif-preview">
          <img src={gif} alt="GIF selezionata" />
          <button type="button" onClick={() => setGif(null)} aria-label="Rimuovi GIF">✕</button>
        </div>
      )}

      {showLinkInput && (
        <input
          type="url"
          className="rb-composer-link-input"
          placeholder="Incolla un link (facoltativo)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
        />
      )}

      <div className="rb-composer-toolbar">
        <div className="rb-composer-toolbar-left">
          <EmojiPicker onSelect={(emoji) => setText((t) => t + emoji)} />
          <button
            type="button"
            className="rb-composer-icon-btn rb-composer-gif-btn"
            onClick={() => (requireAuth() ? null : setShowGifPicker((v) => !v))}
            aria-label="Aggiungi una GIF"
            title="GIF"
          >
            GIF
          </button>
          <button
            type="button"
            className="rb-composer-icon-btn"
            onClick={() => (requireAuth() ? null : setShowLinkInput((v) => !v))}
            aria-label="Aggiungi un link"
            title="Link"
          >
            🔗
          </button>
        </div>
        <button type="submit" className="rb-composer-submit" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>

      {showGifPicker && (
        <GifPicker
          onSelect={(url) => {
            setGif(url);
            setShowGifPicker(false);
          }}
          onClose={() => setShowGifPicker(false)}
        />
      )}
    </form>
  );
}
