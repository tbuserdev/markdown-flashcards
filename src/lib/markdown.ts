import { Flashcard } from "./state";

export function parseQuestions(markdownContent: string): Flashcard[] {
  if (!markdownContent) return [];
  const entries = markdownContent.trim().split(/\n\s*\n\s*\n/);
  const newQuestions: Flashcard[] = [];

  for (const entry of entries) {
    const parts = entry.trim().split("\n---\n");
    if (parts.length === 2) {
      newQuestions.push({
        q: parts[0].trim(),
        a: parts[1].trim(),
        status: "unseen",
      });
    }
  }
  return newQuestions;
}
