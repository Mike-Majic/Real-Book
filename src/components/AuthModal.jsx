import { useEffect, useState } from 'react';
import { registerAccount, loginAccount, resendConfirmationEmail } from '../data/accounts';
import { WORLDS } from '../data/worlds';
import ModalOverlay from './ModalOverlay';
import TermsModal from './TermsModal';
import './AuthModal.css';

// Preimpostazioni più comuni per i pronomi: coprono la maggior parte dei
// casi con un click, "Altro" lascia comunque scrivere qualsiasi cosa a chi
// non si riconosce in queste opzioni.
const PRONOMI_PRESETS = [
  { value: 'non_specificato', label: 'Preferisco non specificare' },
  { value: 'lui', label: 'Lui (he/him)' },
  { value: 'lei', label: 'Lei (she/her)' },
  { value: 'loro', label: 'Loro (they/them)' },
  { value: 'altro', label: 'Altro (scrivi tu)' },
];

const PARTITA_IVA_PATTERN = /^\d{11}$/;
const CODICE_FISCALE_PATTERN = /^[A-Za-z0-9]{11,16}$/;
const PEC_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SDI_PATTERN = /^([A-Za-z0-9]{7}|0000000)$/;

// Accedi/Registrati con account veri, salvati su Supabase (non più solo
// localStorage): la registrazione raccoglie nome utente, nickname, mail,
// password, data di nascita, cellulare, mail di backup, tipo account
// (persona/azienda), genere, pronomi, consensi e allegati facoltativi. Il
// ruolo si assegna da solo in base alla mail (lato server, vedi la funzione
// di registrazione su Supabase) — qui non si sceglie mai.
export default function AuthModal({ open, onClose, onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [dataNascita, setDataNascita] = useState('');
  const [phone, setPhone] = useState('');
  const [backupEmail, setBackupEmail] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [tipoAccount, setTipoAccount] = useState('persona');
  const [ragioneSociale, setRagioneSociale] = useState('');
  const [partitaIva, setPartitaIva] = useState('');
  const [codiceFiscale, setCodiceFiscale] = useState('');
  const [pec, setPec] = useState('');
  const [codiceSdi, setCodiceSdi] = useState('');
  // Niente valore di default valido: costringe a una scelta esplicita,
  // niente "Altro"/"Preferisco non specificare" (richiesta esplicita).
  const [genere, setGenere] = useState('');
  const [pronomiPreset, setPronomiPreset] = useState('non_specificato');
  const [pronomiCustom, setPronomiCustom] = useState('');
  // Tutti i mondi abilitati di default: chi si registra può deselezionarne
  // alcuni (es. vuole usare solo il mondo Nerd), non deve spuntarli a mano
  // uno per uno per averli tutti.
  const [mondiAbilitati, setMondiAbilitati] = useState(WORLDS.map((w) => w.id));
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consensoMarketing, setConsensoMarketing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  // Mail per cui serve ancora confermare l'indirizzo: se valorizzata, sotto
  // al messaggio compare un pulsante per rimandare la mail (niente bisogno
  // di rifare la registrazione — l'account esiste già, solo non confermato).
  const [pendingConfirmEmail, setPendingConfirmEmail] = useState('');
  const [resendOk, setResendOk] = useState(false);

  // Ogni volta che si riapre, si riparte dalla scheda Accedi: altrimenti
  // chi ha lasciato aperta "Registrati" senza inviare (es. per ripensarci)
  // ritroverebbe quella scheda, con i campi già scritti, la volta dopo.
  useEffect(() => {
    if (open) {
      setMode('login');
      setError('');
      setInfo('');
      setPendingConfirmEmail('');
      setResendOk(false);
      // I consensi si azzerano ad ogni riapertura: una spunta lasciata da
      // una visita precedente non deve valere come accettazione per un
      // nuovo tentativo di registrazione.
      setTermsAccepted(false);
      setConsensoMarketing(false);
    }
  }, [open]);

  if (!open) return null;

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  const finishAuth = (account, notice) => {
    // user.name resta popolato (dal nickname) per compatibilità con tutto
    // il resto dell'app, che già lo usa ovunque. Niente password nello
    // stato "user": qui arriva già il profilo (senza password, Supabase
    // Auth la tiene per conto suo, non passa mai dal client in chiaro).
    onLogin({ ...account, name: account.nickname }, notice);
    setError('');
    setInfo('');
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setBusy(true);
    setResendOk(false);
    const { account, error: err, needsEmailConfirmation } = await loginAccount(loginEmail, loginPassword);
    setBusy(false);
    if (err) {
      setError(err);
      setPendingConfirmEmail(needsEmailConfirmation ? loginEmail : '');
      return;
    }
    finishAuth(account);
  };

  const resendConfirmation = async () => {
    setBusy(true);
    const { error: err } = await resendConfirmationEmail(pendingConfirmEmail);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setResendOk(true);
  };

  const onFilesChosen = (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    setAttachments((prev) => [...prev, ...files]);
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError('Le due password non coincidono.');
      return;
    }
    if (!genere) {
      setError('Seleziona il genere.');
      return;
    }
    if (!mondiAbilitati.length) {
      setError('Scegli almeno un mondo da abilitare.');
      return;
    }
    if (!termsAccepted) {
      setError('Devi accettare i Termini di servizio e l\'Informativa Privacy per registrarti.');
      return;
    }
    if (tipoAccount === 'azienda') {
      if (!ragioneSociale.trim()) {
        setError('Inserisci la ragione sociale.');
        return;
      }
      if (!PARTITA_IVA_PATTERN.test(partitaIva.trim())) {
        setError('La partita IVA deve essere di 11 cifre numeriche.');
        return;
      }
      if (codiceFiscale.trim() && !CODICE_FISCALE_PATTERN.test(codiceFiscale.trim())) {
        setError('Il codice fiscale non è in un formato valido.');
        return;
      }
      if (!pec.trim() && !codiceSdi.trim()) {
        setError('Per la fatturazione elettronica serve almeno uno tra PEC e Codice SDI.');
        return;
      }
      if (pec.trim() && !PEC_PATTERN.test(pec.trim())) {
        setError('La PEC non è un indirizzo mail valido.');
        return;
      }
      if (codiceSdi.trim() && !SDI_PATTERN.test(codiceSdi.trim())) {
        setError('Il Codice SDI deve essere di 7 caratteri alfanumerici (o "0000000" se usi solo la PEC).');
        return;
      }
    }

    const pronomi = pronomiPreset === 'altro'
      ? pronomiCustom.trim()
      : PRONOMI_PRESETS.find((p) => p.value === pronomiPreset)?.label ?? '';

    setBusy(true);
    const { account, error: err, needsEmailConfirmation, attachmentError } = await registerAccount({
      username,
      nickname,
      email,
      password,
      phone,
      backupEmail,
      attachments,
      dataNascita,
      tipoAccount,
      ragioneSociale: tipoAccount === 'azienda' ? ragioneSociale : '',
      partitaIva: tipoAccount === 'azienda' ? partitaIva : '',
      codiceFiscale: tipoAccount === 'azienda' ? codiceFiscale : '',
      pec: tipoAccount === 'azienda' ? pec : '',
      codiceSdi: tipoAccount === 'azienda' ? codiceSdi : '',
      genere,
      pronomi,
      termsAcceptedAt: new Date().toISOString(),
      consensoMarketing,
      mondiAbilitati,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    if (needsEmailConfirmation) {
      setInfo('Account creato: controlla la tua mail e conferma l\'indirizzo, poi accedi da qui con mail e password.');
      setPendingConfirmEmail(email);
      setResendOk(false);
      setMode('login');
      return;
    }
    finishAuth(account, attachmentError);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <form
        className="rb-auth-card"
        onClick={(e) => e.stopPropagation()}
        onSubmit={mode === 'login' ? submitLogin : submitRegister}
      >
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <h2>{mode === 'login' ? 'Accedi a Versemove' : 'Crea un account'}</h2>

        <div className="rb-auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
            Accedi
          </button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
            Registrati
          </button>
        </div>

        {mode === 'login' ? (
          <>
            <label className="rb-field">
              <span>Mail</span>
              <input
                type="email"
                autoFocus
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </label>
            <label className="rb-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <label className="rb-field">
              <span>Nome utente</span>
              <input type="text" autoFocus autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Nickname</span>
              <input type="text" autoComplete="off" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Mail</span>
              <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="rb-field">
              <span>Conferma password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </label>
            <label className="rb-field">
              <span>Data di nascita</span>
              <input
                type="date"
                autoComplete="off"
                value={dataNascita}
                min="1900-01-01"
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDataNascita(e.target.value)}
              />
              <span className="rb-auth-field-hint">Serve per i mondi riservati ai maggiorenni.</span>
            </label>
            <label className="rb-field">
              <span>Cellulare (facoltativo)</span>
              <input type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Mail di backup (facoltativa)</span>
              <input type="email" value={backupEmail} onChange={(e) => setBackupEmail(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Allegati (facoltativi)</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={onFilesChosen} />
              {attachments.length > 0 && (
                <span className="rb-auth-attachments-count">{attachments.length} file selezionati</span>
              )}
            </label>

            <div className="rb-field">
              <span>Tipo di account</span>
              <div className="rb-auth-segmented">
                <button
                  type="button"
                  className={tipoAccount === 'persona' ? 'active' : ''}
                  onClick={() => setTipoAccount('persona')}
                >
                  Persona
                </button>
                <button
                  type="button"
                  className={tipoAccount === 'azienda' ? 'active' : ''}
                  onClick={() => setTipoAccount('azienda')}
                >
                  Azienda / P.IVA
                </button>
              </div>
            </div>

            {tipoAccount === 'azienda' && (
              <>
                <label className="rb-field">
                  <span>Ragione sociale</span>
                  <input
                    type="text"
                    autoComplete="organization"
                    value={ragioneSociale}
                    onChange={(e) => setRagioneSociale(e.target.value)}
                  />
                </label>
                <label className="rb-field">
                  <span>Partita IVA</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={11}
                    autoComplete="off"
                    value={partitaIva}
                    onChange={(e) => setPartitaIva(e.target.value.replace(/\D/g, ''))}
                  />
                  <span className="rb-auth-field-hint">11 cifre numeriche, senza spazi né prefisso IT.</span>
                </label>
                <label className="rb-field">
                  <span>Codice fiscale (facoltativo)</span>
                  <input
                    type="text"
                    autoComplete="off"
                    value={codiceFiscale}
                    onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())}
                  />
                </label>
                <label className="rb-field">
                  <span>PEC</span>
                  <input type="email" autoComplete="off" value={pec} onChange={(e) => setPec(e.target.value)} />
                </label>
                <label className="rb-field">
                  <span>Codice SDI</span>
                  <input
                    type="text"
                    maxLength={7}
                    autoComplete="off"
                    value={codiceSdi}
                    onChange={(e) => setCodiceSdi(e.target.value.toUpperCase())}
                  />
                  <span className="rb-auth-field-hint">Serve almeno uno tra PEC e Codice SDI, per la fatturazione elettronica.</span>
                </label>
              </>
            )}

            <label className="rb-field">
              <span>Genere</span>
              <select value={genere} onChange={(e) => setGenere(e.target.value)}>
                <option value="" disabled>Seleziona...</option>
                <option value="uomo">Uomo</option>
                <option value="donna">Donna</option>
              </select>
            </label>

            <label className="rb-field">
              <span>Pronomi</span>
              <select value={pronomiPreset} onChange={(e) => setPronomiPreset(e.target.value)}>
                {PRONOMI_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {pronomiPreset === 'altro' && (
                <input
                  type="text"
                  className="rb-auth-pronomi-custom"
                  placeholder="Scrivi i tuoi pronomi"
                  value={pronomiCustom}
                  onChange={(e) => setPronomiCustom(e.target.value)}
                />
              )}
            </label>

            <div className="rb-field">
              <span>Mondi da abilitare</span>
              <div className="rb-auth-worlds-box">
                {WORLDS.map((w) => (
                  <label key={w.id} className="rb-auth-world-row">
                    <input
                      type="checkbox"
                      checked={mondiAbilitati.includes(w.id)}
                      onChange={() =>
                        setMondiAbilitati((prev) =>
                          prev.includes(w.id) ? prev.filter((id) => id !== w.id) : [...prev, w.id]
                        )
                      }
                    />
                    <span className="rb-auth-world-dot" style={{ background: w.color }} />
                    <span>{w.label}</span>
                  </label>
                ))}
              </div>
              <span className="rb-auth-field-hint">
                Potrai attivarli o disattivarli in qualsiasi momento dalle Impostazioni (fino a 4 volte a settimana).
              </span>
            </div>

            <label className="rb-field rb-auth-checkbox-field">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
              />
              <span>
                Ho letto e accetto i{' '}
                <button
                  type="button"
                  className="rb-auth-terms-link"
                  onClick={(e) => {
                    // Sta dentro la <label> del checkbox: senza queste due
                    // righe, il click aprirebbe la modale MA farebbe anche
                    // scattare/togliere la spunta (comportamento di default
                    // del browser su un click dentro una label).
                    e.preventDefault();
                    e.stopPropagation();
                    setShowTerms(true);
                  }}
                >
                  Termini di servizio e l'Informativa Privacy
                </button>
                {' '}(obbligatorio)
              </span>
            </label>

            <label className="rb-field rb-auth-checkbox-field">
              <input
                type="checkbox"
                checked={consensoMarketing}
                onChange={(e) => setConsensoMarketing(e.target.checked)}
              />
              <span>Voglio ricevere comunicazioni e novità su Versemove (facoltativo)</span>
            </label>
          </>
        )}

        {error && <p className="rb-auth-error">{error}</p>}
        {info && <p className="rb-auth-info">{info}</p>}

        {pendingConfirmEmail && !resendOk && (
          <button type="button" className="rb-auth-resend-btn" onClick={resendConfirmation} disabled={busy}>
            Rinvia mail di conferma a {pendingConfirmEmail}
          </button>
        )}
        {resendOk && <p className="rb-auth-info">Mail inviata di nuovo: controlla la posta (anche spam).</p>}

        <button type="submit" className="rb-btn-primary rb-auth-submit" disabled={busy}>
          {busy ? 'Un attimo…' : mode === 'login' ? 'Entra' : 'Crea account'}
        </button>
      </form>

      <TermsModal open={showTerms} onClose={() => setShowTerms(false)} />
    </ModalOverlay>
  );
}
