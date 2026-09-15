import { useState } from 'react';
import './GifPicker.css';

// Le GIF arrivano SOLO da GIPHY con il filtro contenuti più severo attivo
// (rating=g, "General audiences") e non è mai disattivabile da qui: nessuna
// ricerca gif senza filtro. La chiave usata è la chiave pubblica di prova
// che GIPHY stessa pubblica per demo/beta (dc6zaTOxFJmzC) — per un'app in
// produzione andrebbe sostituita con una chiave propria e magari passata
// dal server, non incorporata nel bundle.
const GIPHY_API_KEY = 'dc6zaTOxFJmzC';
const SAFE_RATING = 'g';

export default function GifPicker({ onSelect, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query.trim())}&limit=12&rating=${SAFE_RATING}&lang=it`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`richiesta fallita (${res.status})`);
      const data = await res.json();
      setResults(data.data ?? []);
    } catch {
      setError('Impossibile cercare le GIF ora. Riprova più tardi.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rb-gif-picker">
      {/* Un <div>, non un <form>: GifPicker viene montato dentro il <form>
          del composer (post o commento), e un form annidato dentro un altro
          non è HTML valido — il submit/invio non funzionerebbe in modo
          affidabile. */}
      <div className="rb-gif-search-row">
        <input
          type="text"
          placeholder="Cerca una GIF..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
          autoFocus
        />
        <button type="button" className="rb-gif-search-btn" onClick={search}>Cerca</button>
        <button type="button" className="rb-gif-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
      </div>

      <p className="rb-gif-safe-note">🛡️ Solo contenuti adatti a tutti (filtro famiglia sempre attivo)</p>

      {loading && <p className="rb-gif-status">Cerco...</p>}
      {error && <p className="rb-gif-status rb-gif-error">{error}</p>}
      {!loading && !error && searched && results.length === 0 && (
        <p className="rb-gif-status">Nessuna GIF trovata.</p>
      )}

      <div className="rb-gif-grid">
        {results.map((g) => {
          const src = g.images?.fixed_height_small?.url ?? g.images?.original?.url;
          if (!src) return null;
          return (
            <button key={g.id} type="button" className="rb-gif-thumb" onClick={() => onSelect(src)}>
              <img src={src} alt={g.title || 'GIF'} loading="lazy" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
