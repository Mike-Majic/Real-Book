import { useEffect, useState } from 'react';

// Layout desktop (due colonne affiancate) solo se ENTRAMBE le condizioni sono
// vere: orizzontale E almeno 700px di larghezza. Una tavoletta in verticale,
// o un telefono ruotato ma stretto, restano nel layout mobile. Condiviso da
// tutti i componenti che usano TwoColumnSwitcher (CategoryColumn, feed Social...).
const DESKTOP_QUERY = '(orientation: landscape) and (min-width: 700px)';

export function useIsDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}
