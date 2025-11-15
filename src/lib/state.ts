export type FlashcardStatus = "unseen" | "easy" | "medium" | "hard";

export const DEFAULT_DECK_ID = "default-deck";

export interface Flashcard {
  q: string;
  a: string;
  status: FlashcardStatus;
}

export interface Deck {
  id: string;
  name: string;
  url: string | null;
  markdown: string;
  questions: Flashcard[];
}

export const questions: Flashcard[] = [];
export let currentQuestionIndex: number = 0;
export let currentFilter: string = "all";
export const filteredIndices: number[] = [];
export let decks: Deck[] = [];
export let activeDeckId: string | null = null;

export function setDecks(newDecks: Deck[]) {
  decks = newDecks;
}

export function setActiveDeckId(id: string | null) {
  activeDeckId = id;
}

export function setCurrentQuestionIndex(index: number) {
  currentQuestionIndex = index;
}

export function setCurrentFilter(filter: string) {
  currentFilter = filter;
}
