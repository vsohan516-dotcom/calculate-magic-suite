import React, { useState } from "react";
import { SAMPLE_QUIZ } from "@/lib/chemistry/chemistryQuiz";

export function ChemistryQuiz() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const q = SAMPLE_QUIZ[index];
  const onAnswer = (opt: string) => {
    if (opt === q.answer) setScore((s) => s + 1);
    setIndex((i) => Math.min(SAMPLE_QUIZ.length - 1, i + 1));
  };

  return (
    <div className="glass-panel p-4">
      <h3 className="font-display text-sm font-semibold">Practice Quiz</h3>
      <div className="mt-3">
        <div className="text-sm">{q.question}</div>
        <div className="mt-2 grid gap-2">
          {q.options?.map((o) => (
            <button key={o} className="btn" onClick={() => onAnswer(o)}>{o}</button>
          ))}
        </div>
        <div className="mt-3 text-xs">Score: {score} / {SAMPLE_QUIZ.length}</div>
      </div>
    </div>
  );
}
