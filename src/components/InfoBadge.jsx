import { useState } from 'react';

// Icona "i" cerchiata: al click mostra/nasconde una vignetta col testo.
// Condivisa da ProfileSettingsPanel (dove serve anche onSeen, per non
// mostrare una conferma extra a chi ha già letto la regola) e da
// SettingsPanel (dove tutte le spiegazioni prima sempre visibili sono
// state spostate qui dentro, per occupare meno spazio in colonna).
export default function InfoBadge({ text, onSeen }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="rb-info-badge-wrap">
      <button
        type="button"
        className="rb-info-badge"
        onClick={(e) => {
          // Può trovarsi dentro una <label> (i toggle) o affiancata a un
          // bottone che apre/chiude una fisarmonica: senza queste due
          // righe, il click aprirebbe la spiegazione MA farebbe scattare
          // anche l'altro controllo (stesso problema già risolto per il
          // link Termini dentro AuthModal).
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
          onSeen?.();
        }}
        aria-label="Come funziona"
      >
        i
      </button>
      {open && <div className="rb-info-bubble">{text}</div>}
    </span>
  );
}
