import * as THREE from 'three';

// Stessa formula di conversione lat/lng -> vettore usata da three-globe (vedi networkOverlay.js).
function polarToVector(lat, lng, radius = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(radius * sinPhi * Math.cos(theta), radius * Math.cos(phi), radius * sinPhi * Math.sin(theta));
}

// Inversa di polarToVector: dato un vettore unitario, la lat/lng corrispondente.
// Serve a far volare la camera esattamente sul centro del triangolo assegnato a
// una categoria, che in genere non coincide con la sua "anchor" originale (la
// categoria viene agganciata al triangolo più vicino, non esattamente a quel punto).
function vectorToPolar(v) {
  const n = v.clone().normalize();
  const phi = Math.acos(Math.max(-1, Math.min(1, n.y)));
  const theta = Math.atan2(n.z, n.x);
  return { lat: 90 - (phi * 180) / Math.PI, lng: 90 - (theta * 180) / Math.PI };
}

// Più categorie ci sono, più i triangoli devono essere piccoli per farcele stare
// tutte in modo leggibile: si passa a un icosaedro più suddiviso (più facce, più
// piccole) man mano che il numero di categorie cresce.
function pickDetailLevel(categoryCount) {
  if (categoryCount <= 6) return 0; // 20 facce
  if (categoryCount <= 20) return 1; // 80 facce
  return 2; // 320 facce
}

// Etichetta come sprite: tenendo il testo su un piano che guarda sempre la camera,
// resta dritto e leggibile a prescindere da come ruota il mondo. Uno sfondo scuro
// dietro al testo garantisce contrasto anche sopra ai puntini dei continenti.
function makeLabelSprite(text, spriteScale) {
  const canvasScale = 4;
  const canvas = document.createElement('canvas');
  canvas.width = 240 * canvasScale;
  canvas.height = 64 * canvasScale;
  const ctx = canvas.getContext('2d');
  ctx.scale(canvasScale, canvasScale);

  ctx.font = '800 32px system-ui, -apple-system, sans-serif';
  const metrics = ctx.measureText(text);
  const padX = 14;
  const padY = 8;
  const boxW = metrics.width + padX * 2;
  const boxH = 32 + padY * 2;
  const boxX = 120 - boxW / 2;
  const boxY = 32 - boxH / 2;
  const radius = 10;

  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + boxH, radius);
  ctx.arcTo(boxX + boxW, boxY + boxH, boxX, boxY + boxH, radius);
  ctx.arcTo(boxX, boxY + boxH, boxX, boxY, radius);
  ctx.arcTo(boxX, boxY, boxX + boxW, boxY, radius);
  ctx.closePath();
  ctx.fillStyle = 'rgba(6, 4, 12, 0.78)';
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 120, 33);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(spriteScale * aspect, spriteScale, 1);
  return { sprite, material, texture };
}

// Incastona una categoria per ogni triangolo del guscio: lo riempie di colore
// semi-trasparente e ci mette sopra l'etichetta. Ogni categoria viene agganciata
// al triangolo più vicino alla sua posizione lat/lng "anchor", così la stessa
// coordinata può essere riusata per centrare la camera (vedi App.jsx).
export function buildCategoryShell(categories, { radius = 122, color = '#8b5cf6' } = {}) {
  const detail = pickDetailLevel(categories.length);
  const baseGeo = new THREE.IcosahedronGeometry(radius, detail).toNonIndexed();
  const pos = baseGeo.getAttribute('position');
  const faceCount = pos.count / 3;

  // Le etichette si rimpiccioliscono quando i triangoli sono più piccoli (più categorie).
  const labelScale = detail === 0 ? 15 : detail === 1 ? 9 : 5.5;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  const group = new THREE.Group();
  const faceMeshes = [];
  const triangles = [];
  const positions = {};
  const disposables = [baseGeo];
  const usedFaces = new Set();

  categories.forEach((cat) => {
    const targetDir = polarToVector(cat.anchor.lat, cat.anchor.lng, 1);
    let bestFace = -1;
    let bestDot = -Infinity;
    for (let f = 0; f < faceCount; f++) {
      if (usedFaces.has(f)) continue;
      a.fromBufferAttribute(pos, f * 3);
      b.fromBufferAttribute(pos, f * 3 + 1);
      c.fromBufferAttribute(pos, f * 3 + 2);
      centroid.copy(a).add(b).add(c).divideScalar(3).normalize();
      const dot = centroid.dot(targetDir);
      if (dot > bestDot) {
        bestDot = dot;
        bestFace = f;
      }
    }
    usedFaces.add(bestFace);

    a.fromBufferAttribute(pos, bestFace * 3);
    b.fromBufferAttribute(pos, bestFace * 3 + 1);
    c.fromBufferAttribute(pos, bestFace * 3 + 2);
    centroid.copy(a).add(b).add(c).divideScalar(3);
    const normal = centroid.clone().normalize();

    triangles.push({
      id: cat.id,
      a: a.clone().normalize(),
      b: b.clone().normalize(),
      c: c.clone().normalize(),
    });
    positions[cat.id] = vectorToPolar(normal);

    const triGeo = new THREE.BufferGeometry();
    triGeo.setAttribute('position', new THREE.Float32BufferAttribute([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z], 3));
    triGeo.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(triGeo, material);
    mesh.userData.categoryId = cat.id;
    group.add(mesh);
    faceMeshes.push(mesh);
    disposables.push(triGeo, material);

    const { sprite, material: labelMat, texture } = makeLabelSprite(cat.label, labelScale);
    sprite.position.copy(normal).multiplyScalar(radius + 3);
    sprite.userData.categoryId = cat.id;
    group.add(sprite);
    disposables.push(labelMat, texture);
  });

  function setActive(activeId) {
    faceMeshes.forEach((mesh) => {
      mesh.material.opacity = mesh.userData.categoryId === activeId ? 0.45 : 0.2;
    });
  }

  function dispose() {
    disposables.forEach((d) => d.dispose && d.dispose());
  }

  return { group, faceMeshes, triangles, positions, setActive, dispose };
}
