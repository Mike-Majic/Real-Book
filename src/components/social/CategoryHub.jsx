import { CATEGORY_HUB } from '../../data/categoryHub';
import './CategoryHub.css';

// Il mondo Social è la "homepage" testuale di tutti gli altri mondi: ogni
// categoria elencata qui appartiene davvero a un altro mondo (Arte & Musica,
// Nerd, Incontri — niente Bambini). Sceglierne una chiude questo pannello
// (il mondo Social si smonta da solo appena si cambia mondo) e porta l'app
// in quel mondo, sul globo, aperta su quella categoria.
export default function CategoryHub({ onNavigateToCategory }) {
  return (
    <div className="rb-category-hub">
      <p className="rb-category-hub-hint">Tutte le categorie degli altri mondi, in un unico posto: scegline una per andarci.</p>
      {CATEGORY_HUB.map((group) => (
        <div key={group.worldId} className="rb-category-hub-group" style={{ '--hub-color': group.worldColor }}>
          <h4 className="rb-category-hub-title">
            {group.worldIcon} {group.worldLabel}
          </h4>
          <ul className="rb-category-hub-list">
            {group.categories.map((c) => (
              <li key={c.id}>
                <button type="button" className="rb-category-hub-btn" onClick={() => onNavigateToCategory(group.worldId, c.id)}>
                  {c.icon && <span className="rb-category-hub-icon">{c.icon}</span>}
                  {c.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
