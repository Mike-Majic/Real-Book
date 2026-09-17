import { useEffect, useState } from 'react';
import {
  updateNickname,
  updateName,
  nicknameCooldownRemaining,
  nameCooldownRemaining,
  updateAccountDetails,
  setOwnWorlds,
} from '../data/accounts';
import { sendMailboxMessage } from '../data/modMailbox';
import { listBlockedContacts, blockContact, unblockContact } from '../data/blockedContacts';
import { WORLDS } from '../data/worlds';
import { MOCK_USERS } from '../data/mockUsers';
import ModalOverlay from './ModalOverlay';
import './ProfileSettingsPanel.css';

const NICKNAME_RULE_TEXT =
  'Il nickname si può cambiare al massimo una volta a settimana, e non può essere uguale a quello di un altro utente.';
const NAME_RULE_TEXT =
  'Nome e cognome si possono cambiare al massimo una volta ogni 3 mesi.';
const PARTITA_IVA_PATTERN = /^\d{11}$/;
const PRONOMI_PRESETS = [
  { value: 'lui', label: 'Lui (he/him)' },
  { value: 'lei', label: 'Lei (she/her)' },
  { value: 'loro', label: 'Loro (they/them)' },
  { value: 'altro', label: 'Altro (scrivi tu)' },
];

function daysLeft(ms) {
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

function contactName(id) {
  const u = MOCK_USERS.find((m) => m.id === id);
  return u?.name ?? `Utente #${id}`;
}

// Icona "i" cerchiata: al click mostra una vignetta con la regola. Chi la
// legge qui non vede più la conferma extra al salvataggio (vedi
// FieldEditor sotto) — chi salva senza averla aperta la vede comunque,
// dentro alla finestra di conferma.
function InfoBadge({ text, onSeen }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="rb-info-badge-wrap">
      <button
        type="button"
        className="rb-info-badge"
        onClick={() => {
          setOpen((v) => !v);
          onSeen();
        }}
        aria-label="Come funziona"
      >
        i
      </button>
      {open && <div className="rb-info-bubble">{text}</div>}
    </span>
  );
}

function FieldGroup({
  title,
  ruleText,
  cooldownMs,
  onSave,
  onRequestUrgent,
  children,
  disabled,
  error,
  success,
}) {
  const [infoSeen, setInfoSeen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSaveClick = () => {
    if (infoSeen) {
      onSave();
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div className="rb-profile-field-group">
      <div className="rb-profile-field-title">
        <strong>{title}</strong>
        <InfoBadge text={ruleText} onSeen={() => setInfoSeen(true)} />
      </div>

      {children}

      {error && <p className="rb-profile-field-error">{error}</p>}
      {success && <p className="rb-profile-field-success">{success}</p>}

      {cooldownMs > 0 ? (
        <div className="rb-profile-cooldown">
          <p>Potrai cambiarlo tra {daysLeft(cooldownMs)} giorni.</p>
          <button type="button" className="rb-profile-urgent-btn" onClick={onRequestUrgent}>
            Ho urgenza: scrivi ai moderatori
          </button>
        </div>
      ) : (
        <button type="button" className="rb-profile-save-btn" onClick={handleSaveClick} disabled={disabled}>
          Salva
        </button>
      )}

      {showConfirm && (
        <ModalOverlay onClose={() => setShowConfirm(false)} className="rb-profile-confirm-overlay">
          <div className="rb-profile-confirm-card" onClick={(e) => e.stopPropagation()}>
            <p>{ruleText}</p>
            <p className="rb-profile-confirm-question">Confermi la modifica?</p>
            <div className="rb-profile-confirm-actions">
              <button type="button" onClick={() => setShowConfirm(false)}>Annulla</button>
              <button
                type="button"
                className="rb-profile-confirm-ok"
                onClick={() => {
                  setShowConfirm(false);
                  onSave();
                }}
              >
                Conferma
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

// Scheda "Account": tipo account, dati di fatturazione (solo azienda),
// genere e pronomi. Niente cooldown qui (non è un dato "sensibile" allo
// stesso modo di nickname/nome) — salvataggio diretto tramite la RPC
// update_own_account_details.
function AccountTab({ user, onUpdateUser }) {
  const [tipoAccount, setTipoAccount] = useState(user.tipoAccount ?? 'persona');
  const [ragioneSociale, setRagioneSociale] = useState(user.ragioneSociale ?? '');
  const [partitaIva, setPartitaIva] = useState(user.partitaIva ?? '');
  const [codiceFiscale, setCodiceFiscale] = useState(user.codiceFiscale ?? '');
  const [pec, setPec] = useState(user.pec ?? '');
  const [codiceSdi, setCodiceSdi] = useState(user.codiceSdi ?? '');
  const [genere, setGenere] = useState(user.genere ?? '');
  const [pronomiPreset, setPronomiPreset] = useState(() => {
    const found = PRONOMI_PRESETS.find((p) => p.label === user.pronomi);
    return found ? found.value : user.pronomi ? 'altro' : 'lui';
  });
  const [pronomiCustom, setPronomiCustom] = useState(() => {
    const found = PRONOMI_PRESETS.find((p) => p.label === user.pronomi);
    return found ? '' : user.pronomi ?? '';
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setError('');
    setSuccess('');
    if (!genere) {
      setError('Seleziona il genere.');
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
      if (!pec.trim() && !codiceSdi.trim()) {
        setError('Per la fatturazione elettronica serve almeno uno tra PEC e Codice SDI.');
        return;
      }
    }
    const pronomi = pronomiPreset === 'altro' ? pronomiCustom.trim() : PRONOMI_PRESETS.find((p) => p.value === pronomiPreset)?.label ?? '';

    setBusy(true);
    const { account, error: err } = await updateAccountDetails(user.id, {
      tipoAccount,
      ragioneSociale: tipoAccount === 'azienda' ? ragioneSociale : '',
      partitaIva: tipoAccount === 'azienda' ? partitaIva : '',
      codiceFiscale: tipoAccount === 'azienda' ? codiceFiscale : '',
      pec: tipoAccount === 'azienda' ? pec : '',
      codiceSdi: tipoAccount === 'azienda' ? codiceSdi : '',
      genere,
      pronomi,
    });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess('Dati account aggiornati.');
    onUpdateUser(account);
  };

  return (
    <div className="rb-profile-field-group">
      <div className="rb-profile-field-title"><strong>Tipo di account</strong></div>
      <div className="rb-auth-segmented">
        <button type="button" className={tipoAccount === 'persona' ? 'active' : ''} onClick={() => setTipoAccount('persona')}>
          Persona
        </button>
        <button type="button" className={tipoAccount === 'azienda' ? 'active' : ''} onClick={() => setTipoAccount('azienda')}>
          Azienda / P.IVA
        </button>
      </div>

      {tipoAccount === 'azienda' && (
        <>
          <label className="rb-field">
            <span>Ragione sociale</span>
            <input type="text" value={ragioneSociale} onChange={(e) => setRagioneSociale(e.target.value)} />
          </label>
          <label className="rb-field">
            <span>Partita IVA</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={partitaIva}
              onChange={(e) => setPartitaIva(e.target.value.replace(/\D/g, ''))}
            />
          </label>
          <label className="rb-field">
            <span>Codice fiscale (facoltativo)</span>
            <input type="text" value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value.toUpperCase())} />
          </label>
          <label className="rb-field">
            <span>PEC</span>
            <input type="email" value={pec} onChange={(e) => setPec(e.target.value)} />
          </label>
          <label className="rb-field">
            <span>Codice SDI</span>
            <input type="text" maxLength={7} value={codiceSdi} onChange={(e) => setCodiceSdi(e.target.value.toUpperCase())} />
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
          <input type="text" placeholder="Scrivi i tuoi pronomi" value={pronomiCustom} onChange={(e) => setPronomiCustom(e.target.value)} />
        )}
      </label>

      {error && <p className="rb-profile-field-error">{error}</p>}
      {success && <p className="rb-profile-field-success">{success}</p>}

      <button type="button" className="rb-profile-save-btn" onClick={save} disabled={busy}>
        {busy ? 'Un attimo…' : 'Salva'}
      </button>
    </div>
  );
}

// Scheda "Mondi": scelta di quali mondi restano abilitati per l'account.
// Cambio applicabile in ogni momento, con un limite di 4 volte a settimana
// applicato lato server (qui si mostra solo l'eventuale errore che torna
// indietro se il limite è già stato raggiunto).
function WorldsTab({ user, onUpdateUser }) {
  const [selected, setSelected] = useState(user.mondiAbilitati?.length ? user.mondiAbilitati : WORLDS.map((w) => w.id));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (id) => {
    setError('');
    setSuccess('');
    setSelected((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  };

  const save = async () => {
    setError('');
    setSuccess('');
    if (!selected.length) {
      setError('Devi lasciare abilitato almeno un mondo.');
      return;
    }
    const ordered = WORLDS.map((w) => w.id).filter((id) => selected.includes(id));
    setBusy(true);
    const { account, error: err } = await setOwnWorlds(ordered);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setSuccess('Mondi abilitati aggiornati.');
    onUpdateUser(account);
  };

  return (
    <div className="rb-profile-field-group">
      <div className="rb-profile-field-title">
        <strong>Mondi abilitati</strong>
        <InfoBadge text="Puoi scegliere quali mondi restano visibili per il tuo account. Puoi cambiare idea in qualsiasi momento, fino a 4 volte a settimana." onSeen={() => {}} />
      </div>
      <p className="rb-profile-worlds-hint">
        Scegli quali mondi vuoi esplorare. Puoi riattivarne uno disattivato in qualsiasi momento, fino a 4
        cambi a settimana.
      </p>
      <div className="rb-profile-worlds-list">
        {WORLDS.map((w) => (
          <label key={w.id} className="rb-profile-world-row">
            <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} />
            <span className="rb-profile-world-dot" style={{ background: w.color }} />
            <span>{w.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="rb-profile-field-error">{error}</p>}
      {success && <p className="rb-profile-field-success">{success}</p>}
      <button type="button" className="rb-profile-save-btn" onClick={save} disabled={busy}>
        {busy ? 'Un attimo…' : 'Salva'}
      </button>
    </div>
  );
}

// Scheda "Privacy": blocco/sblocco dei contatti. I contatti mostrati oggi
// (friends, in App.jsx) sono ancora utenti finti di demo (mockUsers), non
// veri account collegati — vedi il commento in blockedContacts.js.
function PrivacyTab({ user, friends, onUnfriend }) {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listBlockedContacts().then((ids) => {
      if (!cancelled) {
        setBlocked(ids);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const doBlock = async (id) => {
    setError('');
    const { error: err } = await blockContact(id);
    if (err) {
      setError(err);
      return;
    }
    setBlocked((prev) => [...prev, String(id)]);
    onUnfriend?.(id);
  };

  const doUnblock = async (id) => {
    setError('');
    const { error: err } = await unblockContact(id);
    if (err) {
      setError(err);
      return;
    }
    setBlocked((prev) => prev.filter((b) => b !== String(id)));
  };

  const blockableFriends = friends.filter((id) => !blocked.includes(String(id)));

  return (
    <div className="rb-profile-field-group">
      <div className="rb-profile-field-title"><strong>Contatti bloccati</strong></div>
      <p className="rb-profile-worlds-hint">
        Un contatto bloccato non può più scriverti né vederti nella tua lista amici. Puoi sbloccarlo in
        qualsiasi momento.
      </p>

      {error && <p className="rb-profile-field-error">{error}</p>}

      {loading ? (
        <p className="rb-profile-worlds-hint">Caricamento...</p>
      ) : (
        <>
          {blocked.length > 0 && (
            <ul className="rb-profile-contact-list">
              {blocked.map((id) => (
                <li key={id} className="rb-profile-contact-row">
                  <span>{contactName(Number.isNaN(Number(id)) ? id : Number(id))}</span>
                  <button type="button" className="rb-profile-urgent-btn" onClick={() => doUnblock(id)}>
                    Sblocca
                  </button>
                </li>
              ))}
            </ul>
          )}

          {blockableFriends.length > 0 && (
            <>
              <div className="rb-profile-field-title" style={{ marginTop: 14 }}>
                <strong>I tuoi contatti</strong>
              </div>
              <ul className="rb-profile-contact-list">
                {blockableFriends.map((id) => (
                  <li key={id} className="rb-profile-contact-row">
                    <span>{contactName(id)}</span>
                    <button type="button" className="rb-profile-urgent-btn" onClick={() => doBlock(id)}>
                      Blocca
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {blocked.length === 0 && blockableFriends.length === 0 && (
            <p className="rb-profile-worlds-hint">Nessun contatto da mostrare.</p>
          )}
        </>
      )}
    </div>
  );
}

// Pannello "Il mio profilo": nickname/nome (con cooldown), dati account
// (tipo/fatturazione/genere/pronomi), mondi abilitati e privacy (blocco
// contatti), organizzati in schede per restare leggibile.
export default function ProfileSettingsPanel({ open, onClose, user, onUpdateUser, friends = [], onUnfriend }) {
  const [tab, setTab] = useState('profilo');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [nickErr, setNickErr] = useState('');
  const [nickOk, setNickOk] = useState('');
  const [nome, setNome] = useState(user?.nome ?? '');
  const [cognome, setCognome] = useState(user?.cognome ?? '');
  const [nameErr, setNameErr] = useState('');
  const [nameOk, setNameOk] = useState('');
  const [urgentField, setUrgentField] = useState(null); // 'nickname' | 'nome' | null
  const [urgentBody, setUrgentBody] = useState('');
  const [urgentSent, setUrgentSent] = useState(false);

  useEffect(() => {
    if (open) setTab('profilo');
  }, [open]);

  if (!open || !user) return null;

  const saveNickname = async () => {
    const { account, error } = await updateNickname(user.id, nickname);
    if (error) {
      setNickErr(error);
      setNickOk('');
      return;
    }
    setNickErr('');
    setNickOk('Nickname aggiornato.');
    onUpdateUser(account);
  };

  const saveName = async () => {
    const { account, error } = await updateName(user.id, nome, cognome);
    if (error) {
      setNameErr(error);
      setNameOk('');
      return;
    }
    setNameErr('');
    setNameOk('Nome e cognome aggiornati.');
    onUpdateUser(account);
  };

  const openUrgent = (field) => {
    setUrgentField(field);
    setUrgentBody('');
    setUrgentSent(false);
  };

  const sendUrgent = async () => {
    if (!urgentBody.trim()) return;
    const { error } = await sendMailboxMessage({
      fromAccountId: user.id,
      fromNickname: user.nickname,
      subject: urgentField === 'nickname' ? 'Richiesta urgente: cambio nickname' : 'Richiesta urgente: cambio nome/cognome',
      body: urgentBody.trim(),
    });
    if (!error) setUrgentSent(true);
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-profile-settings-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <h2>Il mio profilo</h2>

        <div className="rb-profile-tabs">
          <button type="button" className={tab === 'profilo' ? 'active' : ''} onClick={() => setTab('profilo')}>Profilo</button>
          <button type="button" className={tab === 'account' ? 'active' : ''} onClick={() => setTab('account')}>Account</button>
          <button type="button" className={tab === 'mondi' ? 'active' : ''} onClick={() => setTab('mondi')}>Mondi</button>
          <button type="button" className={tab === 'privacy' ? 'active' : ''} onClick={() => setTab('privacy')}>Privacy</button>
        </div>

        {tab === 'profilo' && (
          <>
            <FieldGroup
              title="Nickname"
              ruleText={NICKNAME_RULE_TEXT}
              cooldownMs={nicknameCooldownRemaining(user)}
              onSave={saveNickname}
              onRequestUrgent={() => openUrgent('nickname')}
              disabled={!nickname.trim() || nickname.trim() === user.nickname}
              error={nickErr}
              success={nickOk}
            >
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={30} />
            </FieldGroup>

            <FieldGroup
              title="Nome e cognome"
              ruleText={NAME_RULE_TEXT}
              cooldownMs={nameCooldownRemaining(user)}
              onSave={saveName}
              onRequestUrgent={() => openUrgent('nome')}
              disabled={!nome.trim() && !cognome.trim()}
              error={nameErr}
              success={nameOk}
            >
              <div className="rb-profile-name-row">
                <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} />
                <input type="text" placeholder="Cognome" value={cognome} onChange={(e) => setCognome(e.target.value)} maxLength={40} />
              </div>
            </FieldGroup>
          </>
        )}

        {tab === 'account' && <AccountTab user={user} onUpdateUser={onUpdateUser} />}
        {tab === 'mondi' && <WorldsTab user={user} onUpdateUser={onUpdateUser} />}
        {tab === 'privacy' && <PrivacyTab user={user} friends={friends} onUnfriend={onUnfriend} />}

        {urgentField && (
          <ModalOverlay onClose={() => setUrgentField(null)} className="rb-profile-confirm-overlay">
            <div className="rb-profile-confirm-card" onClick={(e) => e.stopPropagation()}>
              {urgentSent ? (
                <>
                  <p>Richiesta inviata ai moderatori. Ti risponderanno appena possibile.</p>
                  <div className="rb-profile-confirm-actions">
                    <button type="button" className="rb-profile-confirm-ok" onClick={() => setUrgentField(null)}>
                      Chiudi
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>Spiega ai moderatori perché ti serve la modifica prima del tempo previsto.</p>
                  <textarea
                    className="rb-profile-urgent-textarea"
                    rows={4}
                    value={urgentBody}
                    onChange={(e) => setUrgentBody(e.target.value)}
                    placeholder="Scrivi qui la tua richiesta..."
                  />
                  <div className="rb-profile-confirm-actions">
                    <button type="button" onClick={() => setUrgentField(null)}>Annulla</button>
                    <button type="button" className="rb-profile-confirm-ok" onClick={sendUrgent} disabled={!urgentBody.trim()}>
                      Invia
                    </button>
                  </div>
                </>
              )}
            </div>
          </ModalOverlay>
        )}
      </div>
    </ModalOverlay>
  );
}
