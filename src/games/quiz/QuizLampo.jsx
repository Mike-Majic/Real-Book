import { useState } from 'react';
import QuizEngine from './QuizEngine';

// Domande di cultura generale adatte a bambini (geografia, animali, scienza
// di base) — nessun tema sensibile. 15 domande, 8 pescate a caso a partita.
const QUESTIONS = [
  { text: 'Qual è la capitale d’Italia?', options: ['Roma', 'Milano', 'Napoli', 'Torino'], correctIndex: 0 },
  { text: 'Quanti giorni ha una settimana?', options: ['5', '6', '7', '8'], correctIndex: 2 },
  { text: 'Che colore si ottiene mescolando blu e giallo?', options: ['Viola', 'Verde', 'Arancione', 'Rosa'], correctIndex: 1 },
  { text: 'Quale animale è chiamato il "re della foresta"?', options: ['Elefante', 'Leone', 'Tigre', 'Orso'], correctIndex: 1 },
  { text: 'Quanti lati ha un triangolo?', options: ['2', '3', '4', '5'], correctIndex: 1 },
  { text: 'Da quale animale viene di solito il latte che beviamo?', options: ['Pecora', 'Mucca', 'Capra', 'Cavallo'], correctIndex: 1 },
  { text: 'Qual è il pianeta più vicino al Sole?', options: ['Venere', 'Terra', 'Mercurio', 'Marte'], correctIndex: 2 },
  { text: 'Quante zampe ha un ragno?', options: ['6', '8', '10', '4'], correctIndex: 1 },
  { text: 'Che stagione viene dopo l’inverno?', options: ['Estate', 'Autunno', 'Primavera', 'Inverno'], correctIndex: 2 },
  { text: 'Qual è il mare vicino all’Italia?', options: ['Mar Nero', 'Mar Mediterraneo', 'Mar Baltico', 'Mar Rosso'], correctIndex: 1 },
  { text: 'Quanti minuti ci sono in un’ora?', options: ['30', '45', '60', '90'], correctIndex: 2 },
  { text: 'Che forma ha di solito una palla da calcio?', options: ['Quadrata', 'Sferica', 'Triangolare', 'Ovale'], correctIndex: 1 },
  { text: 'Qual è il frutto giallo e ricurvo?', options: ['Mela', 'Banana', 'Pera', 'Uva'], correctIndex: 1 },
  { text: 'Quante ruote ha di solito una bicicletta?', options: ['1', '2', '3', '4'], correctIndex: 1 },
  { text: 'Come si chiama la stella al centro del nostro sistema solare?', options: ['Luna', 'Sole', 'Sirio', 'Polare'], correctIndex: 1 },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Livello: quante domande e quanti secondi a testa — più difficile vuol
// dire più domande da fare e meno tempo per rispondere.
const SETTINGS = {
  facile: { count: 6, time: 15 },
  medio: { count: 8, time: 10 },
  difficile: { count: 10, time: 6 },
};

// Trivia veloce a tempo: domande pescate a caso, punteggio più alto quanto
// più si risponde in fretta.
export default function QuizLampo({ onFinish, difficulty = 'medio' }) {
  const { count, time } = SETTINGS[difficulty] ?? SETTINGS.medio;
  // useState(() => ...) invece di ricalcolarlo a ogni render: altrimenti le
  // domande cambierebbero sotto ai piedi del motore a ogni nuovo render.
  const [questions] = useState(() => shuffle(QUESTIONS).slice(0, Math.min(count, QUESTIONS.length)));
  return <QuizEngine questions={questions} timePerQuestion={time} onFinish={onFinish} />;
}
