// Il DB rifiuta con lo stesso "row-level security policy" generico di
// Postgres qualunque interazione non permessa: un blocco reciproco, fasce
// d'età diverse (maggiorenni/minorenni), non essere più partecipante/membro
// di qualcosa, ecc. — mai abbastanza specifico da spiegare la vera causa,
// qui diventa sempre lo stesso messaggio comprensibile.
export function translateInteractionError(error) {
  if (error?.code === '42501' || /row-level security/i.test(error?.message ?? '')) {
    return 'Non puoi interagire con questo utente o contenuto.';
  }
  return error?.message ?? 'Errore di rete.';
}
