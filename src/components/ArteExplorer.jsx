import { useState } from 'react';
import { ARTE_CATEGORIES, resolveCategoryQuery } from '../data/arteCategories';
import CategoryColumn from './CategoryColumn';
import './ArteExplorer.css';

export default function ArteExplorer({ world, activeCategory, onToggleCategory, onSearchCategory, initialSubfamily }) {
  const [categoryQuery, setCategoryQuery] = useState('');
  const [categoryQueryInvalid, setCategoryQueryInvalid] = useState(false);

  const category = ARTE_CATEGORIES.find((c) => c.id === activeCategory) ?? null;

  const submitCategorySearch = (e) => {
    e.preventDefault();
    const found = resolveCategoryQuery(categoryQuery);
    if (found) {
      setCategoryQueryInvalid(false);
      onSearchCategory(found);
      setCategoryQuery('');
    } else {
      setCategoryQueryInvalid(true);
    }
  };

  return (
    <div className="rb-arte-explorer" style={{ '--accent': world.color }}>
      {category && (
        <>
          <div className="rb-arte-top-controls">
            <button
              type="button"
              className="rb-arte-close-all-btn"
              onClick={() => onToggleCategory(null)}
              aria-label="Chiudi le colonne"
              title="Chiudi le colonne"
            >
              ✕
            </button>

            <form className="rb-arte-category-search" onSubmit={submitCategorySearch}>
              <input
                type="text"
                placeholder="Cerca una categoria (es. film)..."
                value={categoryQuery}
                onChange={(e) => {
                  setCategoryQuery(e.target.value);
                  setCategoryQueryInvalid(false);
                }}
                className={categoryQueryInvalid ? 'invalid' : ''}
              />
            </form>
          </div>

          <CategoryColumn key={category.id} category={category} initialSubfamily={initialSubfamily} />
        </>
      )}
    </div>
  );
}
