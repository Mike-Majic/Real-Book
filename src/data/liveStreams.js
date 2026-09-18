import { supabase } from './supabaseClient';
import { fetchProfilesMap } from './posts';
import { translateInteractionError } from './errors';

// Live-chat reale del mondo Incontri (tabelle live_sessions/live_messages/
// live_views), al posto delle liste finte precedenti — che oltretutto,
// MOCK_USERS essendo stato azzerato, non mostravano già più nessuno.

// Sessioni live attive in un mondo, con host risolto e numero di
// spettatori (righe in live_views, uno per persona che ha aperto la
// diretta almeno una volta) — la RLS (live_sessions_select_all) esclude già
// da sola le dirette dell'altra fascia d'età o di un mondo non accessibile.
export async function listActiveLiveSessions(mondo = 'incontri') {
  try {
    const { data, error } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('mondo', mondo)
      .eq('attiva', true)
      .order('iniziata_at', { ascending: true });
    if (error || !data) return [];

    const sessionIds = data.map((s) => s.id);
    const [profilesMap, viewsRes] = await Promise.all([
      fetchProfilesMap(data.map((s) => s.host_id)),
      sessionIds.length
        ? supabase.from('live_views').select('session_id, user_id').in('session_id', sessionIds)
        : Promise.resolve({ data: [] }),
    ]);

    const viewCounts = new Map();
    for (const v of viewsRes.data ?? []) viewCounts.set(v.session_id, (viewCounts.get(v.session_id) ?? 0) + 1);

    return data
      .map((row) => ({
        id: row.id,
        hostId: row.host_id,
        host: profilesMap.get(row.host_id) ?? { id: row.host_id, name: 'Utente', avatar: '' },
        iniziataAt: row.iniziata_at,
        viewCount: viewCounts.get(row.id) ?? 0,
      }))
      .sort((a, b) => b.viewCount - a.viewCount);
  } catch {
    return [];
  }
}

export async function startLiveSession(mondo = 'incontri') {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { error: 'Devi essere loggato.' };
    const { data, error } = await supabase
      .from('live_sessions')
      .insert({ host_id: auth.user.id, mondo, attiva: true })
      .select()
      .single();
    if (error) return { error: translateInteractionError(error) };
    return { id: data.id };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

export async function endLiveSession(sessionId) {
  try {
    const { error } = await supabase
      .from('live_sessions')
      .update({ attiva: false, terminata_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

// Registra che si è visto (almeno un istante) una diretta: una sola riga
// per persona e sessione (chiave primaria session_id+user_id), un secondo
// ingresso nella stessa diretta non conta un altro spettatore.
export async function recordLiveView(sessionId) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return {};
    const { error } = await supabase.from('live_views').insert({ session_id: sessionId, user_id: auth.user.id });
    if (error && error.code !== '23505') return { error: error.message };
    return {};
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

export async function fetchLiveMessages(sessionId) {
  try {
    const { data, error } = await supabase
      .from('live_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) return { error: error.message };
    if (!data) return { messages: [] };

    const profilesMap = await fetchProfilesMap(data.map((m) => m.user_id));
    const messages = data.map((row) => ({
      id: row.id,
      autoreId: row.user_id,
      author: profilesMap.get(row.user_id) ?? { id: row.user_id, name: 'Utente', avatar: '' },
      testo: row.testo,
      data: row.created_at,
    }));
    return { messages };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

// Un messaggio respinto (autore bloccato, fascia d'età diversa, diretta
// finita) arriva come il solito errore generico di row-level security.
export async function sendLiveMessage(sessionId, testo) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { error: 'Devi essere loggato.' };
    const { error } = await supabase
      .from('live_messages')
      .insert({ session_id: sessionId, user_id: auth.user.id, testo });
    if (error) return { error: translateInteractionError(error) };
    return {};
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

export function subscribeToLiveMessages(sessionId, onInsert) {
  return supabase
    .channel(`live-messages-${sessionId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_messages', filter: `session_id=eq.${sessionId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();
}

// Canale realtime per le dirette di un mondo: comparire/scomparire dalla
// lista "in diretta ora" quando qualcuno inizia o termina, senza dover
// ricaricare la pagina.
export function subscribeToLiveSessions(mondo, onChange) {
  return supabase
    .channel(`live-sessions-${mondo}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions', filter: `mondo=eq.${mondo}` }, onChange)
    .subscribe();
}
