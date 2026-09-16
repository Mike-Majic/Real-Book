import { useRef, useState } from 'react';
import MediaEditor from './social/MediaEditor';
import { SEED_PHOTOS } from '../data/artePhotos';
import { MOCK_USERS } from '../data/mockUsers';
import { GROUPS } from '../data/groups';
import { publishPhotoPost } from '../data/socialPostsBridge';
import './FotografiaColumn.css';

const SOCIAL_USERS = MOCK_USERS.filter((u) => u.worlds.includes('social'));

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// Selettore dei tag: persone e gruppi del mondo Blu, filtrabili per nome,
// mostrati come chip da attivare/disattivare con un click. Elenco piccolo
// (10 persone + i gruppi), niente autocomplete server: basta filtrare in
// memoria.
function TagPicker({ selectedUserIds, selectedGroupIds, onToggleUser, onToggleGroup }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const users = q ? SOCIAL_USERS.filter((u) => u.name.toLowerCase().includes(q)) : SOCIAL_USERS;
  const groups = q ? GROUPS.filter((g) => g.name.toLowerCase().includes(q)) : GROUPS;

  return (
    <div className="rb-foto-tagpicker">
      <input
        type="text"
        placeholder="Cerca persone o gruppi del mondo Social da taggare..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="rb-foto-tagpicker-chips">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            className={`rb-foto-tag-chip ${selectedUserIds.includes(u.id) ? 'active' : ''}`}
            onClick={() => onToggleUser(u.id)}
          >
            👤 {u.name}
          </button>
        ))}
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`rb-foto-tag-chip ${selectedGroupIds.includes(g.id) ? 'active' : ''}`}
            onClick={() => onToggleGroup(g.id)}
          >
            {g.icon} {g.name}
          </button>
        ))}
        {users.length === 0 && groups.length === 0 && <span className="rb-foto-tag-empty">Nessun risultato</span>}
      </div>
    </div>
  );
}

// Fotografia in stile Pinterest (mondo Arte & Musica): griglia a mattoni di
// foto, con caricamento SOLO da qui (mai dal mondo Social direttamente). Se
// una foto viene taggata a persone/gruppi del mondo Blu, compare anche
// nella sua bacheca (vedi publishPhotoPost) — resta comunque un caricamento
// del mondo Arte, non social.
export default function FotografiaColumn({ user, onOpenAuth }) {
  const [photos, setPhotos] = useState(() => loadStored('rb-arte-photos', []));
  const [showForm, setShowForm] = useState(false);
  const [draftSrc, setDraftSrc] = useState(null);
  const [caption, setCaption] = useState('');
  const [tagUserIds, setTagUserIds] = useState([]);
  const [tagGroupIds, setTagGroupIds] = useState([]);
  const [editing, setEditing] = useState(false);
  const fileInputRef = useRef(null);

  const persist = (next) => {
    setPhotos(next);
    localStorage.setItem('rb-arte-photos', JSON.stringify(next));
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
    const reader = new FileReader();
    reader.onload = () => {
      setDraftSrc(reader.result);
      setShowForm(true);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setShowForm(false);
    setDraftSrc(null);
    setCaption('');
    setTagUserIds([]);
    setTagGroupIds([]);
  };

  const publish = () => {
    if (!draftSrc) return;
    const newPhoto = {
      id: `photo-${Date.now()}`,
      dataUrl: draftSrc,
      caption: caption.trim(),
      creatorName: user?.name ?? 'Tu',
      height: 240 + Math.round(Math.random() * 120),
      data: new Date().toISOString(),
    };
    persist([newPhoto, ...photos]);

    if (tagUserIds.length > 0 || tagGroupIds.length > 0) {
      const userLabels = SOCIAL_USERS.filter((u) => tagUserIds.includes(u.id)).map((u) => u.name);
      const groupLabels = GROUPS.filter((g) => tagGroupIds.includes(g.id)).map((g) => g.name);
      publishPhotoPost({
        testo: caption.trim(),
        foto: draftSrc,
        gruppoId: tagGroupIds[0] ?? null,
        fotoTagLabels: [...userLabels, ...groupLabels],
      });
    }
    resetForm();
  };

  return (
    <div className="rb-foto-column">
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFileChosen} />

      <div className="rb-foto-header">
        <div>
          <h3>Fotografia</h3>
          <p>In stile Pinterest: scatti della community, taggabili a persone e gruppi del mondo Social.</p>
        </div>
        <button type="button" className="rb-foto-upload-btn" onClick={openPicker}>+ Carica foto</button>
      </div>

      {showForm && draftSrc && (
        <div className="rb-foto-form">
          <img className="rb-foto-form-preview" src={draftSrc} alt="Anteprima" />
          <button type="button" className="rb-foto-edit-btn" onClick={() => setEditing(true)}>✏️ Modifica</button>
          <textarea
            placeholder="Didascalia (facoltativa)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
          />
          <TagPicker
            selectedUserIds={tagUserIds}
            selectedGroupIds={tagGroupIds}
            onToggleUser={(id) => setTagUserIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
            onToggleGroup={(id) => setTagGroupIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
          />
          {(tagUserIds.length > 0 || tagGroupIds.length > 0) && (
            <p className="rb-foto-form-hint">Con almeno un tag, questa foto comparirà anche nella bacheca del mondo Social.</p>
          )}
          <div className="rb-foto-form-actions">
            <button type="button" className="rb-foto-form-cancel" onClick={resetForm}>Annulla</button>
            <button type="button" className="rb-foto-form-publish" onClick={publish}>Pubblica</button>
          </div>
        </div>
      )}

      <div className="rb-foto-masonry">
        {photos.map((p) => (
          <figure key={p.id} className="rb-foto-card" style={{ height: p.height }}>
            <img src={p.dataUrl} alt={p.caption || 'Foto'} />
            <figcaption>
              {p.caption && <span className="rb-foto-caption">{p.caption}</span>}
              <span className="rb-foto-creator">{p.creatorName}</span>
            </figcaption>
          </figure>
        ))}
        {SEED_PHOTOS.map((p) => (
          <figure key={p.id} className="rb-foto-card" style={{ height: p.height, background: p.gradient }}>
            <figcaption>
              <span className="rb-foto-caption">{p.caption}</span>
              <span className="rb-foto-creator">{p.creatorName}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {editing && (
        <MediaEditor
          type="photo"
          src={draftSrc}
          onCancel={() => setEditing(false)}
          onSave={(newSrc) => {
            setDraftSrc(newSrc);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
