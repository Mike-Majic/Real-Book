// Anagrafica delle città usate nei dati finti: coordinate per far "volare" il
// mappamondo quando si cerca una città, più regione/continente per i filtri.
export const CITIES = {
  Roma: { lat: 41.9028, lng: 12.4964, region: 'Lazio', continent: 'Europa' },
  Ardea: { lat: 41.615, lng: 12.5555, region: 'Lazio', continent: 'Europa' },
  Milano: { lat: 45.4642, lng: 9.19, region: 'Lombardia', continent: 'Europa' },
  Napoli: { lat: 40.8518, lng: 14.2681, region: 'Campania', continent: 'Europa' },
  Torino: { lat: 45.0703, lng: 7.6869, region: 'Piemonte', continent: 'Europa' },
  Bologna: { lat: 44.4949, lng: 11.3426, region: 'Emilia-Romagna', continent: 'Europa' },
  Firenze: { lat: 43.7696, lng: 11.2558, region: 'Toscana', continent: 'Europa' },
  Bari: { lat: 41.1177, lng: 16.8719, region: 'Puglia', continent: 'Europa' },
  Palermo: { lat: 38.1157, lng: 13.3615, region: 'Sicilia', continent: 'Europa' },
  Genova: { lat: 44.4056, lng: 8.9463, region: 'Liguria', continent: 'Europa' },
  Verona: { lat: 45.4384, lng: 10.9916, region: 'Veneto', continent: 'Europa' },
  Londra: { lat: 51.5072, lng: -0.1276, region: 'Regno Unito', continent: 'Europa' },
  Berlino: { lat: 52.52, lng: 13.405, region: 'Germania', continent: 'Europa' },
  Parigi: { lat: 48.8566, lng: 2.3522, region: 'Francia', continent: 'Europa' },
  Madrid: { lat: 40.4168, lng: -3.7038, region: 'Spagna', continent: 'Europa' },
  Lisbona: { lat: 38.7223, lng: -9.1393, region: 'Portogallo', continent: 'Europa' },
  'New York': { lat: 40.7128, lng: -74.006, region: 'Stati Uniti', continent: 'Nord America' },
  Tokyo: { lat: 35.6762, lng: 139.6503, region: 'Giappone', continent: 'Asia' },
  Dubai: { lat: 25.2048, lng: 55.2708, region: 'Emirati Arabi Uniti', continent: 'Asia' },
};

export const CONTINENTS = ['Europa', 'Nord America', 'Sud America', 'Asia', 'Africa', 'Oceania'];

export const REGIONS = Object.values(CITIES)
  .map((c) => c.region)
  .filter((r, i, arr) => arr.indexOf(r) === i)
  .sort((a, b) => a.localeCompare(b));

export function getCityInfo(cityName) {
  return CITIES[cityName] ?? null;
}

// Trova la prima città nota il cui nome combacia (anche parzialmente) con la query digitata.
export function findCityMatch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = Object.keys(CITIES).find((name) => name.toLowerCase() === q);
  if (exact) return { name: exact, ...CITIES[exact] };
  const partial = Object.keys(CITIES).find((name) => name.toLowerCase().startsWith(q));
  return partial ? { name: partial, ...CITIES[partial] } : null;
}
