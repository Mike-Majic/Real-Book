import { supabase } from './supabaseClient';

// Blocco/sblocco contatti (Impostazioni privacy). contact_id è testo: oggi i
// contatti mostrati nell'app sono ancora gli utenti finti di mockUsers.js
// (id numerici), non ancora relazioni reali fra account — vedi il commento
// sulla tabella blocked_contacts su Supabase. Funziona comunque anche con
// veri UUID quando gli amici diventeranno account reali.
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
    .insert({ blocker_id: auth.user.id, contact_id: String(contactId) });
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
    .eq('contact_id', String(contactId));
  if (error) return { error: error.message };
  return {};
}
