import './AccessGate.css';

// Generalizzazione del vecchio AgeGate: oggi TUTTI i mondi richiedono un
// account per essere esplorati, non solo Incontri e Lavoro — su quei due
// resta anche il controllo dei 18 anni (data di nascita vera dell'account,
// non un'auto-dichiarazione). `requireAdult` distingue i due casi nel testo
// mostrato. `disabledByUser` copre un terzo caso, indipendente dai primi
// due: un account loggato e (se serve) maggiorenne, ma che ha scelto di non
// abilitare questo mondo in registrazione/impostazioni.
export default function AccessGate({ world, user, requireAdult, disabledByUser, onOpenAuth, onDecline, onOpenSettings }) {
  const needsAuth = !user;

  if (!needsAuth && disabledByUser) {
    return (
      <div className="rb-adult-gate-overlay" style={{ '--accent': world.color }}>
        <div className="rb-adult-gate-card">
          <h2>Mondo disattivato</h2>
          <p>
            Hai scelto di non abilitare il mondo {world.label} per il tuo account. Puoi riattivarlo in
            qualsiasi momento dalle Impostazioni (fino a 4 volte a settimana).
          </p>
          <div className="rb-adult-gate-actions">
            <button type="button" className="rb-adult-gate-decline" onClick={onDecline}>
              Torna indietro
            </button>
            <button type="button" className="rb-adult-gate-confirm" onClick={onOpenSettings}>
              Vai alle Impostazioni
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rb-adult-gate-overlay" style={{ '--accent': world.color }}>
      <div className="rb-adult-gate-card">
        <h2>{requireAdult ? 'Contenuti per un pubblico adulto' : 'Accedi per continuare'}</h2>
        {needsAuth ? (
          <>
            <p>
              {requireAdult
                ? `Il mondo ${world.label} è riservato ai maggiorenni. Accedi o registrati (con la tua data di nascita) per continuare.`
                : `Devi accedere o registrarti per esplorare il mondo ${world.label}.`}
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
