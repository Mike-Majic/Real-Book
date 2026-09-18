import { supabase } from './supabaseClient';
import { fetchProfilesMap } from './posts';

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
    if (error) return { error: error.message };
    return { id: data.id, createdAt: data.created_at };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

// Segna la conversazione come letta fino ad ora (per un futuro badge "non
// letti" — qui basta aggiornare la propria riga in chat_participants).
export async function markConversationRead(conversationId) {
  try {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return {};
    await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', auth.user.id);
    return {};
  } catch {
    return {};
  }
}
