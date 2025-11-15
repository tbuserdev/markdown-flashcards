import {
  questions,
  setDecks,
  setActiveDeckId,
  decks,
  activeDeckId,
} from "./state";
import type { Deck, Flashcard, FlashcardStatus } from "./state";

export function saveDecks() {
  try {
    localStorage.setItem("decks", JSON.stringify(decks));
  } catch (e) {
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
      id: "default-deck-id",
      name: "Default Deck",
      url: null,
      markdown: oldMarkdown,
      questions: questions.map((q, i) => ({
        ...q,
        status: oldStatus ? (JSON.parse(oldStatus) as FlashcardStatus[])[i] : "unseen",
      })),
    };

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
