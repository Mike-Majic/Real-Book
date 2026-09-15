import './LinkPreview.css';

// Fase B: placeholder minimo, solo il dominio in chiaro, non cliccabile.
// La Fase D lo arricchisce con l'anteprima oEmbed (quando disponibile) e la
// conferma prima di uscire dall'app.
function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function LinkPreview({ url }) {
  if (!url) return null;
  return (
    <div className="rb-link-preview rb-link-preview-plain">
      <span className="rb-link-preview-domain">🔗 {getDomain(url)}</span>
    </div>
  );
}
