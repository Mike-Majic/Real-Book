// Rigenera public/geo/land-110m.geojson.json dai dati di world-atlas.
// Uso: node scripts/build-land-geojson.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { feature } from 'topojson-client';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const topology = JSON.parse(readFileSync(join(root, 'node_modules/world-atlas/land-110m.json'), 'utf8'));
const geo = feature(topology, topology.objects.land);

mkdirSync(join(root, 'public/geo'), { recursive: true });
writeFileSync(join(root, 'public/geo/land-110m.geojson.json'), JSON.stringify(geo));
console.log(`Scritto public/geo/land-110m.geojson.json (${geo.features.length} feature)`);
