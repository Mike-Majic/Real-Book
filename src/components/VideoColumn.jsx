import { useEffect, useRef, useState } from 'react';
import MediaEditor from './social/MediaEditor';
import { publishContent, listContentsForPlacement, toggleContentLike } from '../data/contents';
import { analyzeImageElement, extractVideoFrame } from '../data/localVision';
import './VideoColumn.css';

function loadVideoElement(src) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.onloadeddata = () => resolve(video);
    video.onerror = reject;
    video.src = src;
    video.load();
  });
}

// Chiave che identifica un posizionamento (mondo + categoria + sottofamiglia).
function placementKey(p) {
  return `${p.world}:${p.category ?? ''}:${p.subfamily ?? ''}`;
}

// Video del mondo Arte & Musica: caricati su Supabase (data/contents.js),
// non più come object URL locali (che si perdevano ricaricando la pagina) —
// ora restano davvero. Al caricamento si estrae un fotogramma e si analizza
// gratis nel browser (data/localVision.js) per suggerire tag e altri mondi
// dove ripubblicare lo stesso video (like sempre condivisi, mai duplicati).
export default function VideoColumn({ user, onOpenAuth }) {
  const [videos, setVideos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [draftFile, setDraftFile] = useState(null);
  const [draftUrl, setDraftUrl] = useState(null);
  const [trim, setTrim] = useState(null);
  const [title, setTitle] = useState('');
  const [editing, setEditing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [extraPlacements, setExtraPlacements] = useState([]);
  const [confirmedPlacements, setConfirmedPlacements] = useState(new Set());
  const [manualTagsText, setManualTagsText] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const refresh = () => {
    listContentsForPlacement({ world: 'arte', category: 'video' }).then(setVideos);
  };
  useEffect(refresh, []);

  const openPicker = (ref) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    ref.current?.click();
  };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setDraftFile(file);
    setDraftUrl(previewUrl);
    setTrim(null);
    setShowForm(true);
    setSuggestedTags([]);
    setExtraPlacements([]);
    setConfirmedPlacements(new Set());
    setAnalyzing(true);
    try {
      const videoEl = await loadVideoElement(previewUrl);
      const frame = await extractVideoFrame(videoEl);
      const result = await analyzeImageElement(frame);
      setSuggestedTags(result.tags);
      setExtraPlacements(result.placements);
      setConfirmedPlacements(new Set(result.placements.map(placementKey)));
    } catch {
      // Analisi non riuscita: si può comunque pubblicare, solo senza suggerimenti.
    } finally {
      setAnalyzing(false);
    }
  };

  const togglePlacement = (key) => {
    setConfirmedPlacements((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const resetForm = () => {
    setShowForm(false);
    setDraftFile(null);
    setDraftUrl(null);
    setTrim(null);
    setTitle('');
    setSuggestedTags([]);
    setExtraPlacements([]);
    setConfirmedPlacements(new Set());
    setManualTagsText('');
    setPublishError(null);
  };

  const publish = async () => {
    if (!draftFile || publishing) return;
    setPublishing(true);
    setPublishError(null);
    const manualTags = manualTagsText.split(',').map((t) => t.trim()).filter(Boolean);
    const allTags = Array.from(new Set([...suggestedTags, ...manualTags]));
    const chosenExtra = extraPlacements.filter((p) => confirmedPlacements.has(placementKey(p)));
    const placements = [{ world: 'arte', category: 'video' }, ...chosenExtra];
    const { error } = await publishContent({
      file: draftFile,
      type: 'video',
      caption: title.trim(),
      tags: allTags,
      placements,
    });
    setPublishing(false);
    if (error) {
      setPublishError(error);
      return;
    }
    resetForm();
    refresh();
  };

  const handleLike = async (video) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    const { liked, error } = await toggleContentLike(video.id, video.likedByMe);
    if (error) return;
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, likedByMe: liked, likeCount: v.likeCount + (liked ? 1 : -1) } : v))
    );
  };

  return (
    <div className="rb-video-column">
      <input
        ref={cameraInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        capture="environment"
        hidden
        onChange={onFileChosen}
      />
      <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/quicktime" hidden onChange={onFileChosen} />

      <div className="rb-video-header">
        <div>
          <h3>Video</h3>
          <p>Clip brevi della community. Modifica gratuita: solo un taglio inizio/fine, niente montaggio pesante.</p>
        </div>
        <div className="rb-video-upload-btns">
          <button type="button" className="rb-video-upload-btn" onClick={() => openPicker(cameraInputRef)}>📹 Registra</button>
          <button type="button" className="rb-video-upload-btn" onClick={() => openPicker(fileInputRef)}>🎬 Galleria</button>
        </div>
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

          {analyzing && <p className="rb-video-trim-hint">Sto analizzando il contenuto (gratis, nel browser)...</p>}
          {!analyzing && suggestedTags.length > 0 && (
            <p className="rb-video-trim-hint">Tag suggeriti: {suggestedTags.map((t) => `#${t}`).join(' ')}</p>
          )}
          {!analyzing &&
            extraPlacements.map((p) => {
              const key = placementKey(p);
              return (
                <label key={key} className="rb-video-placement-row">
                  <input type="checkbox" checked={confirmedPlacements.has(key)} onChange={() => togglePlacement(key)} />
                  Pubblica anche in {p.label}
                </label>
              );
            })}
          <input
            type="text"
            className="rb-video-manual-tags-input"
            placeholder="Aggiungi i tuoi tag, separati da virgola (facoltativo)"
            value={manualTagsText}
            onChange={(e) => setManualTagsText(e.target.value)}
          />

          <input
            type="text"
            placeholder="Titolo (facoltativo)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
          />
          {publishError && <p className="rb-video-form-error">⚠️ {publishError}</p>}
          <div className="rb-video-form-actions">
            <button type="button" className="rb-video-form-cancel" onClick={resetForm}>Annulla</button>
            <button type="button" className="rb-video-form-publish" onClick={publish} disabled={publishing}>
              {publishing ? 'Pubblicazione...' : 'Pubblica'}
            </button>
          </div>
        </div>
      )}

      <ul className="rb-video-grid">
        {videos.map((v) => (
          <li key={v.id} className="rb-video-card">
            <video src={v.url} controls />
            <div className="rb-video-card-info">
              <strong>{v.caption || 'Senza titolo'}</strong>
              <button type="button" className="rb-video-like-btn" onClick={() => handleLike(v)}>
                {v.likedByMe ? '❤️' : '🤍'} {v.likeCount}
              </button>
            </div>
          </li>
        ))}
        {videos.length === 0 && <p className="rb-video-empty">Nessun video ancora in questa categoria.</p>}
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
