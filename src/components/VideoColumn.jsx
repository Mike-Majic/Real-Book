import { useRef, useState } from 'react';
import MediaEditor from './social/MediaEditor';
import { SEED_VIDEOS } from '../data/arteVideos';
import './VideoColumn.css';

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Video del mondo Arte & Musica: niente backend, quindi i video caricati
// vivono come object URL del browser — validi solo per la sessione
// corrente (si perdono ricaricando la pagina), a differenza delle foto che
// restano come dataURL persistite in localStorage. Solo i metadati (titolo,
// autore, taglio scelto) sono salvati stabilmente.
export default function VideoColumn({ user, onOpenAuth }) {
  const [videos, setVideos] = useState(() => {
    const stored = loadStored('rb-arte-videos-meta', []);
    // Gli object URL non sopravvivono al reload: i video già caricati in
    // sessioni precedenti restano visibili come voce ma senza anteprima.
    return stored.map((v) => ({ ...v, objectUrl: null }));
  });
  const [showForm, setShowForm] = useState(false);
  const [draftUrl, setDraftUrl] = useState(null);
  const [trim, setTrim] = useState(null);
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef(null);

  const persistMeta = (next) => {
    localStorage.setItem('rb-arte-videos-meta', JSON.stringify(next.map(({ objectUrl, ...meta }) => meta)));
  };

  const openPicker = () => {
    if (!user) {
      onOpenAuth();
      return;
    }
    fileInputRef.current?.click();
  };

  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setDraftUrl(URL.createObjectURL(file));
    setTrim(null);
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setDraftUrl(null);
    setTrim(null);
    setTitle('');
  };

  const publish = () => {
    if (!draftUrl) return;
    const newVideo = {
      id: `video-${Date.now()}`,
      objectUrl: draftUrl,
      title: title.trim() || 'Senza titolo',
      creatorName: user?.name ?? 'Tu',
      trimStart: trim?.trimStart ?? 0,
      trimEnd: trim?.trimEnd ?? null,
      data: new Date().toISOString(),
    };
    const next = [newVideo, ...videos];
    setVideos(next);
    persistMeta(next);
    resetForm();
  };

  return (
    <div className="rb-video-column">
      <input ref={fileInputRef} type="file" accept="video/*" hidden onChange={onFileChosen} />

      <div className="rb-video-header">
        <div>
          <h3>Video</h3>
          <p>Clip brevi della community. Modifica gratuita: solo un taglio inizio/fine, niente montaggio pesante.</p>
        </div>
        <button type="button" className="rb-video-upload-btn" onClick={openPicker}>+ Carica video</button>
      </div>

      {showForm && draftUrl && (
        <div className="rb-video-form">
          <video
            className="rb-video-form-preview"
            src={draftUrl}
            controls
            onLoadedMetadata={(e) => {
              if (trim?.trimStart) e.target.currentTime = trim.trimStart;
            }}
          />
          <button type="button" className="rb-video-edit-btn" onClick={() => setEditing(true)}>✂️ Taglia</button>
          {trim && (
            <p className="rb-video-trim-hint">
              Taglio impostato: {trim.trimStart.toFixed(1)}s → {trim.trimEnd.toFixed(1)}s
            </p>
          )}
          <input
            type="text"
            placeholder="Titolo (facoltativo)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
          />
          <div className="rb-video-form-actions">
            <button type="button" className="rb-video-form-cancel" onClick={resetForm}>Annulla</button>
            <button type="button" className="rb-video-form-publish" onClick={publish}>Pubblica</button>
          </div>
        </div>
      )}

      <ul className="rb-video-grid">
        {videos.map((v) => (
          <li key={v.id} className="rb-video-card">
            {v.objectUrl ? (
              <video src={v.objectUrl} controls />
            ) : (
              <div className="rb-video-card-placeholder">🎥</div>
            )}
            <div className="rb-video-card-info">
              <strong>{v.title}</strong>
              <span>{v.creatorName}</span>
            </div>
          </li>
        ))}
        {SEED_VIDEOS.map((v) => (
          <li key={v.id} className="rb-video-card">
            <div className="rb-video-card-placeholder" style={{ background: v.gradient }}>
              ▶ {v.duration}
            </div>
            <div className="rb-video-card-info">
              <strong>{v.title}</strong>
              <span>{v.creatorName}</span>
            </div>
          </li>
        ))}
      </ul>

      {editing && (
        <MediaEditor
          type="video"
          src={draftUrl}
          onCancel={() => setEditing(false)}
          onSave={({ trimStart, trimEnd }) => {
            setTrim({ trimStart, trimEnd });
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
