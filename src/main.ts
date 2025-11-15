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
} from "./lib/state";
import type { FlashcardStatus, Deck } from "./lib/state";
import {
  loadDecks,
  saveDecks,
  loadActiveDeckId,
  saveActiveDeckId,
  migrateToMultiDeckStorage,
  clearLocalStorageAndReload,
} from "./lib/storage";
import { transformUrl, handleShareClick } from "./lib/url";
import { parseQuestions } from "./lib/markdown";
import {
  initFlashcard,
  displayQuestion,
  showAnswer,
} from "./components/flashcard";
import { initNavigation } from "./components/navigation";
import { initImporter, toggleImporter } from "./components/importer";
import {
  initClassification,
  classifyQuestion,
} from "./components/classification";
import { initFilter, applyFilter } from "./components/filter";
import { initDeckSelector } from "./components/deck-selector";

let classifyButtons: NodeListOf<Element>;
let filterButtons: NodeListOf<Element>;
let urlInput: HTMLInputElement;
let fetchBtn: HTMLButtonElement;
let clearBtn: HTMLButtonElement;
let toggleImporterBtn: HTMLButtonElement;
let closeImporterBtn: HTMLButtonElement;
let shareDeckBtn: HTMLButtonElement;
let bottomToggleBtn: HTMLButtonElement;

async function init() {
  classifyButtons = document.querySelectorAll(".classify-btn");
  filterButtons = document.querySelectorAll(".filter-btn");
  urlInput = document.getElementById("md-url-input") as HTMLInputElement;
  fetchBtn = document.getElementById("fetch-md-btn") as HTMLButtonElement;
  clearBtn = document.getElementById("clear-storage-btn") as HTMLButtonElement;
  toggleImporterBtn = document.getElementById(
    "toggle-importer-btn"
  ) as HTMLButtonElement;
  closeImporterBtn = document.getElementById(
    "close-importer-btn"
  ) as HTMLButtonElement;
  shareDeckBtn = document.getElementById("share-deck-btn") as HTMLButtonElement;
  bottomToggleBtn = document.getElementById(
    "bottom-toggle-btn"
  ) as HTMLButtonElement;

  initFlashcard();
  initNavigation();
  initImporter();
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

  fetchBtn?.addEventListener("click", fetchAndCreateDeckFromUrl);
  clearBtn?.addEventListener("click", clearLocalStorageAndReload);
  toggleImporterBtn?.addEventListener("click", toggleImporter);
  shareDeckBtn?.addEventListener("click", handleShareClick);
  if (toggleImporterBtn) {
    toggleImporterBtn.textContent = "Open Importer";
  }
  closeImporterBtn?.addEventListener("click", toggleImporter);
  urlInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") fetchAndCreateDeckFromUrl();
  });

  bottomToggleBtn?.addEventListener("click", toggleImporter);

  document.addEventListener("keydown", (e) => {
    if (document.activeElement === urlInput) return;

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
    } catch (error: any) {
      alert(
        `Failed to preload from URL: ${preloadUrl}\nError: ${error.message}\n\nFalling back to local data.`
      );
    }
  }

  if (decks.length === 0) {
    console.log("No decks in localStorage. Loading default content.");
    const defaultMarkdown =
      "# Markdown Flashcards Trainer - Quickstart Guide\n\nWelcome to the Markdown Flashcards Trainer!\n---\nThis app helps you study flashcards created from Markdown files. Each flashcard has a question and an answer, separated by '---'. Questions are grouped by triple newlines.\n\n\nWhat is a flashcard in this app?\n---\nA flashcard consists of a question and an answer. The question appears first. Click 'Show Answer' or press Space to reveal the answer. Then classify it as Easy, Medium, or Hard.\n\n\nHow do I load my own flashcards?\n---\nClick the '^' button at the bottom or 'Open Importer' in the top-right. Enter a URL to a Markdown file from GitHub, GitLab, OneDrive, Google Drive, or a Gist. Click 'LOAD' to fetch and save it.\n\n\nHow do I navigate between flashcards?\n---\nUse the ← and → buttons, or press the Left/Right arrow keys on your keyboard. The counter shows your current position (e.g., Question 3 / 10).\n\n\nHow do I classify flashcards?\n---\nAfter revealing the answer, choose Easy (3), Medium (2), or Hard (1) using the buttons or number keys. This tracks your progress and helps with filtering.\n\n\nWhat do the filters do?\n---\nUse the filter buttons at the top: 'All' shows everything, 'Remaining' shows unseen cards, and the others show cards you've classified as Easy/Medium/Hard. Switch filters to focus your study.\n\n\nWhat are the keyboard shortcuts?\n---\n- Space: Show answer\n- 1: Hard\n- 2: Medium\n- 3: Easy\n- ←: Previous card\n- →: Next card\n\n\nHow do I reset my progress?\n---\nIn the importer (bottom panel), click 'DELETE ALL' to clear saved flashcards and progress. This reloads the page with default content.\n\n\nCan I use local files?\n---\nFor local development, use a local server (e.g., `python -m http.server`) to serve your Markdown file, then enter the localhost URL in the importer.\n\n\nWhat format should my Markdown be?\n---\nWrite questions and answers like this:\n\nQuestion 1\n---\nAnswer 1\n\n\nQuestion 2\n---\nAnswer 2\n\nUse Markdown formatting (bold, italic, lists, code) in questions and answers.\n\n\nHow does progress saving work?\n---\nYour classifications are saved in your browser's localStorage. They persist between sessions but are cleared when you load new content or delete all data.";
    const newDeck: Deck = {
      id: "default-deck",
      name: "Quickstart Guide",
      url: null,
      markdown: defaultMarkdown,
      questions: [],
    };
    newDeck.questions = parseQuestions(defaultMarkdown);
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

function reinitializeWithContent(newQuestions: any[]) {
  questions.length = 0;
  Array.prototype.push.apply(questions, newQuestions);
  setCurrentQuestionIndex(0);
  setCurrentFilter("all");
  filteredIndices.length = 0;
  applyFilter("all");
  console.log(`App reinitialized. ${questions.length} questions loaded.`);
}

async function fetchAndCreateDeckFromUrl() {
  let url = urlInput.value.trim();
  if (!url) {
    alert("Please enter a URL.");
    return;
  }
  try {
    await createDeckFromUrl(url, false);
  } catch (error: any) {
    console.error("Error fetching URL:", error);
    alert(
      `Error loading URL. Check the URL and browser console for details. \n\nError: ${error.message}`
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

  const deckName = isPreload
    ? `Loaded from ${new URL(sourceUrl).hostname}`
    : prompt("Enter a name for this deck:", `Deck from ${new URL(sourceUrl).hostname}`);

  if (deckName) {
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

document.addEventListener("DOMContentLoaded", init);
