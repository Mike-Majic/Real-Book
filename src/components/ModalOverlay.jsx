import { useRef } from 'react';

// Sfondo condiviso da tutti i pannelli a comparsa: chiude solo su un vero
// click sullo sfondo, non quando un trascinamento per selezionare del
// testo (es. per cancellare un campo già pre-compilato) parte dentro alla
// card ma il rilascio del mouse finisce fuori dai suoi bordi. In quel caso
// molti browser generano comunque un evento "click" sullo sfondo (è
// l'antenato comune tra dove parte e dove finisce il trascinamento): senza
// controllare che anche il mousedown sia partito dallo sfondo stesso, quel
// click chiuderebbe il pannello per sbaglio.
export default function ModalOverlay({ onClose, className = 'rb-modal-overlay', children }) {
  const mouseDownOnOverlay = useRef(false);

  return (
    <div
      className={className}
      onMouseDown={(e) => {
        mouseDownOnOverlay.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (mouseDownOnOverlay.current && e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}
