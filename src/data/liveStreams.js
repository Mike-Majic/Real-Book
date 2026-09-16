import { usersForWorld } from './mockUsers';

// Chi è "in diretta" ora nel mondo Incontri. Senza backend non esiste uno
// streaming vero: si prende un sottoinsieme fisso di utenti del mondo con
// un numero di spettatori deterministico (seed sull'id, non un numero
// casuale ad ogni render), così la lista non "balla" ricaricando la pagina.
function seededViews(id) {
  return ((id * 137) % 1400) + 40;
}

export function getLiveNowUsers() {
  return usersForWorld('incontri')
    .slice(0, 8)
    .map((u) => ({ ...u, viewCount: seededViews(u.id) }));
}
