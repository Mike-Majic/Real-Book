import { useEffect, useState } from 'react';
import { getAccounts, updateAccountRole, setAccountVerified, resetAccountPassword } from '../data/accounts';
import { getMailboxMessages, markMessageRead } from '../data/modMailbox';
import { getReports, updateReportStatus } from '../data/reports';
import { getAuditLog, logAdminAction, AUDIT_LABELS } from '../data/adminAuditLog';
import { supabase } from '../data/supabaseClient';
import { computeAge } from '../data/age';
import { ROLES } from '../data/roles';
import ModalOverlay from './ModalOverlay';
import './AdminPanel.css';

const ROLE_LABELS = { [ROLES.OWNER]: 'Owner', [ROLES.MODERATOR]: 'Moderatore', [ROLES.USER]: 'Utente' };

const REPORT_TARGET_LABELS = {
  post: 'Post',
  commento: 'Commento',
  profilo: 'Profilo',
  gruppo: 'Gruppo',
  live: 'Live',
  evento: 'Evento',
};

const REPORT_STATO_LABELS = { aperto: 'Aperto', in_lavorazione: 'In lavorazione', chiuso: 'Chiuso' };

const ADMIN_TABS = [
  { id: 'utenti', label: 'Utenti' },
  { id: 'posta', label: 'Posta' },
  { id: 'moderazione', label: 'Moderazione' },
  { id: 'log', label: 'Log azioni' },
];

// Apre un allegato in una nuova scheda: il bucket "attachments" è privato,
// quindi serve un URL firmato temporaneo (valido 60 secondi) invece di un
// link diretto — è così che owner/moderatori guardano il documento caricato
// in registrazione prima di segnare un account come verificato, nessun
// servizio di controllo automatico dietro, solo revisione umana.
async function openAttachment(att) {
  const { data, error } = await supabase.storage.from('attachments').createSignedUrl(att.path, 60);
  if (error || !data?.signedUrl) return;
  window.open(data.signedUrl, '_blank', 'noopener');
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

// Coda di moderazione: segnalazioni su post/commenti/profili/gruppi/live/
// eventi. "Prendi in carico" e "Chiudi" sono le uniche azioni possibili qui
// (la rimozione del contenuto segnalato si fa dal mondo dove vive, non da
// qui) — servono soprattutto a tracciare chi si sta occupando di cosa,
// specialmente nel mondo Bambini dove la moderazione è prioritaria.
function ReportsPane({ reports, onChangeStatus }) {
  const [filtro, setFiltro] = useState('aperto');
  const visibili = filtro === 'tutti' ? reports : reports.filter((r) => r.stato === filtro);

  return (
    <div>
      <p className="rb-admin-hint">
        Segnalazioni degli utenti su contenuti o profili. Prioritarie quelle sul mondo Bambini.
      </p>
      <div className="rb-admin-tabs rb-admin-subtabs">
        {['aperto', 'in_lavorazione', 'chiuso', 'tutti'].map((f) => (
          <button key={f} type="button" className={filtro === f ? 'active' : ''} onClick={() => setFiltro(f)}>
            {f === 'tutti' ? 'Tutte' : REPORT_STATO_LABELS[f]}
          </button>
        ))}
      </div>
      {visibili.length === 0 && <p className="rb-admin-empty">Nessuna segnalazione.</p>}
      <ul className="rb-admin-mail-list">
        {visibili.map((r) => (
          <li key={r.id} className="rb-admin-mail-item">
            <div className="rb-admin-mail-head">
              <strong>{REPORT_TARGET_LABELS[r.targetType] ?? r.targetType}</strong>
              <span>{new Date(r.data).toLocaleString('it-IT')}</span>
            </div>
            <p className="rb-admin-mail-from">
              Da: {r.reporterNickname ?? '—'} · Stato:{' '}
              <span className={`rb-admin-role-badge rb-report-stato-${r.stato}`}>
                {REPORT_STATO_LABELS[r.stato] ?? r.stato}
              </span>
              {r.gestitoDaNickname && <> · Gestita da: {r.gestitoDaNickname}</>}
            </p>
            <p className="rb-admin-mail-body">{r.motivo}</p>
            {r.dettagli && <p className="rb-admin-mail-body">{r.dettagli}</p>}
            <div className="rb-admin-report-actions">
              {r.stato === 'aperto' && (
                <button type="button" onClick={() => onChangeStatus(r.id, 'in_lavorazione')}>
                  Prendi in carico
                </button>
              )}
              {r.stato !== 'chiuso' && (
                <button type="button" onClick={() => onChangeStatus(r.id, 'chiuso')}>
                  Chiudi
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Log di sola lettura delle azioni di owner/moderatori (cambio ruolo,
// verifica documento, reset password, gestione segnalazione): serve per
// accountability, non è modificabile da qui.
function AuditLogPane({ entries }) {
  return (
    <div>
      <p className="rb-admin-hint">Ogni azione di owner e moderatori, per tenerne traccia.</p>
      {entries.length === 0 && <p className="rb-admin-empty">Nessuna azione registrata finora.</p>}
      <div className="rb-admin-table-wrap">
        <table className="rb-admin-table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>Chi</th>
              <th>Azione</th>
              <th>Su</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.data).toLocaleString('it-IT')}</td>
                <td>{e.staffNickname ?? '—'}</td>
                <td>{AUDIT_LABELS[e.azione] ?? e.azione}</td>
                <td>{e.targetNickname ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Sezione backend: "Utenti" (elenco di chi si è registrato, con ruolo,
// verifica e reset password) e "Posta" (casella condivisa owner/
// moderatori). Solo l'owner può cambiare i ruoli; verifica e reset
// password sono aperti anche ai moderatori, tranne che sulla riga
// dell'owner — quella resta intoccabile da chiunque non sia l'owner
// stesso (le regole vere le applica Supabase lato server, qui è solo UI).
export default function AdminPanel({ user, onClose }) {
  const [tab, setTab] = useState('utenti');
  const [accounts, setAccounts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [resetSentTo, setResetSentTo] = useState(null);
  const isOwner = user?.ruolo === ROLES.OWNER;
  const unreadCount = messages.filter((m) => !m.letto).length;
  const openReportsCount = reports.filter((r) => r.stato === 'aperto').length;

  const refreshAccounts = () => getAccounts().then(setAccounts);
  const refreshMessages = () => getMailboxMessages().then(setMessages);
  const refreshReports = () => getReports().then(setReports);
  const refreshAuditLog = () => getAuditLog().then(setAuditLog);

  useEffect(() => {
    refreshAccounts();
    refreshMessages();
    refreshReports();
    refreshAuditLog();
  }, []);

  const changeRole = async (accountId, newRole) => {
    const { error } = await updateAccountRole(accountId, newRole);
    if (!error) {
      refreshAccounts();
      await logAdminAction('cambio_ruolo', accountId, { nuovoRuolo: newRole });
      refreshAuditLog();
    }
  };

  const toggleVerified = async (account) => {
    const nuovoStato = !account.verificato;
    const { error } = await setAccountVerified(account.id, nuovoStato);
    if (!error) {
      refreshAccounts();
      await logAdminAction('verifica_documento', account.id, { verificato: nuovoStato });
      refreshAuditLog();
    }
  };

  const doResetPassword = async (account) => {
    const { error } = await resetAccountPassword(account.email);
    if (!error) {
      setResetSentTo(account);
      await logAdminAction('reset_password', account.id, {});
      refreshAuditLog();
    }
  };

  const markRead = async (messageId) => {
    await markMessageRead(messageId);
    refreshMessages();
  };

  const changeReportStatus = async (reportId, stato) => {
    const { error } = await updateReportStatus(reportId, stato);
    if (!error) {
      refreshReports();
      await logAdminAction('gestione_segnalazione', null, { reportId, nuovoStato: stato });
      refreshAuditLog();
    }
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="rb-admin-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <h2>Backend</h2>

        <div className="rb-admin-tabs">
          {ADMIN_TABS.map((t) => (
            <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'posta' && unreadCount > 0 && <span className="rb-admin-tab-badge">{unreadCount}</span>}
              {t.id === 'moderazione' && openReportsCount > 0 && (
                <span className="rb-admin-tab-badge">{openReportsCount}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'utenti' && (
          <>
            <p className="rb-admin-hint">
              {isOwner
                ? 'Elenco di chi si è registrato. Puoi cambiare ruolo, verificare un documento o inviare una mail di reset password.'
                : "Elenco di chi si è registrato. Puoi verificare un documento o inviare una mail di reset password; solo l'owner cambia i ruoli."}
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
        {tab === 'moderazione' && <ReportsPane reports={reports} onChangeStatus={changeReportStatus} />}
        {tab === 'log' && <AuditLogPane entries={auditLog} />}
      </div>

      {resetSentTo && (
        <ModalOverlay onClose={() => setResetSentTo(null)} className="rb-admin-reset-overlay">
          <div className="rb-admin-reset-card" onClick={(e) => e.stopPropagation()}>
            <h3>Mail di reset inviata</h3>
            <p>
              A {resetSentTo.nickname} ({resetSentTo.email}) è arrivata una mail con il link per scegliere una
              nuova password — nessuna password passa da qui, in chiaro o no.
            </p>
            <button type="button" onClick={() => setResetSentTo(null)}>Ho preso nota, chiudi</button>
          </div>
        </ModalOverlay>
      )}
    </ModalOverlay>
  );
}
