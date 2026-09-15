import * as THREE from 'three';

// Test "punto dentro triangolo sferico": vero se p sta dalla stessa parte di
// ciascun lato (a,b) (b,c) (c,a) rispetto al centroide, usando il segno del
// prodotto vettoriale dei due vertici del lato.
function sameSide(normal, p, reference) {
  return normal.dot(p) * normal.dot(reference) >= 0;
}

export function pointInSphericalTriangle(p, a, b, c) {
  const centroid = new THREE.Vector3().add(a).add(b).add(c);
  const nab = new THREE.Vector3().crossVectors(a, b);
  const nbc = new THREE.Vector3().crossVectors(b, c);
  const nca = new THREE.Vector3().crossVectors(c, a);
  return sameSide(nab, p, centroid) && sameSide(nbc, p, centroid) && sameSide(nca, p, centroid);
}

export function pointInAnyTriangle(p, triangles) {
  return triangles.some((t) => pointInSphericalTriangle(p, t.a, t.b, t.c));
}
