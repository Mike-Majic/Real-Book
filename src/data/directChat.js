import { supabase } from './supabaseClient';
import { fetchProfilesMap } from './posts';
import { translateInteractionError } from './errors';

// Apre (o riusa, se già esiste) la conversazione diretta con un altro
// utente reale — la funzione lato server aggiunge entrambi come
// partecipanti, qui non serve nient'altro.
export async function startDirectConversation(otherId) {
  try {
    const { data, error } = await supabase.rpc('start_direct_conversation', { p_other_id: otherId });
    if (error) return { error: error.message };
    return { conversationId: data };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

// Messaggi di una conversazione, più vecchi prima, con il mittente già
// risolto (vista public_profiles).
export async function fetchMessages(conversationId) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) return { error: error.message };
    if (!data) return { messages: [] };

    const profilesMap = await fetchProfilesMap(data.map((m) => m.sender_id));
    const messages = data.map((row) => ({
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      author: profilesMap.get(row.sender_id) ?? { id: row.sender_id, name: 'Utente', avatar: '' },
      testo: row.testo,
      data: row.created_at,
    }));
    return { messages };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

export async function sendMessage(conversationId, testo) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { error: 'Devi essere loggato.' };
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ conversation_id: conversationId, sender_id: auth.user.id, testo })
      .select()
      .single();
    if (error) return { error: translateInteractionError(error) };
    return { id: data.id, createdAt: data.created_at };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

// Segna la conversazione come letta fino ad ora, per il badge "non letti"
// (RPC lato server: aggiorna solo la propria riga e solo se si è davvero
// partecipanti, vedi mark_conversation_read).
export async function markConversationRead(conversationId) {
  try {
    const { error } = await supabase.rpc('mark_conversation_read', { p_conv: conversationId });
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

// Non letti per conversazione (mappa conversationId -> numero), per i badge.
export async function getUnreadCounts() {
  try {
    const { data, error } = await supabase.rpc('get_unread_counts');
    if (error || !data) return new Map();
    return new Map(data.map((row) => [row.conversation_id, row.non_letti]));
  } catch {
    return new Map();
  }
}

// last_read_at dell'altro partecipante di una conversazione diretta (per
// "Visualizzato"/"Inviato" sotto il mio ultimo messaggio): la RLS
// (chat_participants_select_participant) lascia leggere la riga solo a chi
// partecipa già alla stessa conversazione.
export async function getOtherParticipantLastRead(conversationId, myId) {
  try {
    const { data, error } = await supabase
      .from('chat_participants')
      .select('user_id, last_read_at')
      .eq('conversation_id', conversationId)
      .neq('user_id', myId)
      .maybeSingle();
    if (error || !data) return null;
    return data.last_read_at;
  } catch {
    return null;
  }
}

// Canale realtime sugli aggiornamenti di chat_participants per la
// conversazione aperta: l'altra persona che apre la chat (mark_conversation_read)
// aggiorna la propria riga, qui basta ricontrollare il suo last_read_at.
export function subscribeToParticipantUpdates(conversationId, onUpdate) {
  return supabase
    .channel(`chat-participants-${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'chat_participants', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onUpdate(payload.new)
    )
    .subscribe();
}

// Un canale per chat aperta: notifica ogni nuovo messaggio di quella
// conversazione (mia o dell'altro), e onReconnect se la connessione realtime
// cade e si ristabilisce (per ricaricare i messaggi dal DB e non perderne).
// Va rimosso con supabase.removeChannel alla chiusura/cambio chat, altrimenti
// resta appeso.
export function subscribeToConversationMessages(conversationId, onInsert, onReconnect) {
  let everSubscribed = false;
  return supabase
    .channel(`chat-messages-${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe((status) => {
      if (status !== 'SUBSCRIBED') return;
      if (everSubscribed) onReconnect?.();
      everSubscribed = true;
    });
}

// Un canale globale senza filtro (RLS limita già ai messaggi delle proprie
// conversazioni) per aggiornare i badge "non letti" anche a chat chiusa.
export function subscribeToOwnMessages(onInsert) {
  return supabase
    .channel('chat-messages-own')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => onInsert(payload.new))
    .subscribe();
}

// Mappa amico -> conversazione diretta già esistente (non ne crea di nuove:
// serve solo ad abbinare i conteggi di getUnreadCounts, per conversation_id,
// alla riga giusta nella lista amici, che è per friendId).
export async function getDirectConversationsMap() {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return new Map();
    const myId = auth.user.id;
    const { data, error } = await supabase.from('chat_participants').select('conversation_id, user_id');
    if (error || !data) return new Map();
    const myConvIds = new Set(data.filter((r) => r.user_id === myId).map((r) => r.conversation_id));
    const map = new Map();
    for (const row of data) {
      if (row.user_id !== myId && myConvIds.has(row.conversation_id)) map.set(row.user_id, row.conversation_id);
    }
    return map;
  } catch {
    return new Map();
  }
}
