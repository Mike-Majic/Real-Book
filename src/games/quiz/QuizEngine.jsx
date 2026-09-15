import { useEffect, useState } from 'react';
import './QuizEngine.css';

// Motore quiz riutilizzabile (Famiglia 1): riceve solo le domande e gestisce
// timer, punteggio, avanzamento e feedback corretto/sbagliato. Usato da Quiz
// lampo (solo testo) e da Indovina la canzone (con renderQuestionMedia per il
// preview audio) — stesso motore, cambiano solo i dati e il media opzionale.
export default function QuizEngine({ questions, timePerQuestion = 10, onFinish, renderQuestionMedia }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);

  const question = questions[index];

  useEffect(() => {
    setSelected(null);
    setTimeLeft(timePerQuestion);
  }, [index, timePerQuestion]);

  useEffect(() => {
    if (selected !== null) return undefined; // già risposto: timer fermo
    if (timeLeft <= 0) {
      handleAnswer(null); // tempo scaduto: conta come risposta sbagliata
      return undefined;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, selected]);

  const handleAnswer = (optionIndex) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    const isCorrect = optionIndex === question.correctIndex;
    const earned = isCorrect ? Math.max(10, timeLeft * 10) : 0;
    const newScore = score + earned;
    const newCorrectCount = correctCount + (isCorrect ? 1 : 0);
    setScore(newScore);
    setCorrectCount(newCorrectCount);

    setTimeout(() => {
      if (index + 1 < questions.length) {
        setIndex((i) => i + 1);
      } else {
        onFinish(newScore, { detail: `${newCorrectCount} risposte corrette su ${questions.length}` });
      }
    }, 900);
  };

  return (
    <div className="rb-quiz-engine">
      <div className="rb-quiz-topbar">
        <span>Domanda {index + 1}/{questions.length}</span>
        <span className="rb-quiz-timer">{timeLeft}s</span>
        <span className="rb-quiz-score">Punti: {score}</span>
      </div>

      {renderQuestionMedia && renderQuestionMedia(question)}

      <h3 className="rb-quiz-question">{question.text}</h3>

      <div className="rb-quiz-options">
        {question.options.map((opt, i) => {
          const showState = selected !== null;
          const isCorrect = i === question.correctIndex;
          const isWrongPick = showState && i === selected && !isCorrect;
          return (
            <button
              key={opt}
              type="button"
              className={`rb-quiz-option ${showState && isCorrect ? 'correct' : ''} ${isWrongPick ? 'wrong' : ''}`}
              onClick={() => handleAnswer(i)}
              disabled={showState}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
