import {
  questions,
  setCurrentQuestionIndex,
  setCurrentFilter,
  filteredIndices,
  currentQuestionIndex,
  setDecks,
  setActiveDeckId,
  decks,
  activeDeckId,
  DEFAULT_DECK_ID,
} from "./lib/state";
import type { FlashcardStatus, Deck } from "./lib/state";
import {
  loadDecks,
  saveDecks,
  loadActiveDeckId,
  saveActiveDeckId,
  migrateToMultiDeckStorage,
} from "./lib/storage";
import { transformUrl, handleShareClick } from "./lib/url";
import { parseQuestions } from "./lib/markdown";
import {
  initFlashcard,
  displayQuestion,
  showAnswer,
} from "./components/flashcard";
import { initNavigation } from "./components/navigation";
import {
  initClassification,
  classifyQuestion,
} from "./components/classification";
import { initFilter, applyFilter } from "./components/filter";
import { initDeckSelector } from "./components/deck-selector";
import { DEFAULT_QUICKSTART_MARKDOWN } from "./assets/quickstart";

let classifyButtons: NodeListOf<Element>;
let filterButtons: NodeListOf<Element>;
let shareDeckBtn: HTMLButtonElement;
let renameDeckBtn: HTMLButtonElement;
let deleteDeckBtn: HTMLButtonElement;
let addDeckBtn: HTMLButtonElement;

async function init() {
  classifyButtons = document.querySelectorAll(".classify-btn");
  filterButtons = document.querySelectorAll(".filter-btn");
  shareDeckBtn = document.getElementById("share-deck-btn") as HTMLButtonElement;
  renameDeckBtn = document.getElementById(
    "rename-deck-btn"
  ) as HTMLButtonElement;
  deleteDeckBtn = document.getElementById(
    "delete-deck-btn"
  ) as HTMLButtonElement;
  addDeckBtn = document.getElementById("add-deck-btn") as HTMLButtonElement;

  initFlashcard();
  initNavigation();
  initClassification();
  initFilter();

  document
    .getElementById("show-answer-btn")
    ?.addEventListener("click", showAnswer);
  document.getElementById("next-btn")?.addEventListener("click", goToNext);
  document.getElementById("prev-btn")?.addEventListener("click", goToPrev);
  classifyButtons.forEach((btn) => {
    btn.addEventListener("click", () =>
      classifyQuestion(
        (btn as HTMLElement).dataset.status as FlashcardStatus,
        goToNext
      )
    );
  });
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () =>
      applyFilter((btn as HTMLElement).dataset.filter as string)
    );
  });

  shareDeckBtn?.addEventListener("click", handleShareClick);
  renameDeckBtn?.addEventListener("click", handleRenameDeck);
  deleteDeckBtn?.addEventListener("click", handleDeleteDeck);
  addDeckBtn?.addEventListener("click", handleAddNewDeck);

  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === " ") {
      e.preventDefault();
      showAnswer();
    }
    if (e.key === "1") classifyQuestion("hard", goToNext);
    if (e.key === "2") classifyQuestion("medium", goToNext);
    if (e.key === "3") classifyQuestion("easy", goToNext);
  });

  await loadInitialDecks();
}

async function loadInitialDecks() {
  migrateToMultiDeckStorage();
  loadDecks();
  loadActiveDeckId();

  const urlParams = new URL(location.href).searchParams;
  const preloadUrl = urlParams.get("preload");

  if (preloadUrl) {
    try {
      await createDeckFromUrl(preloadUrl, true);
      history.replaceState(null, "", location.pathname);
      return;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      alert(
        `Failed to preload from URL: ${preloadUrl}\nError: ${errMsg}\n\nFalling back to local data.`
      );
    }
  }

  if (decks.length === 0) {
    console.log("No decks in localStorage. Loading default content.");
    const newDeck = createDefaultDeck();
    setDecks([newDeck]);
    setActiveDeckId(newDeck.id);
    saveDecks();
    saveActiveDeckId();
  }

  if (activeDeckId) {
    setActiveDeck(activeDeckId);
  } else if (decks.length > 0) {
    setActiveDeck(decks[0].id);
  } else {
    reinitializeWithContent([]);
  }
  updateDeckSelector();
}

function setActiveDeck(deckId: string) {
  const deck = decks.find((d) => d.id === deckId);
  if (deck) {
    setActiveDeckId(deck.id);
    saveActiveDeckId();
    reinitializeWithContent(deck.questions);
    updateDeckSelector();
  }
}

function updateDeckSelector() {
  initDeckSelector(setActiveDeck);
}

function createDefaultDeck(): Deck {
  const newDeck: Deck = {
    id: DEFAULT_DECK_ID,
    name: "Quickstart Guide",
    url: null,
    markdown: DEFAULT_QUICKSTART_MARKDOWN,
    questions: [],
  };
  newDeck.questions = parseQuestions(DEFAULT_QUICKSTART_MARKDOWN);
  return newDeck;
}

function reinitializeWithContent(newQuestions: Deck["questions"]) {
  questions.length = 0;
  Array.prototype.push.apply(questions, newQuestions);
  setCurrentQuestionIndex(0);
  setCurrentFilter("all");
  filteredIndices.length = 0;
  applyFilter("all");
  console.log(`App reinitialized. ${questions.length} questions loaded.`);
}

async function handleAddNewDeck() {
  const url = prompt(
    "Enter a URL to load a deck from:\n\nSupported: GitHub, GitLab, OneDrive, Google Drive, Gist URL..."
  );
  if (!url) {
    return;
  }

  try {
    await createDeckFromUrl(url, false);
  } catch (error: unknown) {
    console.error("Error fetching URL:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    alert(
      `Error loading URL. Check the URL and browser console for details. \n\nError: ${errMsg}`
    );
  }
}

async function createDeckFromUrl(url: string, isPreload: boolean) {
  const sourceUrl = url;
  const transformedUrl = await transformUrl(url);

  const response = await fetch(transformedUrl);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
  }
  const markdownContent = await response.text();

  const autoName = `Loaded from ${new URL(sourceUrl).hostname}`;

  if (isPreload) {
    const confirmPreload = confirm(
      `Do you want to create a deck from ${sourceUrl}?`
    );
    if (!confirmPreload) {
      alert("Preloaded deck creation cancelled");
      return;
    }
  }

  const deckName = prompt(`Enter a name for this deck:`, autoName);
  if (deckName === null) {
    alert("Deck creation cancelled");
    return;
  }

  if (deckName.trim() === "") {
    alert("Deck name cannot be empty.");
    return;
  }

  const nameExists = decks.some((deck) => deck.name === deckName);
  if (nameExists && !isPreload) {
    const tryAgain = !window.confirm(
      `A deck named "${deckName}" already exists. Do you want to continue and create another deck with the same name?`
    );
    if (tryAgain) {
      alert("Please choose a different deck name.");
      return;
    }
  }

  const urlDeckIndex = decks.findIndex((deck) => deck.url === sourceUrl);
  if (urlDeckIndex !== -1) {
    const action = window.prompt(
      `A deck from this URL already exists ("${decks[urlDeckIndex].name}"). Type "replace" to overwrite, "keep" to add anyway, or "cancel" to abort.`,
      "cancel"
    );
    if (action === null || action.toLowerCase() === "cancel") {
      alert("Deck loading cancelled.");
      // remove the preload url and then reload
      if (isPreload) {
        removePreloadUrl();
      }
      location.reload();
      return;
    } else if (action.toLowerCase() === "replace") {
      const newDeck: Deck = {
        id: decks[urlDeckIndex].id,
        name: deckName,
        url: sourceUrl,
        markdown: markdownContent,
        questions: parseQuestions(markdownContent),
      };
      const updatedDecks = [...decks];
      updatedDecks[urlDeckIndex] = newDeck;
      setDecks(updatedDecks);
      saveDecks();
      setActiveDeck(newDeck.id);
      alert("Deck replaced successfully!");
      return;
    } else if (action.toLowerCase() !== "keep") {
      alert("Deck loading cancelled.");
      return;
    }
  }

  const newDeck: Deck = {
    id: crypto.randomUUID(),
    name: deckName,
    url: sourceUrl,
    markdown: markdownContent,
    questions: parseQuestions(markdownContent),
  };
  setDecks([...decks, newDeck]);
  saveDecks();
  setActiveDeck(newDeck.id);
  if (!isPreload) {
    alert("Deck successfully loaded and saved!");
  }
}

function removePreloadUrl() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.has("preload")) {
      url.searchParams.delete("preload");
      const newUrl = url.pathname + url.search + url.hash;
      // Replace history entry so the preload param is removed without adding a new entry
      history.replaceState(null, "", newUrl);
    }
  } catch (e) {
    // If URL parsing or history manipulation fails, silently ignore to avoid blocking flow
    console.warn("Failed to remove preload URL param:", e);
  }
}

function goToNext() {
  const currentFilteredIndex = filteredIndices.indexOf(currentQuestionIndex);
  if (currentFilteredIndex < filteredIndices.length - 1) {
    displayQuestion(filteredIndices[currentFilteredIndex + 1]);
  }
}

function goToPrev() {
  const currentFilteredIndex = filteredIndices.indexOf(currentQuestionIndex);
  if (currentFilteredIndex > 0) {
    displayQuestion(filteredIndices[currentFilteredIndex - 1]);
  }
}

function handleRenameDeck() {
  if (!activeDeckId) {
    alert("No deck selected.");
    return;
  }

  const activeDeck = decks.find((d) => d.id === activeDeckId);
  if (!activeDeck) {
    alert("Deck not found.");
    return;
  }

  const newName = prompt("Enter a new name for this deck:", activeDeck.name);
  if (newName === null) {
    return;
  }

  if (newName.trim() === "") {
    alert("Deck name cannot be empty.");
    return;
  }

  const nameExists = decks.some(
    (deck) => deck.name === newName && deck.id !== activeDeckId
  );
  if (nameExists) {
    alert(`A deck named "${newName}" already exists.`);
    return;
  }

  activeDeck.name = newName;
  const updatedDecks = decks.map((d) =>
    d.id === activeDeckId ? activeDeck : d
  );
  setDecks(updatedDecks);
  saveDecks();
  updateDeckSelector();
  alert("Deck renamed successfully!");
}

function handleDeleteDeck() {
  if (!activeDeckId) {
    alert("No deck selected.");
    return;
  }

  const activeDeck = decks.find((d) => d.id === activeDeckId);
  if (!activeDeck) {
    alert("Deck not found.");
    return;
  }

  const confirmDelete = confirm(
    `Are you sure you want to delete the deck "${activeDeck.name}"? This cannot be undone.`
  );
  if (!confirmDelete) {
    return;
  }

  const updatedDecks = decks.filter((d) => d.id !== activeDeckId);
  setDecks(updatedDecks);
  saveDecks();

  if (updatedDecks.length > 0) {
    setActiveDeck(updatedDecks[0].id);
  } else {
    const newDeck = createDefaultDeck();
    setDecks([newDeck]);
    setActiveDeckId(newDeck.id);
    saveDecks();
    saveActiveDeckId();
    setActiveDeck(newDeck.id);
  }

  alert("Deck deleted successfully!");
}

document.addEventListener("DOMContentLoaded", init);
