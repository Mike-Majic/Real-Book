import { useState } from 'react';
import QuizEngine from './QuizEngine';
import { playMelody, NOTE } from './audioPreview';
import './IndovinaCanzone.css';

// Motivetti originali (sintetizzati, non canzoni vere) abbinati a titoli
// fittizi nello stesso stile mock già usato in Arte & Musica: nessun problema
// di diritti, e "mock" perché non abbiamo audio reali da usare.
const SONGS = [
  { title: 'Controluce', melody: [[NOTE.C4, 260], [NOTE.E4, 260], [NOTE.G4, 260], [NOTE.C5, 500]] },
  { title: 'Notturna', melody: [[NOTE.A4, 220], [NOTE.G4, 220], [NOTE.F4, 220], [NOTE.E4, 500]] },
  { title: 'Radici', melody: [[NOTE.D4, 260], [NOTE.F4, 260], [NOTE.A4, 260], [NOTE.D5, 500]] },
  { title: 'Bassa marea', melody: [[NOTE.E4, 180], [NOTE.G4, 180], [NOTE.B4, 180], [NOTE.E5, 380], [NOTE.B4, 300]] },
  { title: 'Deriva Set', melody: [[NOTE.C4, 180], [NOTE.D4, 180], [NOTE.E4, 180], [NOTE.F4, 180], [NOTE.G4, 480]] },
  { title: 'Officina Meccanica', melody: [[NOTE.G4, 220], [NOTE.E4, 220], [NOTE.C4, 220], [NOTE.G4, 480]] },
  { title: 'Blocco 7', melody: [[NOTE.A4, 140], [NOTE.A4, 140], [NOTE.C5, 140], [NOTE.A4, 140], [NOTE.G4, 420]] },
  { title: 'Variazioni per archi', melody: [[NOTE.F4, 260], [NOTE.A4, 260], [NOTE.C5, 260], [NOTE.F4, 560]] },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions() {
  const picked = shuffle(SONGS).slice(0, 6);
  return picked.map((song) => {
    const distractors = shuffle(SONGS.filter((s) => s.title !== song.title)).slice(0, 3).map((s) => s.title);
    const options = shuffle([song.title, ...distractors]);
    return {
      text: 'Quale motivo hai appena ascoltato?',
      options,
      correctIndex: options.indexOf(song.title),
      melody: song.melody,
    };
  });
}

// Stesso motore di Quiz lampo (Famiglia 1): cambiano solo i dati e il
// preview audio, mostrato sopra la domanda tramite renderQuestionMedia.
export default function IndovinaCanzone({ onFinish }) {
  const [questions] = useState(buildQuestions);
  return (
    <QuizEngine
      questions={questions}
      timePerQuestion={15}
      onFinish={onFinish}
      renderQuestionMedia={(q) => (
        <button type="button" className="rb-song-play-btn" onClick={() => playMelody(q.melody)}>
          ▶ Ascolta l’anteprima
        </button>
      )}
    />
  );
}
