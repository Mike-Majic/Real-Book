import { useState } from 'react';
import ModalOverlay from './ModalOverlay';
import './social/LinkPreview.css';

// Stesso pattern di conferma già usato per i link nei post del mondo Social
// (Fase D): qualunque link esterno, prima di aprirsi, chiede conferma.
// Riusa le classi rb-link-confirm-* già definite li', per non duplicare lo
// stesso overlay due volte.
export default function ExternalLinkButton({ url, className, children }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openLink = () => {
    setConfirmOpen(false);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <button type="button" className={className} onClick={() => setConfirmOpen(true)}>
        {children}
      </button>

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
    </>
  );
}
