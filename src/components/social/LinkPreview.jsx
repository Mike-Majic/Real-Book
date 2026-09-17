import { useEffect, useState } from 'react';
import ModalOverlay from '../ModalOverlay';
import './LinkPreview.css';

// Fase D: se il link e' di un servizio con un endpoint di anteprima pubblico
// richiamabile dal browser (CORS aperto), mostriamo una card con immagine e
// titolo. Per qualunque altro link mostriamo solo il dominio in chiaro: una
// anteprima generica per un sito qualsiasi richiederebbe di scaricare la
// pagina lato server, cosa che non abbiamo (niente backend per ora).
const OEMBED_PROVIDERS = [
  {
    name: 'YouTube',
    test: (url) => /(?:youtube\.com\/watch|youtu\.be\/)/i.test(url),
    endpoint: (url) => `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  },
];

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function findProvider(url) {
  return OEMBED_PROVIDERS.find((p) => p.test(url)) ?? null;
}

export default function LinkPreview({ url }) {
  const [oembed, setOembed] = useState(null);
  const [failed, setFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const provider = url ? findProvider(url) : null;

  useEffect(() => {
    setOembed(null);
    setFailed(false);
    if (!provider) return;
    let cancelled = false;
    fetch(provider.endpoint(url))
      .then((res) => {
        if (!res.ok) throw new Error('oEmbed non disponibile');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setOembed(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  if (!url) return null;

  const openLink = () => {
    setConfirmOpen(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showCard = provider && oembed && !failed;

  return (
    <div className="rb-link-preview">
      {showCard ? (
        <button
          type="button"
          className="rb-link-preview-card"
          onClick={() => setConfirmOpen(true)}
        >
          {oembed.thumbnail_url && (
            <img className="rb-link-preview-thumb" src={oembed.thumbnail_url} alt="" />
          )}
          <span className="rb-link-preview-info">
            <span className="rb-link-preview-title">{oembed.title || getDomain(url)}</span>
            <span className="rb-link-preview-source">{provider.name} · {getDomain(url)}</span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          className="rb-link-preview-plain"
          onClick={() => setConfirmOpen(true)}
        >
          🔗 {getDomain(url)}
        </button>
      )}

      {confirmOpen && (
        <ModalOverlay onClose={() => setConfirmOpen(false)} className="rb-link-confirm-overlay">
          <div className="rb-link-confirm-card" onClick={(e) => e.stopPropagation()}>
            <p>Stai uscendo dall'app per aprire un link esterno. Sei sicuro?</p>
            <p className="rb-link-confirm-url">{url}</p>
            <div className="rb-link-confirm-actions">
              <button type="button" className="rb-link-confirm-cancel" onClick={() => setConfirmOpen(false)}>
                Annulla
              </button>
              <button type="button" className="rb-link-confirm-ok" onClick={openLink}>
                OK
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
