// Utenti finti per popolare il mappamondo. Nessuna chiamata a backend:
// servono solo a mostrare come funzionerà l'interazione.
export const MOCK_USERS = [
  { id: 1, name: 'Giulia', age: 27, gender: 'donna', city: 'Roma', country: 'Italia', lat: 41.9028, lng: 12.4964, avatar: 'https://i.pravatar.cc/150?img=47', worlds: ['social', 'incontri', 'arte'], bio: 'Fotografa di strada, amo i tramonti su Roma.', artType: 'Arte visiva' },
  { id: 2, name: 'Marco', age: 31, gender: 'uomo', city: 'Ardea', country: 'Italia', lat: 41.6083, lng: 12.5461, avatar: 'https://i.pravatar.cc/150?img=12', worlds: ['social', 'lavoro'], bio: 'Tecnico di rete in trasferta, sempre connesso.', jobType: 'Elettronica', jobTitle: 'Tecnico FTTH', cvFile: 'CV_Marco_R.pdf' },
  { id: 3, name: 'Sara', age: 24, gender: 'donna', city: 'Milano', country: 'Italia', lat: 45.4642, lng: 9.19, avatar: 'https://i.pravatar.cc/150?img=32', worlds: ['incontri', 'arte'], bio: 'Studio pianoforte al conservatorio.', artType: 'Musica' },
  { id: 4, name: 'Luca', age: 29, gender: 'uomo', city: 'Napoli', country: 'Italia', lat: 40.8518, lng: 14.2681, avatar: 'https://i.pravatar.cc/150?img=15', worlds: ['social', 'incontri'], bio: 'Pizzaiolo la sera, surfista il weekend.' },
  { id: 5, name: 'Elena', age: 35, gender: 'donna', city: 'Torino', country: 'Italia', lat: 45.0703, lng: 7.6869, avatar: 'https://i.pravatar.cc/150?img=44', worlds: ['lavoro'], jobType: 'Industriale', jobTitle: 'Responsabile produzione', cvFile: 'CV_Elena_T.pdf' },
  { id: 6, name: 'Davide', age: 26, gender: 'uomo', city: 'Bologna', country: 'Italia', lat: 44.4949, lng: 11.3426, avatar: 'https://i.pravatar.cc/150?img=51', worlds: ['social', 'arte'], bio: 'Regista amatoriale, cerco attori per cortometraggi.', artType: 'Cinema' },
  { id: 7, name: 'Alice', age: 22, gender: 'donna', city: 'Firenze', country: 'Italia', lat: 43.7696, lng: 11.2558, avatar: 'https://i.pravatar.cc/150?img=25', worlds: ['incontri'], bio: 'Storica dell’arte, guida turistica part-time.' },
  { id: 8, name: 'Simone', age: 33, gender: 'uomo', city: 'Bari', country: 'Italia', lat: 41.1177, lng: 16.8719, avatar: 'https://i.pravatar.cc/150?img=59', worlds: ['lavoro'], jobType: 'Meccanica', jobTitle: 'Meccatronico', cvFile: 'CV_Simone_B.pdf' },
  { id: 9, name: 'Chiara', age: 28, gender: 'donna', city: 'Londra', country: 'Regno Unito', lat: 51.5072, lng: -0.1276, avatar: 'https://i.pravatar.cc/150?img=48', worlds: ['social', 'incontri'], bio: 'Italiana a Londra, amo il teatro.' },
  { id: 10, name: 'Thomas', age: 30, gender: 'uomo', city: 'Berlino', country: 'Germania', lat: 52.52, lng: 13.405, avatar: 'https://i.pravatar.cc/150?img=13', worlds: ['arte'], artType: 'Musica elettronica' },
  { id: 11, name: 'Manon', age: 25, gender: 'donna', city: 'Parigi', country: 'Francia', lat: 48.8566, lng: 2.3522, avatar: 'https://i.pravatar.cc/150?img=29', worlds: ['social', 'arte'], bio: 'Danzatrice contemporanea.', artType: 'Teatro / Danza' },
  { id: 12, name: 'Diego', age: 34, gender: 'uomo', city: 'Madrid', country: 'Spagna', lat: 40.4168, lng: -3.7038, avatar: 'https://i.pravatar.cc/150?img=17', worlds: ['lavoro'], jobType: 'Istruttore', jobTitle: 'Istruttore fitness', cvFile: 'CV_Diego_M.pdf' },
  { id: 13, name: 'Anna', age: 27, gender: 'donna', city: 'New York', country: 'USA', lat: 40.7128, lng: -74.006, avatar: 'https://i.pravatar.cc/150?img=39', worlds: ['social', 'incontri'], bio: 'Product designer, weekend in giro per gallerie.' },
  { id: 14, name: 'Kenji', age: 29, gender: 'uomo', city: 'Tokyo', country: 'Giappone', lat: 35.6762, lng: 139.6503, avatar: 'https://i.pravatar.cc/150?img=52', worlds: ['arte'], artType: 'Arte digitale' },
  { id: 15, name: 'Fatima', age: 26, gender: 'donna', city: 'Dubai', country: 'EAU', lat: 25.2048, lng: 55.2708, avatar: 'https://i.pravatar.cc/150?img=36', worlds: ['lavoro'], jobType: 'Informatica / IT', jobTitle: 'Sviluppatrice backend', cvFile: 'CV_Fatima_D.pdf' },
  { id: 16, name: 'Paolo', age: 40, gender: 'uomo', city: 'Palermo', country: 'Italia', lat: 38.1157, lng: 13.3615, avatar: 'https://i.pravatar.cc/150?img=60', worlds: ['social', 'lavoro'], bio: 'Skipper e amante del mare.', jobType: 'Altro', jobTitle: 'Skipper', cvFile: 'CV_Paolo_P.pdf' },
  { id: 17, name: 'Martina', age: 23, gender: 'donna', city: 'Genova', country: 'Italia', lat: 44.4056, lng: 8.9463, avatar: 'https://i.pravatar.cc/150?img=41', worlds: ['incontri', 'social'], bio: 'Amo il mare e i concerti indie.' },
  { id: 18, name: 'Riccardo', age: 31, gender: 'uomo', city: 'Verona', country: 'Italia', lat: 45.4384, lng: 10.9916, avatar: 'https://i.pravatar.cc/150?img=8', worlds: ['lavoro'], jobType: 'Edilizia', jobTitle: 'Capocantiere', cvFile: 'CV_Riccardo_V.pdf' },
  { id: 19, name: 'Sofia', age: 24, gender: 'donna', city: 'Lisbona', country: 'Portogallo', lat: 38.7223, lng: -9.1393, avatar: 'https://i.pravatar.cc/150?img=45', worlds: ['arte', 'incontri'], bio: 'Cantautrice, cerco musicisti per una jam.', artType: 'Musica' },
  { id: 20, name: 'Andrea', age: 37, gender: 'uomo', city: 'Ardea', country: 'Italia', lat: 41.615, lng: 12.5555, avatar: 'https://i.pravatar.cc/150?img=6', worlds: ['social', 'lavoro'], bio: 'Elettricista, live streamer nel tempo libero.', jobType: 'Elettronica', jobTitle: 'Elettricista industriale', cvFile: 'CV_Andrea_A.pdf' },
];

export function usersForWorld(worldId) {
  return MOCK_USERS.filter((u) => u.worlds.includes(worldId));
}
