interface Flashcard {
  f: string;
  b: string;
}

type NotebookLM_Flashcard = {
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

type NotebookLM_Quiz = {
  quiz: Quiz[];
};

type ExportFormat = "raw-json" | "markdown-flashcards";

type InputFormat = "quiz" | "flashcard";

interface ExportConfig {
  fileName: string;
  mimeType: string;
  content: string;
}

interface ExportResult extends ExportConfig {
  itemCount: number;
}
