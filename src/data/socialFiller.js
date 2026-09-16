// Generatore di post "riempitivi" per lo scroll infinito del mondo Social.
// Nessun backend: quando l'utente arriva in fondo al feed, se ne inventa
// altri al volo (autore finto tra i MOCK_USERS del mondo Social, testo da
// un pool di frasi per gruppo, like/commenti/età casuali) così il feed non
// finisce mai — esattamente come un vero social.
//
// Sono marcati con isFiller:true e NON vengono salvati in localStorage
// (vedi SocialFeed.jsx): ogni sessione ricomincia con un feed "fresco",
// invece di far crescere all'infinito lo storage del browser.
import { MOCK_USERS } from './mockUsers';

const SOCIAL_USER_IDS = MOCK_USERS.filter((u) => u.worlds.includes('social')).map((u) => u.id);

// Un pool di frasi per ciascun gruppo, più una bacheca "generale" (nessun
// gruppo) per varietà. Scritte come le userebbe una persona vera: brevi,
// con qualche emoji, senza punteggiatura da comunicato stampa.
const TEMPLATE_BUCKETS = [
  {
    groupId: 'fotografia',
    texts: [
      'Alba stamattina sul Circeo, valeva la sveglia alle 5 📷',
      'Nuovo obiettivo 50mm, non torno più indietro',
      'Consigli per scattare controluce senza bruciare i colori?',
      'Rullino sviluppato oggi, che soddisfazione vedere gli scatti finiti',
      'Il cielo di stasera sembrava dipinto, non serviva neanche un filtro',
      'Sto allestendo una piccola mostra, primi scatti appesi 🖼️',
      'Foto notturna col treppiede, ancora tremo dal freddo ma valeva',
    ],
  },
  {
    groupId: 'musica-indie',
    texts: [
      'Scoperta della settimana: una band norvegese pazzesca, chi conosce già Kalte Sonne?',
      'Biglietti presi per il concerto di dicembre, non vedo l\'ora 🎸',
      'Playlist autunnale pronta, dritte per ampliarla?',
      'Vinile trovato al mercatino, un colpo di fortuna incredibile',
      'Prima volta a un festival piccolo, atmosfera tutta diversa dai palazzetti',
      'Il bassista ha rotto una corda a metà concerto e il pubblico ha continuato a cantare',
    ],
  },
  {
    groupId: 'arte-mostre',
    texts: [
      'Mostra imperdibile in centro, ci sono tornata due volte',
      'Chi viene al vernissage di venerdì? Apertura alle 19',
      'Sto preparando una piccola installazione, presto qualche anteprima',
      'Galleria nuova appena aperta, spazio bellissimo',
      'Consiglio un libro su Caravaggio se qualcuno vuole approfondire',
      'Workshop di ceramica questo weekend, primo tentativo e già mi manca',
    ],
  },
  {
    groupId: 'cinema',
    texts: [
      'Cerco comparse per le riprese di sabato, zona centro',
      'Finito il montaggio del corto, presto il primo taglio',
      'Serata cinema all\'aperto stasera, chi si aggrega?',
      'Sceneggiatura al terzo giro di revisioni, non finisce mai',
      'Casting fissato per la prossima settimana, un po\' di ansia ma bello',
      'Rivisto un classico ieri sera, regge ancora benissimo',
    ],
  },
  {
    groupId: 'mare-barca',
    texts: [
      'Uscita in barca stamattina, mare piatto come una tavola ⛵',
      'Manutenzione motore fatta, pronti per il weekend',
      'Tramonto visto dal largo, foto che non rende neanche la metà',
      'Nodo nuovo imparato oggi, il parlato non mi tradisce più',
      'Vento perfetto oggi, prima uscita a vela della stagione',
      'Delfini avvistati al largo stamattina, giornata pazzesca',
    ],
  },
  {
    groupId: 'cucina',
    texts: [
      'Impasto per la pizza lievitato 24 ore, stasera si mangia bene 🍕',
      'Ricetta della nonna rifatta oggi, il sugo non è uguale ma ci sono andato vicino',
      'Disastro totale con il pane, secondo tentativo della settimana',
      'Chi ha una ricetta buona per gli gnocchi senza farina 00?',
      'Cena improvvisata con quello che c\'era in frigo, uscita benissimo',
      'Torta di compleanno fatta in casa, orgoglio della giornata',
    ],
  },
  {
    groupId: 'tech',
    texts: [
      'Fibra attivata oggi in tutto il quartiere, finalmente 💪',
      'Configurato il router mesh, addio zone morte del wifi',
      'Aggiornamento firmware fatto, tutto più stabile ora',
      'Cablaggio nuovo in ufficio, che ordine dietro l\'armadio rack',
      'Consigli su uno switch gestito per una piccola rete domestica?',
      'Prima chiamata in fibra simmetrica, differenza netta',
    ],
  },
  {
    groupId: 'danza-teatro',
    texts: [
      'Prova costume oggi, non vedo l\'ora dello spettacolo 💃',
      'Debutto sabato sera, un po\' di tensione ma ci siamo',
      'Lezione di danza contemporanea oggi, gambe a pezzi ma felice',
      'Copione imparato quasi tutto, mancano le ultime scene',
      'Applausi a scena aperta ieri sera, emozione unica',
      'Nuovo coreografo in compagnia, stile completamente diverso e mi piace',
    ],
  },
  {
    groupId: 'viaggi',
    texts: [
      'Volo in ritardo di tre ore ma almeno sono arrivata ✈️',
      'Città nuova, prime impressioni: caotica ma bellissima',
      'Consigli per tre giorni a Lisbona? Prima volta lì',
      'Valigia fatta all\'ultimo come sempre',
      'Vista dall\'aereo pazzesca stamattina',
      'Mercato locale scoperto per caso, il posto migliore del viaggio',
    ],
  },
  {
    groupId: null,
    texts: [
      'Giornata tranquilla oggi, di quelle che fanno bene',
      'Caffè al bar sotto casa, la sveglia giusta',
      'Weekend che è volato via troppo in fretta',
      'Serata con vecchi amici, mancava da un po\'',
      'Passeggiata lunga oggi, ci voleva',
      'Piccola vittoria di giornata, va bene anche così',
    ],
  },
];

const FILLER_COMMENTS = [
  'Bellissimo!',
  'Wow, che meraviglia 😍',
  'Dimmi tutto, dove?',
  'Anche io c\'ero quasi andato',
  'Segnato, grazie della dritta',
  'Invidia sana 👏',
  'Fantastico, condividi altro!',
  'Questo mi serviva oggi',
];

let fillerCounter = 0;

function pickFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// options.groupId  -> forza il post in un gruppo specifico (per la vista
//                     dedicata di un gruppo, o per generare contenuto
//                     coerente con un gruppo a cui l'utente è iscritto).
// options.authorId -> forza l'autore (per il tab "Seguiti": genera post
//                     solo di persone che l'utente segue davvero).
export function generateFillerPost(options = {}) {
  fillerCounter += 1;
  const bucket = options.groupId
    ? TEMPLATE_BUCKETS.find((b) => b.groupId === options.groupId) ?? TEMPLATE_BUCKETS[TEMPLATE_BUCKETS.length - 1]
    : pickFrom(TEMPLATE_BUCKETS);

  const testo = pickFrom(bucket.texts);
  const autoreId = options.authorId ?? pickFrom(SOCIAL_USER_IDS);
  // Senza gruppo forzato, ~6 post su 10 finiscono comunque in un gruppo
  // (coerente col loro contenuto), gli altri restano in bacheca generale.
  const gruppo_id = options.groupId ?? (Math.random() < 0.6 ? bucket.groupId : null);

  // Età pesata verso il recente (prodotto di due uniformi = distribuzione
  // a favore dei valori bassi), fino a ~20 giorni per dare varietà.
  const ageHours = Math.floor(Math.random() * Math.random() * 480);
  const likeCount = Math.floor(Math.random() * Math.random() * 70);
  const hasComment = Math.random() < 0.35;

  const postId = `filler-${Date.now()}-${fillerCounter}`;

  const post = {
    id: postId,
    autoreId,
    testo,
    data: new Date(Date.now() - ageHours * 3_600_000).toISOString(),
    // Solo la lunghezza e il confronto con 'me' contano altrove: id finti
    // negativi, mai risolti come autori reali, mai uguali a 'me'.
    mi_piace: Array.from({ length: likeCount }, (_, i) => -1 * (fillerCounter * 1000 + i)),
    commenti: hasComment ? [`${postId}-c1`] : [],
    gif: null,
    link_esterno: null,
    gruppo_id,
    isFiller: true,
  };

  const comments = hasComment
    ? [
        {
          id: `${postId}-c1`,
          post_id: postId,
          autoreId: pickFrom(SOCIAL_USER_IDS.filter((id) => id !== autoreId)),
          testo: pickFrom(FILLER_COMMENTS),
          data: post.data,
          gif: null,
          reazioni: Math.random() < 0.3 ? { '❤️': 1 } : {},
          isFiller: true,
        },
      ]
    : [];

  return { post, comments };
}

// Genera un lotto di post. Per il tab "Seguiti", authorPool/groupPool sono
// le persone seguite/i gruppi a cui si è iscritti: ogni post pesca a caso
// da uno dei due, così il tab resta "infinito" ma sempre pertinente.
export function generateFillerBatch(count, { groupId, followingPool, joinedGroupsPool } = {}) {
  const batch = [];
  const allComments = [];
  for (let i = 0; i < count; i += 1) {
    let options = {};
    if (groupId) {
      options = { groupId };
    } else if (followingPool || joinedGroupsPool) {
      const pool = [
        ...(followingPool ?? []).map((authorId) => ({ authorId })),
        ...(joinedGroupsPool ?? []).map((gid) => ({ groupId: gid })),
      ];
      if (pool.length === 0) break;
      options = pool[Math.floor(Math.random() * pool.length)];
    }
    const { post, comments } = generateFillerPost(options);
    batch.push(post);
    allComments.push(...comments);
  }
  return { posts: batch, comments: allComments };
}
