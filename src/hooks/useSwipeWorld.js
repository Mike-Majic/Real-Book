import { useEffect, useRef, useState } from 'react';

// Gestisce il passaggio tra i "mondi" (0..count-1) tramite:
// - scroll orizzontale a due dita su trackpad (evento wheel con deltaX prevalente)
// - frecce sinistra/destra da tastiera, come alternativa accessibile
// - su touchscreen NON tramite gesti: le due dita sul globo servono solo a
//   zoomare/ruotarlo (OrbitControls), altrimenti lo stesso gesto verrebbe
//   letto sia come "cambia mondo" che come "zooma", un conflitto fastidioso.
//   Su mobile si cambia mondo toccando le icone in basso (rb-world-dots).
//
// disabled: quando true, ignora tutti questi gesti — serve per i minigiochi
// del mondo Bambini che usano le stesse frecce/tocchi per controllare il
// gioco (es. Snake), altrimenti ArrowLeft/ArrowRight cambierebbero mondo
// invece di muovere il personaggio.
const WORLD_INDEX_KEY = 'rb-world-index';

export function useSwipeWorld(count, initialIndex = 0, disabled = false) {
  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  // Ricorda il mondo corrente per la scheda: senza, ogni volta che <App/>
  // viene rimontato da zero (es. il redirect della mail di conferma torna
  // alla root del sito) si ripartiva sempre dal mondo di default (Social),
  // anche se si stava esplorando un altro mondo — sembrava un "teletrasporto"
  // a caso.
  const [index, setIndex] = useState(() => {
    try {
      const raw = sessionStorage.getItem(WORLD_INDEX_KEY);
      // getItem torna null quando la chiave non c'è ancora (prima visita
      // di questa scheda): Number(null) vale 0, un indice valido come un
      // altro, quindi senza questo controllo esplicito si finiva sempre nel
      // primo mondo (Bambini) invece che in quello di default (Social).
      if (raw === null) return initialIndex;
      const stored = Number(raw);
      return Number.isInteger(stored) && stored >= 0 && stored < count ? stored : initialIndex;
    } catch {
      return initialIndex;
    }
  });
  const containerRef = useRef(null);
  const cooldownRef = useRef(false);
  const touchStartRef = useRef(null);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const goTo = (next) => {
    const clamped = ((next % count) + count) % count;
    setIndex(clamped);
    try {
      sessionStorage.setItem(WORLD_INDEX_KEY, String(clamped));
    } catch {
      // Storage non disponibile (privacy mode, ecc.): pazienza, si perde solo il "ricordo" tra un remount e l'altro.
    }
  };

  const triggerCooldown = () => {
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 550);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;

    const onWheel = (e) => {
      if (disabledRef.current) return;
      // Interessano solo gli swipe orizzontali (due dita su trackpad).
      // Se il movimento verticale prevale, lasciamo l'evento allo zoom del globo.
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.3) return;
      if (Math.abs(e.deltaX) < 12) return;
      e.preventDefault();
      if (cooldownRef.current) return;
      goTo(index + (e.deltaX > 0 ? 1 : -1));
      triggerCooldown();
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        touchStartRef.current = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
      } else {
        touchStartRef.current = null;
      }
    };

    const onTouchMove = (e) => {
      if (disabledRef.current) return;
      if (e.touches.length !== 2 || !touchStartRef.current) return;
      const [a, b] = e.touches;
      const x = (a.clientX + b.clientX) / 2;
      const y = (a.clientY + b.clientY) / 2;
      const dx = x - touchStartRef.current.x;
      const dy = y - touchStartRef.current.y;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      if (cooldownRef.current) return;
      goTo(index + (dx < 0 ? 1 : -1));
      triggerCooldown();
      touchStartRef.current = null;
    };

    const onTouchEnd = () => {
      touchStartRef.current = null;
    };

    const onKeyDown = (e) => {
      if (disabledRef.current) return;
      if (e.key === 'ArrowRight') goTo(index + 1);
      if (e.key === 'ArrowLeft') goTo(index - 1);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    if (!isTouchDevice) {
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: true });
      el.addEventListener('touchend', onTouchEnd, { passive: true });
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [index, count]);

  return { index, setIndex: goTo, containerRef };
}
