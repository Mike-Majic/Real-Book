import { supabase } from './supabaseClient';

// Blocco/sblocco contatti (Impostazioni privacy). contact_id è uuid, FK a
// auth.users(id): ora rappresenta davvero l'account bloccato (prima erano
// gli id finti di mockUsers.js, quando gli "amici" mostrati non erano
// ancora account reali).
export async function listBlockedContacts() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return [];
  const { data, error } = await supabase
    .from('blocked_contacts')
    .select('contact_id')
    .eq('blocker_id', auth.user.id);
  if (error) return [];
  return data.map((row) => row.contact_id);
}

export async function blockContact(contactId) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: 'Devi essere loggato.' };
  const { error } = await supabase
    .from('blocked_contacts')
    .insert({ blocker_id: auth.user.id, contact_id: contactId });
  if (error) return { error: error.message };
  return {};
}

export async function unblockContact(contactId) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return { error: 'Devi essere loggato.' };
  const { error } = await supabase
    .from('blocked_contacts')
    .delete()
    .eq('blocker_id', auth.user.id)
    .eq('contact_id', contactId);
  if (error) return { error: error.message };
  return {};
}
