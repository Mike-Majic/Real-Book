import { useRef, useState } from 'react';
import { findCityMatch } from '../../data/geo';
import './EventComposer.css';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Form di creazione evento: titolo, città (deve essere una città
// riconosciuta, vedi geo.js — serve a posizionare l'icona quadrata sul
// globo), data/ora, bio e una foto locale (dataURL, come in
// FotografiaColumn). Niente evento senza foto: è quello che appare al
// posto dell'avatar sul marker quadrato.
export default function EventComposer({ user, onOpenAuth, onSubmit, onClose }) {
  const [titolo, setTitolo] = useState('');
  const [citta, setCitta] = useState('');
  const [cittaInvalid, setCittaInvalid] = useState(false);
  const [data, setData] = useState(todayISO());
  const [ora, setOra] = useState('19:00');
  const [bio, setBio] = useState('');
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

  const onFileChosen = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFotoFile(file);
    setFotoPreviewUrl(URL.createObjectURL(file));
  };

  const removeFoto = () => {
    setFotoFile(null);
    setFotoPreviewUrl(null);
  };

  const canSubmit = titolo.trim() && citta.trim() && data && ora && fotoFile;

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    const cittaInfo = findCityMatch(citta);
    if (!cittaInfo) {
      setCittaInvalid(true);
      return;
    }
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError('');
    const { error } = await onSubmit({
      titolo: titolo.trim(),
      citta: cittaInfo.name,
      lat: cittaInfo.lat,
      lng: cittaInfo.lng,
      data,
      ora,
      bio: bio.trim(),
      fotoFile,
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error);
      return;
    }
  };

  return (
    <form className="rb-event-composer" onSubmit={submit}>
      <div className="rb-event-composer-header">
        <h3>Nuovo evento</h3>
        <button type="button" className="rb-event-composer-close" onClick={onClose} aria-label="Chiudi">✕</button>
      </div>

      <input
        type="text"
        placeholder="Titolo dell'evento"
        value={titolo}
        onChange={(e) => setTitolo(e.target.value)}
        onFocus={() => !user && onOpenAuth()}
        maxLength={70}
      />

      <input
        type="text"
        placeholder="Città (es. Roma)"
        value={citta}
        onChange={(e) => {
          setCitta(e.target.value);
          setCittaInvalid(false);
        }}
        className={cittaInvalid ? 'invalid' : ''}
      />
      {cittaInvalid && <p className="rb-event-composer-error">Città non riconosciuta, prova con un'altra grafia.</p>}

      <div className="rb-event-composer-row">
        <input type="date" value={data} min={todayISO()} onChange={(e) => setData(e.target.value)} />
        <input type="time" value={ora} onChange={(e) => setOra(e.target.value)} />
      </div>

      <textarea
        placeholder="Racconta di cosa si tratta..."
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
      />

      {fotoPreviewUrl ? (
        <div className="rb-event-composer-photo-preview">
          <img src={fotoPreviewUrl} alt="Anteprima" />
          <button type="button" onClick={removeFoto} aria-label="Rimuovi foto">✕</button>
        </div>
      ) : (
        <button type="button" className="rb-event-composer-photo-btn" onClick={() => fileInputRef.current?.click()}>
          📷 Aggiungi una foto
        </button>
      )}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={onFileChosen} />

      {submitError && <p className="rb-event-composer-error">⚠️ {submitError}</p>}

      <button type="submit" className="rb-event-composer-submit" disabled={!canSubmit || submitting}>
        {submitting ? 'Pubblicazione...' : 'Pubblica evento'}
      </button>
    </form>
  );
}
