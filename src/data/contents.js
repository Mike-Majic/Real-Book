import { supabase } from './supabaseClient';

// Modello unico foto/video: un contenuto (contents) può comparire in più
// "posizionamenti" (content_placements: mondo + categoria + sottofamiglia),
// con UN SOLO conteggio di like condiviso (content_likes) — la stessa foto
// pubblicata anche nel mondo Arte non raddoppia i like, li somma nello
// stesso posto per tutti.

// Carica il file nel bucket pubblico "content-media" (percorso sotto il
// proprio uid, come richiedono le policy di storage) e crea la riga in
// contents + una riga in content_placements per ogni posizionamento
// scelto/confermato (sempre almeno quello nel mondo Social).
export async function publishContent({ file, type, caption, tags, placements }) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { error: 'Devi essere loggato.' };

    const path = `${auth.user.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('content-media').upload(path, file);
    if (uploadError) return { error: uploadError.message };

    const { data: content, error: contentError } = await supabase
      .from('contents')
      .insert({
        owner_id: auth.user.id,
        type,
        storage_path: path,
        caption: caption ?? '',
        tags: tags ?? [],
      })
      .select()
      .single();
    if (contentError) return { error: contentError.message };

    const rows = (placements?.length ? placements : [{ world: 'social' }]).map((p) => ({
      content_id: content.id,
      world_id: p.world,
      category_id: p.category ?? null,
      subfamily: p.subfamily ?? null,
    }));
    const { error: placementError } = await supabase.from('content_placements').insert(rows);
    if (placementError) return { error: placementError.message };

    return { content, url: getContentUrl(path) };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete durante la pubblicazione.' };
  }
}

export function getContentUrl(storagePath) {
  const { data } = supabase.storage.from('content-media').getPublicUrl(storagePath);
  return data.publicUrl;
}

// Contenuti posizionati in un mondo (ed eventualmente una categoria
// specifica), più recenti prima, con conteggio like e se piace già a me.
export async function listContentsForPlacement({ world, category }) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const myId = auth?.user?.id ?? null;

    let query = supabase
      .from('content_placements')
      .select('subfamily, contents(id, owner_id, type, storage_path, caption, tags, created_at)')
      .eq('world_id', world)
      .order('created_at', { referencedTable: 'contents', ascending: false });
    query = category ? query.eq('category_id', category) : query.is('category_id', null);

    const { data, error } = await query;
    if (error || !data) return [];

    const contentIds = data.map((row) => row.contents?.id).filter(Boolean);
    const likeCounts = new Map();
    const likedByMe = new Set();
    if (contentIds.length) {
      const { data: likes } = await supabase.from('content_likes').select('content_id, user_id').in('content_id', contentIds);
      for (const like of likes ?? []) {
        likeCounts.set(like.content_id, (likeCounts.get(like.content_id) ?? 0) + 1);
        if (like.user_id === myId) likedByMe.add(like.content_id);
      }
    }

    return data
      .filter((row) => row.contents)
      .map((row) => ({
        ...row.contents,
        subfamily: row.subfamily,
        url: getContentUrl(row.contents.storage_path),
        likeCount: likeCounts.get(row.contents.id) ?? 0,
        likedByMe: likedByMe.has(row.contents.id),
        isMine: myId != null && row.contents.owner_id === myId,
      }));
  } catch {
    // Rete non disponibile o Supabase irraggiungibile: meglio una lista
    // vuota che un crash del componente che la mostra.
    return [];
  }
}

export async function toggleContentLike(contentId, currentlyLiked) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { error: 'Devi essere loggato.' };

    if (currentlyLiked) {
      const { error } = await supabase.from('content_likes').delete().eq('content_id', contentId).eq('user_id', auth.user.id);
      if (error) return { error: error.message };
      return { liked: false };
    }
    const { error } = await supabase.from('content_likes').insert({ content_id: contentId, user_id: auth.user.id });
    if (error) return { error: error.message };
    return { liked: true };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}
