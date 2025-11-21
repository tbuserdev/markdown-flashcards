function formatQuizAsMarkdown(quizData: Quiz[]): string {
  return quizData
    .map((q) => {
      const front = `**${q.question}**\n\n${q.answerOptions
        .map((option, index) => `${index + 1}. ${option.text}`)
        .join("\n")}`;

      const correctIndex = q.answerOptions.findIndex((o) => o.isCorrect);
      const correct = q.answerOptions[correctIndex];
      const back = correct
        ? `${correctIndex + 1}. ${correct.text}\n\n${correct.rationale}`
        : "No correct answer";

      return `${front}\n---\n${back}`;
    })
    .join("\n\n\n");
}

function formatFlashcardsAsMarkdown(flashcardData: Flashcard[]): string {
  return flashcardData.map((f) => `${f.f}\n---\n${f.b}`).join("\n\n\n");
}

function prepareQuizExport(
  quizData: Quiz[],
  outputFormat: ExportFormat
): ExportConfig {
  if (outputFormat === "raw-json") {
    return {
      fileName: "notebooklm_quiz_export.json",
      mimeType: "application/json",
      content: JSON.stringify(quizData, null, 2),
    };
  } else {
    return {
      fileName: "notebooklm_quiz_export.md",
      mimeType: "text/markdown",
      content: formatQuizAsMarkdown(quizData),
    };
  }
}

function prepareFlashcardExport(
  flashcardData: Flashcard[],
  outputFormat: ExportFormat
): ExportConfig {
  if (outputFormat === "raw-json") {
    return {
      fileName: "notebooklm_flashcards_export.json",
      mimeType: "application/json",
      content: JSON.stringify(flashcardData, null, 2),
    };
  } else {
    return {
      fileName: "notebooklm_flashcards_export.md",
      mimeType: "text/markdown",
      content: formatFlashcardsAsMarkdown(flashcardData),
    };
  }
}

export function prepareExport(
  data: NotebookLM_Flashcard | NotebookLM_Quiz,
  outputFormat: ExportFormat,
  customFilename?: string
): ExportResult {
  let config: ExportConfig;
  let itemCount: number;

  if ("quiz" in data) {
    const quizData = (data as NotebookLM_Quiz).quiz;
    config = prepareQuizExport(quizData, outputFormat);
    itemCount = quizData.length;
  } else if ("flashcards" in data) {
    const flashcardData = (data as NotebookLM_Flashcard).flashcards;
    config = prepareFlashcardExport(flashcardData, outputFormat);
    itemCount = flashcardData.length;
  } else {
    throw new Error("Unknown data format");
  }

  if (customFilename) {
    const parts = customFilename.split(".");
    const base = parts.slice(0, -1).join(".") || customFilename;
    const correctExt = outputFormat === "raw-json" ? "json" : "md";
    config.fileName = base + "." + correctExt;
  }

  return { ...config, itemCount };
}
