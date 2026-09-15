// Genera un breve motivetto originale con l'API Web Audio nativa del
// browser: nessun file audio da scaricare/ospitare, zero problemi di diritti
// (non sono canzoni vere, solo sequenze di note sintetizzate) e resta
// leggerissimo in termini di peso del bundle.
// notes: array di [frequenzaHz, durataMs]; frequenza 0 = pausa.
export function playMelody(notes) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  let t = ctx.currentTime;
  notes.forEach(([freq, duration]) => {
    if (freq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration / 1000);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + duration / 1000);
    }
    t += duration / 1000;
  });
  const totalMs = notes.reduce((sum, [, d]) => sum + d, 0);
  setTimeout(() => ctx.close(), totalMs + 150);
}

// Note musicali usate per comporre i motivetti (ottava 4-5).
export const NOTE = {
  C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392.0, A4: 440.0, B4: 493.9,
  C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784.0,
};
