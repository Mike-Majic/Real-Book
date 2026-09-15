// Profili finti "di scala", solo per testare come si comporta il globo (e il
// clustering) con molti più utenti dei 20 profili curati a mano in
// mockUsers.js. RICHIESTO ESPLICITAMENTE PER UN TEST — vanno tolti a fine
// progetto: basta togliere l'import/uso di FAKE_PROFILES in App.jsx, questo
// file può restare o essere cancellato senza toccare altro.
//
// Nota tecnica: non sono 3 miliardi (impossibile da generare/tenere in
// memoria in un'app senza backend, vedi conversazione) ma un campione
// abbastanza grande da mostrare cosa succederebbe senza clustering: con
// migliaia di marker singoli sullo stesso continente il globo diventerebbe
// illeggibile, esattamente il problema di cui abbiamo parlato.
const CITIES = [
  ['Roma', 41.9028, 12.4964], ['Milano', 45.4642, 9.19], ['Napoli', 40.8518, 14.2681],
  ['Torino', 45.0703, 7.6869], ['Palermo', 38.1157, 13.3615], ['Genova', 44.4056, 8.9463],
  ['Bologna', 44.4949, 11.3426], ['Firenze', 43.7696, 11.2558], ['Bari', 41.1177, 16.8719],
  ['Catania', 37.5079, 15.083], ['Venezia', 45.4408, 12.3155], ['Verona', 45.4384, 10.9916],
  ['Messina', 38.1938, 15.5540], ['Padova', 45.4064, 11.8768], ['Trieste', 45.6495, 13.7768],
  ['Taranto', 40.4764, 17.2408], ['Brescia', 45.5416, 10.2118], ['Parma', 44.8015, 10.3279],
  ['Modena', 44.6471, 10.9252], ['Reggio Calabria', 38.1113, 15.6619], ['Perugia', 43.1122, 12.3888],
  ['Ravenna', 44.4184, 12.2035], ['Livorno', 43.5485, 10.3106], ['Cagliari', 39.2238, 9.1217],
  ['Foggia', 41.4622, 15.5446], ['Rimini', 44.0678, 12.5695], ['Salerno', 40.6824, 14.7681],
  ['Ferrara', 44.8381, 11.6198], ['Sassari', 40.7259, 8.5590], ['Latina', 41.4676, 12.9037],
  ['Giugliano', 40.9280, 14.1930], ['Monza', 45.5845, 9.2744], ['Siracusa', 37.0755, 15.2866],
  ['Pescara', 42.4643, 14.2142], ['Bergamo', 45.6983, 9.6773], ['Forlì', 44.2226, 12.0407],
  ['Trento', 46.0679, 11.1211], ['Vicenza', 45.5455, 11.5354], ['Terni', 42.5636, 12.6427],
  ['Bolzano', 46.4983, 11.3548], ['Novara', 45.4469, 8.6220],
];

const FIRST_NAMES = ['Giulia', 'Marco', 'Sara', 'Luca', 'Elena', 'Davide', 'Alice', 'Simone', 'Chiara', 'Andrea', 'Martina', 'Riccardo', 'Sofia', 'Paolo', 'Federica', 'Matteo', 'Valentina', 'Giorgio', 'Ilaria', 'Stefano'];

function makeProfile(i, city, lat, lng) {
  // Piccolo scarto casuale attorno al centro città, per non impilare tutti
  // i punti esattamente sullo stesso pixel.
  const jitter = () => (Math.random() - 0.5) * 0.35;
  return {
    id: `fake-${i}`,
    name: FIRST_NAMES[i % FIRST_NAMES.length],
    age: 18 + (i % 43),
    gender: i % 2 === 0 ? 'donna' : 'uomo',
    city,
    country: 'Italia',
    lat: lat + jitter(),
    lng: lng + jitter(),
    avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
    worlds: ['incontri'],
    bio: '',
    isFake: true,
  };
}

function generate() {
  const profiles = [];
  let i = 0;
  const perCity = 45; // ~40 città × 45 = circa 1800 profili
  for (const [city, lat, lng] of CITIES) {
    for (let k = 0; k < perCity; k++) {
      profiles.push(makeProfile(i, city, lat, lng));
      i++;
    }
  }
  return profiles;
}

export const FAKE_PROFILES = generate();
