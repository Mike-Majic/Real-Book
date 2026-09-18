import { supabase } from './supabaseClient';

// Gruppi reali del mondo Social (Blu), su Supabase (tabelle groups +
// group_memberships) — sostituisce l'elenco statico che c'era prima (vedi
// groupsCategories.js, rimasto solo per il tag-picker di Fotografia).
// La forma restituita (name/tagline/icon/color/memberCount) è la stessa di
// prima apposta, così GroupsDirectory/TrendingGroups/PostComposer/PostCard
// non hanno dovuto cambiare come leggono un gruppo.
function mapGroup(row, memberCount = 0, postCount = 0) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.nome,
    tagline: row.descrizione ?? '',
    icon: row.icona || '👥',
    color: row.colore || '#1d9bf0',
    memberCount,
    postCount,
  };
}

// Tutti i gruppi non cancellati, con numero di iscritti e di post calcolati
// al volo (nessuna colonna "conteggio" da tenere sincronizzata a mano).
export async function listGroups() {
  try {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
    if (error || !data) return [];

    const ids = data.map((g) => g.id);
    if (!ids.length) return [];

    const [{ data: memberships }, { data: posts }] = await Promise.all([
      supabase.from('group_memberships').select('group_id').in('group_id', ids),
      supabase.from('posts').select('gruppo_id').is('deleted_at', null).in('gruppo_id', ids),
    ]);

    const memberCounts = new Map();
    for (const m of memberships ?? []) memberCounts.set(m.group_id, (memberCounts.get(m.group_id) ?? 0) + 1);
    const postCounts = new Map();
    for (const p of posts ?? []) postCounts.set(p.gruppo_id, (postCounts.get(p.gruppo_id) ?? 0) + 1);

    return data.map((g) => mapGroup(g, memberCounts.get(g.id) ?? 0, postCounts.get(g.id) ?? 0));
  } catch {
    return [];
  }
}

// Id dei gruppi a cui l'utente loggato è iscritto (per lo stato "Iscritto ✓").
export async function getMyGroupIds() {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return [];
    const { data, error } = await supabase.from('group_memberships').select('group_id').eq('user_id', auth.user.id);
    if (error || !data) return [];
    return data.map((r) => r.group_id);
  } catch {
    return [];
  }
}

// Crea un gruppo e iscrive subito chi lo crea come "owner" della community
// (diverso dal ruolo owner/moderatore dell'account: qui è solo chi
// amministra questo singolo gruppo).
export async function createGroup({ nome, descrizione, icona, colore }) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { error: 'Devi essere loggato.' };
    if (!nome?.trim()) return { error: 'Dai un nome al gruppo.' };

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        owner_id: auth.user.id,
        nome: nome.trim(),
        descrizione: descrizione?.trim() ?? '',
        icona: icona || '👥',
        colore: colore || '#1d9bf0',
      })
      .select()
      .single();
    if (error) return { error: error.message };

    await supabase.from('group_memberships').insert({ group_id: group.id, user_id: auth.user.id, ruolo: 'owner' });
    return { group: mapGroup(group, 1, 0) };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

export async function joinGroup(groupId) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { error: 'Devi essere loggato.' };
    const { error } = await supabase
      .from('group_memberships')
      .insert({ group_id: groupId, user_id: auth.user.id, ruolo: 'membro' });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

export async function leaveGroup(groupId) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { error: 'Devi essere loggato.' };
    const { error } = await supabase.from('group_memberships').delete().eq('group_id', groupId).eq('user_id', auth.user.id);
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}
