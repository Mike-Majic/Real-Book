import { supabase } from './supabaseClient';

// Coda di moderazione (tabella public.reports): chi segnala vede solo le
// proprie segnalazioni, owner/moderatori le vedono e gestiscono tutte — lo
// decide la RLS, qui non serve nessun controllo di ruolo lato client.
function mapReport(row) {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterNickname: row.reporter?.nickname ?? null,
    targetType: row.target_type,
    targetId: row.target_id,
    motivo: row.motivo,
    dettagli: row.dettagli,
    stato: row.stato,
    gestitoDa: row.gestito_da,
    gestitoDaNickname: row.gestito_da_profile?.nickname ?? null,
    data: row.created_at,
    risoltoAt: row.risolto_at,
  };
}

const SELECT_WITH_NICKNAMES =
  '*, reporter:reports_reporter_id_fkey(nickname), gestito_da_profile:reports_gestito_da_fkey(nickname)';

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select(SELECT_WITH_NICKNAMES)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data.map(mapReport);
}

// Crea una segnalazione: qualunque utente autenticato può segnalare un
// contenuto o un profilo (post, commento, profilo, gruppo, live, evento).
export async function createReport({ targetType, targetId, motivo, dettagli }) {
  const { error } = await supabase
    .from('reports')
    .insert({ target_type: targetType, target_id: targetId, motivo, dettagli: dettagli ?? null });
  if (error) return { error: error.message };
  return {};
}

// Cambia lo stato di una segnalazione (presa in carico o chiusura). Solo
// owner/moderatori possono farlo con successo: lo garantisce la RLS
// "reports_update_staff", qui si registra anche chi se ne è occupato.
export async function updateReportStatus(reportId, stato) {
  const patch = { stato, gestito_da: (await supabase.auth.getUser()).data.user?.id ?? null };
  if (stato === 'chiuso') patch.risolto_at = new Date().toISOString();
  const { error } = await supabase.from('reports').update(patch).eq('id', reportId);
  if (error) return { error: error.message };
  return {};
}
