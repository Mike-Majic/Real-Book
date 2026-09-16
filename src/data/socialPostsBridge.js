import { INITIAL_POSTS } from './socialPosts';

const STORAGE_KEY = 'rb-social-posts';

function loadStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

let uidCounter = 0;
function makeId(prefix) {
  uidCounter += 1;
  return `${prefix}-${Date.now()}-${uidCounter}`;
}

// Le foto della Fotografia stile Pinterest (mondo Arte) si caricano SOLO da
// lì, mai dal mondo Social direttamente — ma se sono taggate a persone o
// gruppi del mondo Blu devono comparire anche nella sua bacheca. SocialFeed
// non è montato quando siamo nel mondo Arte, quindi non si può aggiornare
// il suo stato React: si scrive direttamente nello stesso localStorage che
// SocialFeed legge al montaggio (rb-social-posts) — la vedrà non appena
// l'utente torna nel mondo Social.
export function publishPhotoPost({ testo, foto, gruppoId = null, fotoTagLabels = [] }) {
  const posts = loadStored(STORAGE_KEY, INITIAL_POSTS);
  const newPost = {
    id: makeId('post'),
    autoreId: 'me',
    testo: testo ?? '',
    data: new Date().toISOString(),
    mi_piace: [],
    commenti: [],
    gif: null,
    link_esterno: null,
    gruppo_id: gruppoId,
    foto,
    fotoTagLabels,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newPost, ...posts]));
}
