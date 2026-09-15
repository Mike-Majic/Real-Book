import * as THREE from 'three';

// Stessa formula di conversione lat/lng -> vettore usata da three-globe (vedi networkOverlay.js).
function polarToVector(lat, lng, radius = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((90 - lng) * Math.PI) / 180;
  const sinPhi = Math.sin(phi);
  return new THREE.Vector3(radius * sinPhi * Math.cos(theta), radius * Math.cos(phi), radius * sinPhi * Math.sin(theta));
}

// Etichetta come sprite: tenendo il testo su un piano che guarda sempre la camera,
// resta dritto e leggibile a prescindere da come ruota il mondo.
function makeLabelSprite(text, color) {
  const scale = 4;
  const canvas = document.createElement('canvas');
  canvas.width = 220 * scale;
  canvas.height = 56 * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.font = '700 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, 110, 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(26, 6.6, 1);
  return { sprite, material, texture };
}

// Incastona una categoria per ogni triangolo del guscio (icosaedro a bassa risoluzione,
// 20 facce grandi e ben visibili): la riempie di colore semi-trasparente e ci mette sopra
// l'etichetta. Ogni categoria viene agganciata al triangolo più vicino alla sua posizione
// lat/lng "anchor", così la stessa coordinata può essere riusata per centrare la camera.
export function buildCategoryShell(categories, { radius = 122, color = '#8b5cf6' } = {}) {
  const baseGeo = new THREE.IcosahedronGeometry(radius, 0).toNonIndexed();
  const pos = baseGeo.getAttribute('position');
  const faceCount = pos.count / 3;

  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const centroid = new THREE.Vector3();

  const group = new THREE.Group();
  const faceMeshes = [];
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

    const { sprite, material: labelMat, texture } = makeLabelSprite(cat.label, color);
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

  return { group, faceMeshes, setActive, dispose };
}
