// Sfondo condiviso da tutti i pannelli a comparsa. Richiesta esplicita
// dell'utente: il click sullo sfondo non chiude più nulla, nemmeno un vero
// click intenzionale — ogni pannello si chiude solo con un controllo
// esplicito (la ✕ in alto, "Annulla", "Chiudi"...). Prima chiudeva anche
// solo lo sfondo "vero" (non un trascinamento per selezionare del testo
// che finiva fuori dai bordi), ma restava comunque troppo facile chiudere
// per sbaglio un modulo compilato a metà: meglio blindarlo del tutto.
export default function ModalOverlay({ className = 'rb-modal-overlay', children }) {
  return <div className={className}>{children}</div>;
}
