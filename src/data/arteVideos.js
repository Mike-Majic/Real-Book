// Video "vetrina" di partenza della categoria Video (mondo Arte): card a
// gradiente al posto di file video esterni, stesso principio di
// artePhotos.js. I video veri li caricano gli utenti (vedi VideoColumn.jsx)
// come file locali (object URL, validi solo per la sessione corrente:
// senza backend non c'è dove salvare davvero i byte del video).
export const SEED_VIDEOS = [
  { id: 'seed-video-1', gradient: 'linear-gradient(160deg,#8b5cf6,#1e1b4b)', title: 'Backstage del concerto', creatorName: 'Nina', duration: '0:42' },
  { id: 'seed-video-2', gradient: 'linear-gradient(160deg,#f59e0b,#7c2d12)', title: 'Timelapse tramonto', creatorName: 'Davide', duration: '0:18' },
  { id: 'seed-video-3', gradient: 'linear-gradient(160deg,#0ea5e9,#082f49)', title: 'Prove di danza', creatorName: 'Elisa', duration: '1:05' },
  { id: 'seed-video-4', gradient: 'linear-gradient(160deg,#ec4899,#4a044e)', title: 'Reel del murale', creatorName: 'Kass', duration: '0:33' },
];
