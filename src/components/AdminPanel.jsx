import { useState } from 'react';
import { getAccounts, updateAccountRole } from '../data/accounts';
import { ROLES } from '../data/roles';
import './AdminPanel.css';

const ROLE_LABELS = { [ROLES.OWNER]: 'Owner', [ROLES.MODERATOR]: 'Moderatore', [ROLES.USER]: 'Utente' };

// Sezione Utenti del backend: visibile a owner e moderatori (vedi il
// bottone in TopBar), ma solo l'owner può cambiare il ruolo altrui — i
// moderatori la vedono in sola lettura. La riga dell'owner non ha mai
// controlli: il suo ruolo non è modificabile da nessuno (vedi
// updateAccountRole in accounts.js, che rifiuta comunque il cambio anche
// se qualcuno aggirasse l'interfaccia).
export default function AdminPanel({ user, onClose }) {
  const [accounts, setAccounts] = useState(() => getAccounts());
  const isOwner = user?.ruolo === ROLES.OWNER;

  const changeRole = (accountId, newRole) => {
    const { error } = updateAccountRole(accountId, newRole);
    if (!error) setAccounts(getAccounts());
  };

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <div className="rb-admin-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <h2>Backend · Utenti</h2>
        <p className="rb-admin-hint">
          {isOwner
            ? 'Elenco di chi si è registrato. Puoi rendere qualcuno moderatore o riportarlo a utente normale.'
            : 'Elenco di chi si è registrato (sola lettura: solo l\'owner può cambiare i ruoli).'}
        </p>

        <div className="rb-admin-table-wrap">
          <table className="rb-admin-table">
            <thead>
              <tr>
                <th>Nome utente</th>
                <th>Nickname</th>
                <th>Mail</th>
                <th>Cellulare</th>
                <th>Mail di backup</th>
                <th>Allegati</th>
                <th>Ruolo</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const lockedRole = a.ruolo === ROLES.OWNER;
                return (
                  <tr key={a.id}>
                    <td>{a.username}</td>
                    <td>{a.nickname}</td>
                    <td>{a.email}</td>
                    <td>{a.phone || '—'}</td>
                    <td>{a.backupEmail || '—'}</td>
                    <td>{a.attachments?.length ?? 0}</td>
                    <td>
                      {isOwner && !lockedRole ? (
                        <select value={a.ruolo} onChange={(e) => changeRole(a.id, e.target.value)}>
                          <option value={ROLES.USER}>{ROLE_LABELS[ROLES.USER]}</option>
                          <option value={ROLES.MODERATOR}>{ROLE_LABELS[ROLES.MODERATOR]}</option>
                        </select>
                      ) : (
                        <span className={`rb-admin-role-badge ${a.ruolo}`}>{ROLE_LABELS[a.ruolo] ?? a.ruolo}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={7} className="rb-admin-empty">Nessuno si è ancora registrato.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
