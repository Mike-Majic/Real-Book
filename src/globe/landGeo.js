// Continenti "veri" (contorni reali, non puntini): dati presi da world-atlas
// (Natural Earth, risoluzione 110m) e convertiti in GeoJSON con
// scripts/build-land-geojson.mjs, salvati come asset statico in
// public/geo/land-110m.geojson.json — nessuna richiesta di rete a runtime,
// stesso principio delle texture già usate dal globo.
let cachedPromise;

export function loadLandGeo() {
  if (cachedPromise) return cachedPromise;

  cachedPromise = fetch(`${import.meta.env.BASE_URL}geo/land-110m.geojson.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`richiesta fallita (${res.status})`);
      return res.json();
    })
    .then((geojson) => geojson.features ?? []);

  return cachedPromise;
}
