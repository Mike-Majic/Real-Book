import { useState } from 'react';
import { getAccounts, updateAccountRole, setAccountVerified, resetAccountPassword } from '../data/accounts';
import { getMailboxMessages, markMessageRead } from '../data/modMailbox';
import { computeAge } from '../data/age';
import { ROLES } from '../data/roles';
import './AdminPanel.css';

const ROLE_LABELS = { [ROLES.OWNER]: 'Owner', [ROLES.MODERATOR]: 'Moderatore', [ROLES.USER]: 'Utente' };

const ADMIN_TABS = [
  { id: 'utenti', label: 'Utenti' },
  { id: 'posta', label: 'Posta' },
];

// Apre un allegato (dataURL) in una nuova scheda: è così che owner/
// moderatori guardano il documento caricato in registrazione prima di
// segnare un account come verificato — nessun servizio di controllo
// automatico dietro, solo revisione umana.
function openAttachment(att) {
  const w = window.open();
  if (!w) return;
  const isImage = att.dataUrl.startsWith('data:image');
  w.document.write(
    isImage
      ? `<title>${att.name}</title><body style="margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${att.dataUrl}" style="max-width:100%;max-height:100vh" /></body>`
      : `<title>${att.name}</title><body><a href="${att.dataUrl}" download="${att.name}">Scarica ${att.name}</a></body>`
  );
}

function MailboxPane({ messages, onMarkRead }) {
  return (
    <div className="rb-admin-mailbox">
      <p className="rb-admin-hint">
        Richieste urgenti degli utenti (es. cambio nickname o nome fuori dal tempo consentito), condivise tra
        owner e moderatori.
      </p>
      {messages.length === 0 && <p className="rb-admin-empty">Nessun messaggio.</p>}
      <ul className="rb-admin-mail-list">
        {messages.map((m) => (
          <li key={m.id} className={`rb-admin-mail-item ${m.letto ? '' : 'unread'}`}>
            <div className="rb-admin-mail-head">
              <strong>{m.subject}</strong>
              <span>{new Date(m.data).toLocaleString('it-IT')}</span>
            </div>
            <p className="rb-admin-mail-from">Da: {m.fromNickname}</p>
            <p className="rb-admin-mail-body">{m.body}</p>
            {!m.letto && (
              <button type="button" onClick={() => onMarkRead(m.id)}>
                Segna come letto
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Sezione backend: "Utenti" (elenco di chi si è registrato, con ruolo,
// verifica e reset password) e "Posta" (casella condivisa owner/
// moderatori). Solo l'owner può cambiare i ruoli; verifica e reset
// password sono aperti anche ai moderatori, tranne che sulla riga
// dell'owner — quella resta intoccabile da chiunque non sia l'owner
// stesso (vedi anche le guardie in accounts.js).
export default function AdminPanel({ user, onClose }) {
  const [tab, setTab] = useState('utenti');
  const [accounts, setAccounts] = useState(() => getAccounts());
  const [messages, setMessages] = useState(() => getMailboxMessages());
  const [resetInfo, setResetInfo] = useState(null);
  const isOwner = user?.ruolo === ROLES.OWNER;
  const unreadCount = messages.filter((m) => !m.letto).length;

  const refreshAccounts = () => setAccounts(getAccounts());

  const changeRole = (accountId, newRole) => {
    const { error } = updateAccountRole(accountId, newRole);
    if (!error) refreshAccounts();
  };

  const toggleVerified = (account) => {
    const { error } = setAccountVerified(account.id, !account.verificato);
    if (!error) refreshAccounts();
  };

  const doResetPassword = (account) => {
    const { newPassword, error } = resetAccountPassword(account.id);
    if (!error) {
      refreshAccounts();
      setResetInfo({ nickname: account.nickname, newPassword });
    }
  };

  const markRead = (messageId) => {
    markMessageRead(messageId);
    setMessages(getMailboxMessages());
  };

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-admin-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <h2>Backend</h2>

        <div className="rb-admin-tabs">
          {ADMIN_TABS.map((t) => (
            <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'posta' && unreadCount > 0 && <span className="rb-admin-tab-badge">{unreadCount}</span>}
            </button>
          ))}
        </div>

        {tab === 'utenti' && (
          <>
            <p className="rb-admin-hint">
              {isOwner
                ? 'Elenco di chi si è registrato. Puoi cambiare ruolo, verificare un documento o resettare una password.'
                : "Elenco di chi si è registrato. Puoi verificare un documento o resettare una password; solo l'owner cambia i ruoli."}
            </p>

            <div className="rb-admin-table-wrap">
              <table className="rb-admin-table">
                <thead>
                  <tr>
                    <th>Nome utente</th>
                    <th>Nickname</th>
                    <th>Nome e cognome</th>
                    <th>Mail</th>
                    <th>Cellulare</th>
                    <th>Mail di backup</th>
                    <th>Età</th>
                    <th>Allegati</th>
                    <th>Verifica</th>
                    <th>Ruolo</th>
                    <th>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => {
                    const isOwnerRow = a.ruolo === ROLES.OWNER;
                    const canManageRow = isOwner || !isOwnerRow;
                    const age = computeAge(a.dataNascita);
                    return (
                      <tr key={a.id}>
                        <td>{a.username}</td>
                        <td>{a.nickname}</td>
                        <td>{[a.nome, a.cognome].filter(Boolean).join(' ') || '—'}</td>
                        <td>{a.email}</td>
                        <td>{a.phone || '—'}</td>
                        <td>{a.backupEmail || '—'}</td>
                        <td>{age ?? '—'}</td>
                        <td>
                          {a.attachments?.length > 0 ? (
                            <div className="rb-admin-attachments">
                              {a.attachments.map((att, i) => (
                                <button key={i} type="button" onClick={() => openAttachment(att)} title={att.name}>
                                  📎{i + 1}
                                </button>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`rb-admin-verified-btn ${a.verificato ? 'active' : ''}`}
                            onClick={() => toggleVerified(a)}
                            disabled={!canManageRow}
                          >
                            {a.verificato ? '✓ Verificato' : 'Non verificato'}
                          </button>
                        </td>
                        <td>
                          {isOwner && !isOwnerRow ? (
                            <select value={a.ruolo} onChange={(e) => changeRole(a.id, e.target.value)}>
                              <option value={ROLES.USER}>{ROLE_LABELS[ROLES.USER]}</option>
                              <option value={ROLES.MODERATOR}>{ROLE_LABELS[ROLES.MODERATOR]}</option>
                            </select>
                          ) : (
                            <span className={`rb-admin-role-badge ${a.ruolo}`}>{ROLE_LABELS[a.ruolo] ?? a.ruolo}</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="rb-admin-reset-btn"
                            onClick={() => doResetPassword(a)}
                            disabled={!canManageRow}
                          >
                            Reset
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {accounts.length === 0 && (
                    <tr>
                      <td colSpan={11} className="rb-admin-empty">Nessuno si è ancora registrato.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'posta' && <MailboxPane messages={messages} onMarkRead={markRead} />}
      </div>

      {resetInfo && (
        <div className="rb-admin-reset-overlay" onClick={() => setResetInfo(null)}>
          <div className="rb-admin-reset-card" onClick={(e) => e.stopPropagation()}>
            <h3>Nuova password per {resetInfo.nickname}</h3>
            <p>Comunicala tu all'utente (non c'è invio automatico via mail): è l'unica volta che viene mostrata.</p>
            <code>{resetInfo.newPassword}</code>
            <button type="button" onClick={() => setResetInfo(null)}>Ho preso nota, chiudi</button>
          </div>
        </div>
      )}
    </div>
  );
}
