import { WORLDS } from './worlds';
import { ARTE_CATEGORIES } from './arteCategories';
import { NERD_CATEGORIES } from './nerdCategories';
import { INCONTRI_CATEGORIES } from './incontriCategories';

// Icone dei mondi, usate finora solo nella spiegazione del progetto: qui
// servono per etichettare ogni gruppo di categorie nell'hub testuale.
const WORLD_ICONS = { bambini: '🟢', social: '🔵', lavoro: '⚪', arte: '🟣', nerd: '🟡', incontri: '🔴' };

// Il mondo Blu è la "homepage" testuale di tutti gli altri mondi con
// categorie proprie, tranne Bambini (niente profili/contenuti di minori,
// nessuna vetrina qui) e Lavoro/Social stessi (non hanno categorie a
// triangoli sul globo). Cliccare una voce porta l'app in quel mondo, sul
// globo, aperta su quella categoria (vedi App.jsx, navigateToCategory).
const HUB_WORLD_IDS = ['arte', 'nerd', 'incontri'];

export const CATEGORY_HUB = HUB_WORLD_IDS.map((worldId) => {
  const world = WORLDS.find((w) => w.id === worldId);
  const categories = { arte: ARTE_CATEGORIES, nerd: NERD_CATEGORIES, incontri: INCONTRI_CATEGORIES }[worldId];
  return {
    worldId,
    worldLabel: world.label,
    worldColor: world.color,
    worldIcon: WORLD_ICONS[worldId] ?? '🌐',
    categories: categories.map((c) => ({ id: c.id, label: c.label, icon: c.icon ?? null })),
  };
});
