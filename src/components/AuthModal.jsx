import { useState } from 'react';
import './AuthModal.css';

export default function AuthModal({ open, onClose, onLogin }) {
  const [name, setName] = useState('');

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin({
      name: name.trim(),
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name.trim())}`,
    });
    setName('');
  };

  return (
    <div className="rb-modal-overlay" onClick={onClose}>
      <form className="rb-auth-card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        <h2>Accedi a Versemove</h2>
        <p className="rb-auth-hint">Login dimostrativo: nessuna password reale, solo per provare l'interfaccia.</p>
        <label className="rb-field">
          <span>Nome utente</span>
          <input
            type="text"
            autoFocus
            placeholder="Come vuoi farti chiamare?"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button type="submit" className="rb-btn-primary rb-auth-submit">Entra</button>
      </form>
    </div>
  );
}
