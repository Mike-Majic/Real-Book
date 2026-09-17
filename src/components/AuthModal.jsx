import { useEffect, useState } from 'react';
import { registerAccount, loginAccount, resendConfirmationEmail } from '../data/accounts';
import './AuthModal.css';

// Accedi/Registrati con account veri, salvati su Supabase (non più solo
// localStorage): la registrazione raccoglie nome utente, nickname, mail,
// password, data di nascita, cellulare, mail di backup e allegati
// facoltativi. Il ruolo si assegna da solo in base alla mail (lato server,
// vedi la funzione di registrazione su Supabase) — qui non si sceglie mai.
export default function AuthModal({ open, onClose, onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dataNascita, setDataNascita] = useState('');
  const [phone, setPhone] = useState('');
  const [backupEmail, setBackupEmail] = useState('');
  const [attachments, setAttachments] = useState([]);
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
    }
  }, [open]);

  if (!open) return null;

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setInfo('');
  };

  const finishAuth = (account) => {
    // user.name resta popolato (dal nickname) per compatibilità con tutto
    // il resto dell'app, che già lo usa ovunque. Niente password nello
    // stato "user": qui arriva già il profilo (senza password, Supabase
    // Auth la tiene per conto suo, non passa mai dal client in chiaro).
    onLogin({ ...account, name: account.nickname });
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
    setBusy(true);
    const { account, error: err, needsEmailConfirmation } = await registerAccount({
      username,
      nickname,
      email,
      password,
      phone,
      backupEmail,
      attachments,
      dataNascita,
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
    finishAuth(account);
  };

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
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
              <input type="email" autoFocus value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Password</span>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label className="rb-field">
              <span>Nome utente</span>
              <input type="text" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Nickname</span>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Data di nascita</span>
              <input
                type="date"
                value={dataNascita}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDataNascita(e.target.value)}
              />
              <span className="rb-auth-field-hint">Serve per i mondi riservati ai maggiorenni.</span>
            </label>
            <label className="rb-field">
              <span>Cellulare (facoltativo)</span>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Mail di backup (facoltativa)</span>
              <input type="email" value={backupEmail} onChange={(e) => setBackupEmail(e.target.value)} />
            </label>
            <label className="rb-field">
              <span>Allegati (facoltativi)</span>
              <input type="file" multiple onChange={onFilesChosen} />
              {attachments.length > 0 && (
                <span className="rb-auth-attachments-count">{attachments.length} file selezionati</span>
              )}
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
    </div>
  );
}
