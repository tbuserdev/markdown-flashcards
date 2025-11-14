import {
  currentQuestionIndex,
  filteredIndices,
} from "../lib/state";

let nextBtn: HTMLButtonElement;
let prevBtn: HTMLButtonElement;

export function initNavigation() {
    nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
    prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
}

export function updateNavButtonStates() {
  if (!nextBtn || !prevBtn) return;
  const currentFilteredIndex =
    filteredIndices.indexOf(currentQuestionIndex);
  prevBtn.disabled = currentFilteredIndex === 0;
  nextBtn.disabled = currentFilteredIndex >= filteredIndices.length - 1;
}
