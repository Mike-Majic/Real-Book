import { supabase } from './supabaseClient';

// Notifiche reali (tabella notifications, popolata da trigger lato DB su
// nuovo match/super like): qui solo lettura, marcatura come lette e canale
// realtime — la RLS limita già tutto alle proprie notifiche.
function mapNotification(row) {
  return {
    id: row.id,
    tipo: row.tipo,
    letta: row.letta,
    createdAt: row.created_at,
    actorId: row.actor_id,
    actor: { id: row.actor_id, name: row.actor_nickname || 'Utente', avatar: row.actor_avatar_url || '' },
  };
}

export async function getMyNotifications(limit = 30) {
  try {
    const { data, error } = await supabase.rpc('get_my_notifications', { p_limit: limit });
    if (error) return { error: error.message };
    return { notifications: (data ?? []).map(mapNotification) };
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

export async function markNotificationsRead() {
  try {
    const { error } = await supabase.rpc('mark_notifications_read');
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err?.message ?? 'Errore di rete.' };
  }
}

// Canale realtime per le proprie notifiche (match/super like): filtrato sul
// proprio id, così l'app lo sa nel momento stesso in cui arrivano, senza
// dover riaprire il pannello per scoprirle.
export function subscribeToOwnNotifications(userId, onInsert) {
  return supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();
}
