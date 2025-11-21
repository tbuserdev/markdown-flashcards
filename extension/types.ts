interface Flashcard {
  f: string;
  b: string;
}

export type NotebookLM_Flashcard = {
  flashcards: Flashcard[];
};

interface AnswerOption {
  text: string;
  isCorrect: boolean;
  rationale: string;
}

interface Quiz {
  question: string;
  answerOptions: AnswerOption[];
  hint: string;
}

export type NotebookLM_Quiz = {
  quiz: Quiz[];
};

export type ExportFormat = "raw-json" | "markdown-flashcards";
