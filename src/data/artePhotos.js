// Foto "vetrina" di partenza della Fotografia stile Pinterest (mondo Arte):
// card a gradiente invece di immagini esterne, per non dipendere da CDN di
// terzi nei contenuti dimostrativi. Le foto vere le caricano gli utenti
// (vedi FotografiaColumn.jsx) e restano dataURL locali, mai link esterni.
export const SEED_PHOTOS = [
  { id: 'seed-foto-1', gradient: 'linear-gradient(160deg,#f59e0b,#7c2d12)', caption: 'Tramonto sul porto', creatorName: 'Vale', height: 260 },
  { id: 'seed-foto-2', gradient: 'linear-gradient(160deg,#8b5cf6,#1e1b4b)', caption: 'Luci di città', creatorName: 'Marco', height: 340 },
  { id: 'seed-foto-3', gradient: 'linear-gradient(160deg,#22c55e,#052e16)', caption: 'Sentiero nel bosco', creatorName: 'Giulia', height: 220 },
  { id: 'seed-foto-4', gradient: 'linear-gradient(160deg,#0ea5e9,#082f49)', caption: 'Onde al largo', creatorName: 'Luca', height: 300 },
  { id: 'seed-foto-5', gradient: 'linear-gradient(160deg,#ec4899,#4a044e)', caption: 'Fiori di piazza', creatorName: 'Sara', height: 240 },
  { id: 'seed-foto-6', gradient: 'linear-gradient(160deg,#f97316,#431407)', caption: 'Mercato del sabato', creatorName: 'Omar', height: 280 },
];
