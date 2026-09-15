import * as THREE from 'three';
import { getDotTexture } from './dotTexture';
import { pointInAnyTriangle } from './sphereGeometry';

const GLOBE_RADIUS = 100; // stesso valore usato internamente da three-globe

// Stessa formula di conversione lat/lng -> coordinate 3D usata da three-globe,
// così i punti restano allineati alla sfera del globo e ai marker degli utenti.
function polarToVector(lat, lng, radius) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(radius * sinPhi * Math.cos(theta), radius * Math.cos(phi), radius * sinPhi * Math.sin(theta));
}

// excludeTriangles: punti dentro ai triangoli delle categorie (vedi categoryShell.js)
// vengono saltati, per lasciare l'interno del triangolo pulito e la scritta leggibile.
export function buildLandDots(landPoints, excludeTriangles = []) {
  const unit = new THREE.Vector3();
  const kept = excludeTriangles.length === 0
    ? landPoints
    : landPoints.filter(([lat, lng]) => {
        unit.copy(polarToVector(lat, lng, 1));
        return !pointInAnyTriangle(unit, excludeTriangles);
      });

  const positions = new Float32Array(kept.length * 3);
  kept.forEach(([lat, lng], i) => {
    const v = polarToVector(lat, lng, GLOBE_RADIUS * 1.02);
    positions[i * 3] = v.x;
    positions[i * 3 + 1] = v.y;
    positions[i * 3 + 2] = v.z;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 1.5,
    map: getDotTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

// Posizioni dei nodi del guscio, escludendo quelli che cadono dentro a un
// triangolo di categoria (altrimenti capita che un nodo luminoso finisca
// esattamente sopra l'etichetta, rendendola meno leggibile).
export function buildShellNodeGeometry(icoGeometry, excludeTriangles = []) {
  const pos = icoGeometry.getAttribute('position');
  const v = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const kept = [];
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    dir.copy(v).normalize();
    if (excludeTriangles.length > 0 && pointInAnyTriangle(dir, excludeTriangles)) continue;
    kept.push(v.x, v.y, v.z);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(kept, 3));
  return geometry;
}

// Il guscio esterno "a rete" (triangoli + nodi luminosi) che circonda il globo,
// come nelle immagini di riferimento.
export function buildNetworkShell(radius = 128, detail = 2) {
  const icoGeometry = new THREE.IcosahedronGeometry(radius, detail);
  const edgesGeometry = new THREE.EdgesGeometry(icoGeometry);

  const lineMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.32 });
  const lines = new THREE.LineSegments(edgesGeometry, lineMaterial);

  const nodeMaterial = new THREE.PointsMaterial({
    size: 3,
    map: getDotTexture(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const nodes = new THREE.Points(buildShellNodeGeometry(icoGeometry), nodeMaterial);

  return { lines, nodes, lineMaterial, nodeMaterial, icoGeometry, edgesGeometry };
}
