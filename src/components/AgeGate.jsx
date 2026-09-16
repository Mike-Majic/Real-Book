import './AgeGate.css';

// Sostituisce la vecchia auto-dichiarazione ("dichiaro di avere 18 anni",
// un pulsante cliccabile da chiunque) con un controllo reale sulla data di
// nascita dell'account: chi non è loggato non ha un'età da controllare
// quindi deve prima accedere/registrarsi, chi è minorenne resta bloccato
// senza alcun modo di aggirarlo da qui.
export default function AgeGate({ world, user, onOpenAuth, onDecline }) {
  const needsAuth = !user;
  return (
    <div className="rb-adult-gate-overlay" style={{ '--accent': world.color }}>
      <div className="rb-adult-gate-card">
        <h2>Contenuti per un pubblico adulto</h2>
        {needsAuth ? (
          <>
            <p>
              Il mondo {world.label} è riservato ai maggiorenni. Accedi o registrati (con la tua data di
              nascita) per continuare.
            </p>
            <div className="rb-adult-gate-actions">
              <button type="button" className="rb-adult-gate-decline" onClick={onDecline}>
                Torna indietro
              </button>
              <button type="button" className="rb-adult-gate-confirm" onClick={onOpenAuth}>
                Accedi o registrati
              </button>
            </div>
          </>
        ) : (
          <>
            <p>
              Il mondo {world.label} è riservato ai maggiorenni. In base alla data di nascita del tuo
              account non puoi ancora entrare.
            </p>
            <div className="rb-adult-gate-actions">
              <button type="button" className="rb-adult-gate-decline" onClick={onDecline}>
                Torna indietro
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
