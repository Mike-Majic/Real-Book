import './AdultGate.css';

// Barriera minima di sicurezza per il mondo Incontri: prima di vedere
// qualunque contenuto di questo mondo (persone, chat Live), bisogna
// dichiarare di avere più di 18 anni. Chi rifiuta torna al mondo Social.
// Non è una vera verifica dell'età (richiederebbe un documento e un
// backend), ma è la base minima da avere fin dal primo giorno, non "da
// aggiungere dopo".
export default function AdultGate({ onConfirm, onDecline }) {
  return (
    <div className="rb-adult-gate-overlay">
      <div className="rb-adult-gate-card">
        <h2>Contenuti per un pubblico adulto</h2>
        <p>
          Il mondo Incontri può contenere conversazioni e contenuti pensati per un pubblico adulto.
          Per continuare devi confermare di avere almeno 18 anni.
        </p>
        <div className="rb-adult-gate-actions">
          <button type="button" className="rb-adult-gate-decline" onClick={onDecline}>
            Non ho 18 anni
          </button>
          <button type="button" className="rb-adult-gate-confirm" onClick={onConfirm}>
            Ho più di 18 anni, continua
          </button>
        </div>
      </div>
    </div>
  );
}
