import {
  setDecks,
  setActiveDeckId,
  decks,
  activeDeckId,
} from "./state";
import { parseQuestions } from "./markdown";
import type { Deck, FlashcardStatus } from "./state";

export function saveDecks() {
  try {
    localStorage.setItem("decks", JSON.stringify(decks));
  } catch (e) a
    console.warn("Saving decks to localStorage failed.", e);
  }
}

export function loadDecks() {
  try {
    const item = localStorage.getItem("decks");
    if (item) {
      const loadedDecks = JSON.parse(item) as Deck[];
      setDecks(loadedDecks);
    }
  } catch (e) {
    console.warn("Loading decks from localStorage failed.", e);
  }
}

export function saveActiveDeckId() {
  try {
    if (activeDeckId) {
      localStorage.setItem("activeDeckId", activeDeckId);
    } else {
      localStorage.removeItem("activeDeckId");
    }
  } catch (e) {
    console.warn("Saving active deck ID to localStorage failed.", e);
  }
}

export function loadActiveDeckId() {
  try {
    const item = localStorage.getItem("activeDeckId");
    if (item) {
      setActiveDeckId(item);
    }
  } catch (e) {
    console.warn("Loading active deck ID from localStorage failed.", e);
  }
}

export function migrateToMultiDeckStorage() {
  const oldMarkdown = localStorage.getItem("markdownContent");
  const oldStatus = localStorage.getItem("ipgLernStatus");

  if (oldMarkdown) {
    const defaultDeck: Deck = {
      id: "default-deck",
      name: "Default Deck",
      url: null,
      markdown: oldMarkdown,
      questions: [],
    };

    const parsedQuestions = parseQuestions(oldMarkdown);

    if (oldStatus) {
      try {
        const oldStatuses = JSON.parse(oldStatus) as FlashcardStatus[];
        parsedQuestions.forEach((q, i) => {
          if (i < oldStatuses.length) {
            q.status = oldStatuses[i];
          }
        });
      } catch (e) {
        console.warn("Failed to parse old status, using 'unseen' for all cards", e);
      }
    }

    defaultDeck.questions = parsedQuestions;

    setDecks([defaultDeck]);
    setActiveDeckId(defaultDeck.id);
    saveDecks();
    saveActiveDeckId();

    localStorage.removeItem("markdownContent");
    localStorage.removeItem("ipgLernStatus");
    localStorage.removeItem("lastSourceUrl");
  }
}

export function clearLocalStorageAndReload() {
  if (
    confirm(
      "Do you really want to delete all stored data (decks and learning progress)?"
    )
  ) {
    localStorage.removeItem("decks");
    localStorage.removeItem("activeDeckId");
    alert("All data deleted. The page will reload with default questions.");
    location.reload();
  }
}
