import { useState } from 'react';
import { updateNickname, updateName, nicknameCooldownRemaining, nameCooldownRemaining } from '../data/accounts';
import { sendMailboxMessage } from '../data/modMailbox';
import ModalOverlay from './ModalOverlay';
import './ProfileSettingsPanel.css';

const NICKNAME_RULE_TEXT =
  'Il nickname si può cambiare al massimo una volta a settimana, e non può essere uguale a quello di un altro utente.';
const NAME_RULE_TEXT =
  'Nome e cognome si possono cambiare al massimo una volta ogni 3 mesi.';

function daysLeft(ms) {
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
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

// Pannello "Il mio profilo": nickname (univoco, 1 volta a settimana) e nome
// e cognome (1 volta ogni 3 mesi). Entrambi hanno l'icona (i) che spiega la
// regola prima del salvataggio; chi salva senza leggerla vede la stessa
// spiegazione dentro una conferma obbligatoria. In cooldown, si può
// scrivere ai moderatori (casella condivisa) per un'urgenza.
export default function ProfileSettingsPanel({ open, onClose, user, onUpdateUser }) {
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
