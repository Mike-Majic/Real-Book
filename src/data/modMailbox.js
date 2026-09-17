import { supabase } from './supabaseClient';

// Casella postale condivisa tra owner e moderatori (tabella public.mod_mailbox
// su Supabase): chi scrive può solo inserire un messaggio a proprio nome
// (RLS), leggerli e segnarli come letti è riservato a owner/moderatori —
// vedi le policy applicate al progetto.
function mapMessage(row) {
  return {
    id: row.id,
    fromAccountId: row.from_account_id,
    fromNickname: row.from_nickname,
    subject: row.subject,
    body: row.body,
    data: row.created_at,
    letto: row.letto,
  };
}

export async function getMailboxMessages() {
  const { data, error } = await supabase.from('mod_mailbox').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data.map(mapMessage);
}

export async function sendMailboxMessage({ fromAccountId, fromNickname, subject, body }) {
  const { data, error } = await supabase
    .from('mod_mailbox')
    .insert({ from_account_id: fromAccountId, from_nickname: fromNickname, subject, body })
    .select()
    .single();
  if (error) return { error: error.message };
  return { message: mapMessage(data) };
}

export async function markMessageRead(messageId) {
  await supabase.from('mod_mailbox').update({ letto: true }).eq('id', messageId);
}

export async function unreadMailboxCount() {
  const { count, error } = await supabase
    .from('mod_mailbox')
    .select('*', { count: 'exact', head: true })
    .eq('letto', false);
  if (error) return 0;
  return count ?? 0;
}
