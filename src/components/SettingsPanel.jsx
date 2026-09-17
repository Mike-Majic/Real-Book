import { useEffect, useState } from 'react';
import { CONTINENTS, REGIONS } from '../data/geo';
import { ARTE_CATEGORIES } from '../data/arteCategories';
import { MOCK_USERS } from '../data/mockUsers';
import { WORLDS } from '../data/worlds';
import { listBlockedContacts, blockContact, unblockContact } from '../data/blockedContacts';
import { resetAccountPassword, setOwnWorlds } from '../data/accounts';
import ModalOverlay from './ModalOverlay';
import './SettingsPanel.css';

function contactName(id) {
  const u = MOCK_USERS.find((m) => m.id === id);
  return u?.name ?? `Utente #${id}`;
}

// Riga di titolo cliccabile che apre/chiude il contenuto sotto — stesso
// linguaggio visivo di rb-settings-nav-btn (che porta a un'altra vista),
// qui invece resta nella stessa schermata e mostra/nasconde i campi.
// "level" distingue la fisarmonica di primo livello (Luogo, Personalizza,
// Privacy) da quella annidata dentro (le sue "sotto impostazioni"): senza
// questo secondo livello, cliccando una voce comparivano subito tutti i
// suoi campi tutti insieme — con più voci dentro diventava una colonna
// lunghissima da scorrere. Ora si apre una voce alla volta.
function CollapsibleSection({ title, hint, open, onToggle, children, level = 'group' }) {
  const Wrapper = level === 'group' ? 'section' : 'div';
  return (
    <Wrapper className={level === 'group' ? 'rb-settings-section' : 'rb-settings-subaccordion'}>
      <button
        type="button"
        className={level === 'group' ? 'rb-settings-accordion-header' : 'rb-settings-subaccordion-header'}
        onClick={onToggle}
        aria-expanded={open}
      >
        <span>
          <strong>{title}</strong>
          {hint && <p>{hint}</p>}
        </span>
        <span className="rb-settings-accordion-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className={level === 'group' ? 'rb-settings-accordion-body' : 'rb-settings-subaccordion-body'}>
          {children}
        </div>
      )}
    </Wrapper>
  );
}

// Vista "Filtri avanzati": una seconda schermata dentro lo stesso pannello,
// raggiunta con un pulsante e richiusa con "Indietro" verso le Impostazioni
// principali. Oggi ospita solo la scorciatoia a una categoria di Arte &
// Musica, ma è pensata per accogliere altri filtri via via che si
// aggiungono, senza affollare la schermata principale.
function AdvancedFiltersView({ onBack, onClose, arteFilter, setArteFilter }) {
  const selectedArteCategory = ARTE_CATEGORIES.find((c) => c.id === arteFilter.category) ?? null;

  return (
    <>
      <div className="rb-settings-header">
        <button type="button" className="rb-settings-back-btn" onClick={onBack}>
          ← Impostazioni
        </button>
        <button className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
      </div>
      <h2 className="rb-settings-subtitle">Filtri avanzati</h2>

      <section className="rb-settings-section rb-settings-section-first">
        <h3>Arte & Musica</h3>
        <p className="rb-settings-hint">Vai dritto a una categoria (ed eventualmente a una sottofamiglia) del mondo Arte & Musica.</p>

        <label className="rb-field">
          <span>Categoria</span>
          <select
            value={arteFilter.category}
            onChange={(e) => setArteFilter({ category: e.target.value, subfamily: '' })}
          >
            <option value="">Nessuna categoria</option>
            {ARTE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        {selectedArteCategory && (
          <label className="rb-field">
            <span>Sottofamiglia</span>
            <select
              value={arteFilter.subfamily}
              onChange={(e) => setArteFilter({ category: arteFilter.category, subfamily: e.target.value })}
            >
              <option value="">Tutte</option>
              {selectedArteCategory.subfamilies.map((sf) => (
                <option key={sf} value={sf}>{sf}</option>
              ))}
            </select>
          </label>
        )}
      </section>

      <p className="rb-settings-footnote">Altri filtri avanzati arriveranno qui, senza affollare le Impostazioni principali.</p>
    </>
  );
}

// Sotto-voce "Mondi" di "Personalizza il tuo Versemove": quali mondi
// restano abilitati per l'account. Se un mondo viene disattivato, oltre a
// non poterlo più esplorare (vedi AccessGate in App.jsx), il proprio
// profilo/marker smette di comparire in quel mondo per gli altri utenti
// (vedi il filtro su globeUsers in App.jsx).
function WorldsSubsection({ user, onOpenAuth, onUpdateUser }) {
  const [selected, setSelected] = useState(user?.mondiAbilitati?.length ? user.mondiAbilitati : WORLDS.map((w) => w.id));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <button type="button" className="rb-settings-nav-btn" onClick={onOpenAuth}>
        <span><strong>Accedi per scegliere i tuoi mondi</strong></span>
        <span aria-hidden="true">→</span>
      </button>
    );
  }

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
    onUpdateUser?.(account);
  };

  return (
    <>
      <p className="rb-settings-hint">
        Dove togli la spunta, il mondo sparisce per te e il tuo profilo non comparirà più agli altri in
        quel mondo. Puoi cambiare idea quando vuoi, fino a 4 volte a settimana.
      </p>
      <div className="rb-settings-worlds-list">
        {WORLDS.map((w) => (
          <label key={w.id} className="rb-settings-world-row">
            <input type="checkbox" checked={selected.includes(w.id)} onChange={() => toggle(w.id)} />
            <span className="rb-settings-world-dot" style={{ background: w.color }} />
            <span>{w.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="rb-privacy-error">{error}</p>}
      {success && <p className="rb-privacy-success">{success}</p>}
      <button type="button" className="rb-reset-filters-btn" onClick={save} disabled={busy}>
        {busy ? 'Un attimo…' : 'Salva'}
      </button>
    </>
  );
}

// Vista "Privacy": tre sotto-voci (Utenti, Posizione, Sicurezza e accesso),
// una alla volta come il resto del pannello.
function PrivacyView({ onBack, onClose, user, onOpenAuth, friends, onUnfriend, visibility, setVisibility }) {
  const [sub, setSub] = useState('');
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwSent, setPwSent] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return undefined;
    }
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
  }, [user]);

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

  const changePassword = async () => {
    if (!user?.email) return;
    setPwBusy(true);
    const { error: err } = await resetAccountPassword(user.email);
    setPwBusy(false);
    if (!err) setPwSent(true);
  };

  const blockableFriends = (friends ?? []).filter((id) => !blocked.includes(String(id)));
  const toggleSub = (name) => setSub((s) => (s === name ? '' : name));

  return (
    <>
      <div className="rb-settings-header">
        <button type="button" className="rb-settings-back-btn" onClick={onBack}>
          ← Impostazioni
        </button>
        <button className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
      </div>
      <h2 className="rb-settings-subtitle">Privacy</h2>

      <CollapsibleSection level="sub" title="Utenti" hint="Contatti bloccati" open={sub === 'utenti'} onToggle={() => toggleSub('utenti')}>
        {!user ? (
          <button type="button" className="rb-settings-nav-btn" onClick={onOpenAuth}>
            <span><strong>Accedi per gestire i contatti bloccati</strong></span>
            <span aria-hidden="true">→</span>
          </button>
        ) : loading ? (
          <p className="rb-settings-hint">Caricamento...</p>
        ) : (
          <>
            <p className="rb-settings-hint">
              Un contatto bloccato non può più scriverti né vederti tra i tuoi amici. Puoi sbloccarlo quando vuoi.
            </p>
            {error && <p className="rb-privacy-error">{error}</p>}
            {blocked.length > 0 && (
              <ul className="rb-privacy-contact-list">
                {blocked.map((id) => (
                  <li key={id} className="rb-privacy-contact-row">
                    <span>{contactName(Number.isNaN(Number(id)) ? id : Number(id))}</span>
                    <button type="button" className="rb-reset-filters-btn rb-privacy-inline-btn" onClick={() => doUnblock(id)}>
                      Sblocca
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {blockableFriends.length > 0 && (
              <ul className="rb-privacy-contact-list">
                {blockableFriends.map((id) => (
                  <li key={id} className="rb-privacy-contact-row">
                    <span>{contactName(id)}</span>
                    <button type="button" className="rb-reset-filters-btn rb-privacy-inline-btn" onClick={() => doBlock(id)}>
                      Blocca
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {blocked.length === 0 && blockableFriends.length === 0 && (
              <p className="rb-settings-hint">Nessun contatto da mostrare.</p>
            )}
          </>
        )}
      </CollapsibleSection>

      <CollapsibleSection level="sub" title="Posizione" hint="Chi ti vede vicino e la posizione in tempo reale" open={sub === 'posizione'} onToggle={() => toggleSub('posizione')}>
        <label className="rb-toggle-row">
          <span className="rb-toggle-text">
            <strong>Visibile agli altri utenti vicino a te</strong>
            <p>Se attivo, chi ti è vicino può vedere nella colonna "Persone vicine" che hai messo mi piace o parteciperò a un contenuto. Mai la posizione esatta, solo la città. Di default è spento.</p>
          </span>
          <span className="rb-toggle">
            <input
              type="checkbox"
              checked={visibility.nearbyVisible}
              onChange={(e) => setVisibility((v) => ({ ...v, nearbyVisible: e.target.checked }))}
            />
            <span className="rb-toggle-slider" />
          </span>
        </label>

        <p className="rb-settings-hint" style={{ marginTop: 14 }}>
          {user
            ? 'Se attivo, il pallino sul tuo marker nel mondo diventa verde e segue la tua posizione reale, aggiornata in tempo reale. Se spento, il pallino resta quello standard e nessuna posizione viene condivisa o richiesta al browser.'
            : 'Accedi per poter condividere la tua posizione in tempo reale.'}
        </p>
        <label className="rb-toggle-row">
          <span className="rb-toggle-text">
            <strong>Condividi la mia posizione in tempo reale</strong>
          </span>
          <span className="rb-toggle">
            <input
              type="checkbox"
              checked={visibility.shareLiveLocation}
              disabled={!user}
              onChange={(e) => {
                if (!user) {
                  onOpenAuth?.();
                  return;
                }
                setVisibility((v) => ({ ...v, shareLiveLocation: e.target.checked }));
              }}
            />
            <span className="rb-toggle-slider" />
          </span>
        </label>
      </CollapsibleSection>

      <CollapsibleSection level="sub" title="Sicurezza e accesso" hint="Password dell'account" open={sub === 'sicurezza'} onToggle={() => toggleSub('sicurezza')}>
        <p className="rb-settings-hint">Ti mandiamo una mail con un link per scegliere una nuova password.</p>
        {!user ? (
          <button type="button" className="rb-settings-nav-btn" onClick={onOpenAuth}>
            <span><strong>Accedi per gestire la sicurezza dell'account</strong></span>
            <span aria-hidden="true">→</span>
          </button>
        ) : pwSent ? (
          <p className="rb-settings-hint">Mail inviata: controlla la posta (anche spam).</p>
        ) : (
          <button type="button" className="rb-reset-filters-btn" onClick={changePassword} disabled={pwBusy}>
            {pwBusy ? 'Un attimo…' : 'Cambia password'}
          </button>
        )}
      </CollapsibleSection>

      <p className="rb-settings-footnote">Altre impostazioni privacy arriveranno qui.</p>
    </>
  );
}

export default function SettingsPanel({
  open,
  onClose,
  onApply,
  user,
  onOpenAuth,
  onUpdateUser,
  filters,
  setFilters,
  locationFilters,
  setLocationFilters,
  arteFilter,
  setArteFilter,
  visibility,
  setVisibility,
  onResetFilters,
  friends,
  onUnfriend,
}) {
  const [view, setView] = useState('main');
  const [luogoOpen, setLuogoOpen] = useState(false);
  const [personalizzaOpen, setPersonalizzaOpen] = useState(false);
  const [personalizzaSub, setPersonalizzaSub] = useState('');

  if (!open) return null;

  const updateFilter = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const updateLocation = (key, value) => setLocationFilters((f) => ({ ...f, [key]: value }));
  const togglePersonalizzaSub = (name) => setPersonalizzaSub((s) => (s === name ? '' : name));

  if (view === 'advanced') {
    return (
      <ModalOverlay onClose={onClose} className="rb-settings-overlay">
        <aside className="rb-settings-panel" onClick={(e) => e.stopPropagation()}>
          <AdvancedFiltersView onBack={() => setView('main')} onClose={onClose} arteFilter={arteFilter} setArteFilter={setArteFilter} />
        </aside>
      </ModalOverlay>
    );
  }

  if (view === 'privacy') {
    return (
      <ModalOverlay onClose={onClose} className="rb-settings-overlay">
        <aside className="rb-settings-panel" onClick={(e) => e.stopPropagation()}>
          <PrivacyView
            onBack={() => setView('main')}
            onClose={onClose}
            user={user}
            onOpenAuth={onOpenAuth}
            friends={friends}
            onUnfriend={onUnfriend}
            visibility={visibility}
            setVisibility={setVisibility}
          />
        </aside>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClose={onClose} className="rb-settings-overlay">
      <aside className="rb-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rb-settings-header">
          <h2>Impostazioni</h2>
          <button className="rb-close-btn" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>

        <div className="rb-filter-actions">
          <button type="button" className="rb-reset-filters-btn" onClick={onResetFilters}>
            Azzera tutti i filtri
          </button>
          <button type="button" className="rb-apply-filters-btn" onClick={onApply ?? onClose}>
            Applica
          </button>
        </div>

        <CollapsibleSection
          title="Luogo"
          hint="Continente, regione e città: valido per tutti i mondi."
          open={luogoOpen}
          onToggle={() => setLuogoOpen((v) => !v)}
        >
          <label className="rb-field">
            <span>Continente</span>
            <select value={locationFilters.continent} onChange={(e) => updateLocation('continent', e.target.value)}>
              <option value="">Tutti i continenti</option>
              {CONTINENTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label className="rb-field">
            <span>Regione</span>
            <select value={locationFilters.region} onChange={(e) => updateLocation('region', e.target.value)}>
              <option value="">Tutte le regioni</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>

          <label className="rb-field">
            <span>Città</span>
            <input
              type="text"
              placeholder="Es. Roma"
              value={locationFilters.city}
              onChange={(e) => updateLocation('city', e.target.value)}
            />
          </label>

          <label className="rb-field">
            <span>Distanza: {locationFilters.distance} km</span>
            <input type="range" min={1} max={500} value={locationFilters.distance}
              onChange={(e) => updateLocation('distance', Number(e.target.value))} />
          </label>
        </CollapsibleSection>

        <CollapsibleSection
          title="Personalizza il tuo Versemove"
          hint="Chi vuoi vedere e quali mondi usare — tutto gratuito, nessuna funzione a pagamento."
          open={personalizzaOpen}
          onToggle={() => setPersonalizzaOpen((v) => !v)}
        >
          <CollapsibleSection level="sub" title="Mostrami ed età" hint="Genere ed età di chi vuoi vedere" open={personalizzaSub === 'mostrami'} onToggle={() => togglePersonalizzaSub('mostrami')}>
            <label className="rb-field">
              <span>Mostrami</span>
              <div className="rb-chip-group">
                {['Tutti', 'Uomo', 'Donna'].map((opt) => (
                  <button
                    key={opt}
                    className={`rb-chip ${filters.gender === opt ? 'active' : ''}`}
                    onClick={() => updateFilter('gender', opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </label>

            <label className="rb-field">
              <span>Età: {filters.ageMin}–{filters.ageMax}</span>
              <div className="rb-range-row">
                <input type="range" min={18} max={80} value={filters.ageMin}
                  onChange={(e) => updateFilter('ageMin', Math.min(Number(e.target.value), filters.ageMax))} />
                <input type="range" min={18} max={80} value={filters.ageMax}
                  onChange={(e) => updateFilter('ageMax', Math.max(Number(e.target.value), filters.ageMin))} />
              </div>
            </label>
          </CollapsibleSection>

          <CollapsibleSection level="sub" title="Mondi" hint="Quali mondi abilitare per il tuo account" open={personalizzaSub === 'mondi'} onToggle={() => togglePersonalizzaSub('mondi')}>
            <WorldsSubsection user={user} onOpenAuth={onOpenAuth} onUpdateUser={onUpdateUser} />
          </CollapsibleSection>
        </CollapsibleSection>

        <section className="rb-settings-section">
          <button type="button" className="rb-settings-nav-btn" onClick={() => setView('advanced')}>
            <span>
              <strong>Filtri avanzati</strong>
              <p>Categorie specifiche di un mondo e altri filtri in arrivo.</p>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <section className="rb-settings-section">
          <button type="button" className="rb-settings-nav-btn" onClick={() => setView('privacy')}>
            <span>
              <strong>Privacy</strong>
              <p>Utenti, posizione, sicurezza e accesso.</p>
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <p className="rb-settings-footnote">I filtri sono salvati solo su questo dispositivo, per ora. In arrivo: account veri e ricerca in tempo reale.</p>
      </aside>
    </ModalOverlay>
  );
}
