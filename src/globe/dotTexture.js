import * as THREE from 'three';

// Sprite circolare sfumata riusata per tutti i punti (continenti + nodi della rete):
// il colore viene applicato via material.color, qui serve solo la forma/il glow.
let cached;

export function getDotTexture() {
  if (cached) return cached;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  cached = new THREE.CanvasTexture(canvas);
  return cached;
}
