// "Tutti i libri gratuiti che esistono nel mondo" non si può incorporare
// nell'app (solo Project Gutenberg ne ha oltre 75.000, e non è nemmeno
// tutto): niente lista finta, si interroga in tempo reale la loro API
// pubblica (Gutendex), gratuita, senza chiave, pensata apposta per essere
// chiamata dal browser. Così la Libreria ha accesso davvero a tutto il loro
// catalogo di opere libere da diritti, non solo a un campione incorporato.
const GUTENDEX_BASE = 'https://gutendex.com/books/';

export async function searchFreeBooks(query, page = 1) {
  const url = `${GUTENDEX_BASE}?search=${encodeURIComponent(query.trim())}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`richiesta fallita (${res.status})`);
  const data = await res.json();
  return {
    count: data.count,
    hasMore: Boolean(data.next),
    books: (data.results ?? []).map((b) => ({
      id: b.id,
      title: b.title,
      authors: (b.authors ?? []).map((a) => a.name).join(', ') || 'Autore sconosciuto',
      cover: b.formats?.['image/jpeg'] ?? null,
      readUrl:
        b.formats?.['text/html'] ??
        b.formats?.['text/html; charset=utf-8'] ??
        `https://www.gutenberg.org/ebooks/${b.id}`,
    })),
  };
}
