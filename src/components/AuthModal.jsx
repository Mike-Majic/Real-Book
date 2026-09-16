import { useEffect, useState } from 'react';
import { registerAccount, loginAccount } from '../data/accounts';
import './AuthModal.css';

// Accedi/Registrati con account veri (non più solo un nickname): la
// registrazione raccoglie nome utente, nickname, mail, password, cellulare,
// mail di backup e allegati facoltativi. Il ruolo si assegna da solo in
// base alla mail (vedi roles.js/accounts.js) — qui non si sceglie mai.
// Restano dati locali a questo browser, nessun server reale dietro.
export default function AuthModal({ open, onClose, onLogin }) {
  const [mode, setMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [backupEmail, setBackupEmail] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');

  // Ogni volta che si riapre, si riparte dalla scheda Accedi: altrimenti
  // chi ha lasciato aperta "Registrati" senza inviare (es. per ripensarci)
  // ritroverebbe quella scheda, con i campi già scritti, la volta dopo.
  useEffect(() => {
    if (open) {
      setMode('login');
      setError('');
    }
  }, [open]);

  if (!open) return null;

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const finishAuth = (account) => {
    // user.name/user.avatar restano popolati (dal nickname) per compatibilità
    // con tutto il resto dell'app, che già li usa ovunque. La password non
    // serve fuori da accounts.js: non la si porta nello stato "user" (che
    // finisce anche in localStorage rb-user), un posto in meno dove trovarla.
    const { password, ...safeAccount } = account;
    onLogin({ ...safeAccount, name: account.nickname });
    setError('');
  };

  const submitLogin = (e) => {
    e.preventDefault();
    const { account, error: err } = loginAccount(loginEmail, loginPassword);
    if (err) {
      setError(err);
      return;
    }
    finishAuth(account);
  };

  const onFilesChosen = (e) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    Promise.all(
      files.map(
        (f) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: f.name, dataUrl: reader.result });
            reader.readAsDataURL(f);
          })
      )
    ).then((results) => setAttachments((prev) => [...prev, ...results]));
  };

  const submitRegister = (e) => {
    e.preventDefault();
    const { account, error: err } = registerAccount({ username, nickname, email, password, phone, backupEmail, attachments });
    if (err) {
      setError(err);
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
        <p className="rb-auth-hint">
          Demo senza server reale: i dati (mail, password inclusa) restano solo in questo browser.
        </p>

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

        <button type="submit" className="rb-btn-primary rb-auth-submit">
          {mode === 'login' ? 'Entra' : 'Crea account'}
        </button>
      </form>
    </div>
  );
}
