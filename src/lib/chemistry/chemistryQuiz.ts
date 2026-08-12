export type QuizQuestion = {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  explanation?: string;
  topic?: string;
};

export const SAMPLE_QUIZ: QuizQuestion[] = [
  {
    id: "q1",
    question: "What is the symbol for Sodium?",
    options: ["S", "Na", "N", "So"],
    answer: "Na",
    explanation: "Sodium's chemical symbol is Na (from Latin 'Natrium').",
    topic: "elements",
  },
  {
    id: "q2",
    question: "How many atoms are in one molecule of H2SO4?",
    options: ["6", "7", "8", "5"],
    answer: "7",
    explanation: "H2SO4 has 2 H + 1 S + 4 O = 7 atoms.",
    topic: "compounds",
  },
];
