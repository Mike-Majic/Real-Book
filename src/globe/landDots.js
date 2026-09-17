// Campiona la maschera terra/acqua (bianco e nero) e restituisce le coordinate
// lat/lng dei punti che cadono sulla terraferma, per disegnare i continenti a puntini.
let cachedPromise;

export function loadLandDots() {
  if (cachedPromise) return cachedPromise;

  cachedPromise = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // La texture è equirettangolare: ridisegnandola a 360x180 ogni pixel
      // corrisponde esattamente a un grado di lat/lng, niente conversioni.
      const w = 360;
      const h = 180;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);

      const points = [];
      for (let py = 0; py < h; py += 1) {
        for (let px = 0; px < w; px += 1) {
          const brightness = data[(py * w + px) * 4];
          if (brightness < 100) {
            points.push([90 - py, px - 180]);
          }
        }
      }
      resolve(points);
    };
    img.onerror = reject;
    // BASE_URL tiene conto del sottopercorso di pubblicazione (es. /Versemove/ su GitHub Pages).
    img.src = `${import.meta.env.BASE_URL}textures/earth-water.png`;
  });

  return cachedPromise;
}
