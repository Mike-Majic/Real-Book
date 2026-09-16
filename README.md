# Versemove

Social network sperimentale costruito attorno a un **mappamondo 3D interattivo**: invece dei soliti feed, l'utente esplora il mondo e lo swipe a due dita cambia "mondo" (e colore), passando da una modalità social all'altra.

## I quattro mondi

Lo swipe orizzontale a due dita (trackpad o touchscreen) — oppure le frecce ◀ ▶ o i puntini in basso a destra — fa scorrere tra:

1. 🔵 **Social** — stile Instagram, foto profilo sulla mappa con puntino della città.
2. 🔴 **Incontri** — stile Tinder/Badoo, con filtri genere/età/città/distanza (gratuiti).
3. ⚪ **Lavoro** — profili con curriculum allegato, utile per aziende che cercano candidati per città/distanza/tipologia di lavoro.
4. 🟣 **Arte & Musica** — musica, cinema, teatro, arte, stile TikTok.

## Stato del progetto

Questo è il **primo scaffold**: interfaccia e interazioni funzionanti, con dati finti (mock) al posto di un vero backend.

Fatto:
- Login/logout dimostrativo (in alto a destra) e tasto Impostazioni alla sua sinistra.
- Pannello Impostazioni con le due categorie richieste: personalizzazione (genere, età, città, distanza) e Lavoro (città, distanza, tipologia di lavoro a tendina).
- Mappamondo 3D con marker foto-profilo, zoom/rotazione, e swipe a due dita che cambia mondo e colore.
- Profilo utente cliccabile su ogni marker, con sezione CV dedicata nel mondo Lavoro.

Da fare (prossimi passi, un mondo alla volta):
- Backend reale (autenticazione, database utenti, upload foto/CV) — probabilmente con Supabase.
- Contenuti interni a ogni mondo (post nel Social, match nel mondo Incontri, candidature nel mondo Lavoro, feed video nel mondo Arte).
- App mobile / PWA per il vero swipe a due dita su smartphone.

## Sviluppo locale

```bash
npm install
npm run dev
```

Apri `http://localhost:5173`.

## Stack

- React + Vite
- [react-globe.gl](https://github.com/vasturiano/react-globe.gl) (Three.js) per il mappamondo 3D
- Nessuna dipendenza da backend per ora: dati mock in `src/data/`
