import { questions } from "./state";
import type { Flashcard, FlashcardStatus } from "./state";

export function saveStatus() {
  const statuses = questions.map((q: Flashcard) => q.status);
  try {
    localStorage.setItem("ipgLernStatus", JSON.stringify(statuses));
  } catch (e) {
    console.warn("Saving to localStorage failed.", e);
  }
}

export function loadStatus() {
  try {
    const storedStatuses = JSON.parse(
      localStorage.getItem("ipgLernStatus") as string
    ) as FlashcardStatus[];
    if (storedStatuses && storedStatuses.length === questions.length) {
      questions.forEach((q: Flashcard, i: number) => {
        q.status = storedStatuses[i];
      });
    }
  } catch (e) {
    console.warn("Loading from localStorage failed.", e);
  }
}

export function clearLocalStorageAndReload() {
  if (
    confirm(
      "Do you really want to delete all stored data (Markdown and learning progress)?"
    )
  ) {
    localStorage.removeItem("markdownContent");
    localStorage.removeItem("ipgLernStatus");
    localStorage.removeItem("lastSourceUrl");
    alert("All data deleted. The page will reload with default questions.");
    location.reload();
  }
}
