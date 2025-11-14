import { questions } from "./state";

export function parseQuestions(markdownContent: string) {
  if (!markdownContent) return;
  const entries = markdownContent.trim().split(/\n\s*\n\s*\n/);

  for (const entry of entries) {
    const parts = entry.trim().split("\n---\n");
    if (parts.length === 2) {
      questions.push({
        q: parts[0].trim(),
        a: parts[1].trim(),
        status: "unseen",
      });
    }
  }
}
