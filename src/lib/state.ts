export type FlashcardStatus = "unseen" | "easy" | "medium" | "hard";

export interface Flashcard {
  q: string;
  a: string;
  status: FlashcardStatus;
}

export let questions: Flashcard[] = [];
export let currentQuestionIndex: number = 0;
export let currentFilter: string = "all";
export let filteredIndices: number[] = [];

export function setCurrentQuestionIndex(index: number) {
  currentQuestionIndex = index;
}

export function setCurrentFilter(filter: string) {
  currentFilter = filter;
}
