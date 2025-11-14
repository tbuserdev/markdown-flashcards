import { currentQuestionIndex, filteredIndices } from "../lib/state";

export let nextBtn: HTMLButtonElement;
export let prevBtn: HTMLButtonElement;

export function initNavigation() {
  nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
  prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
}

export function updateNavButtonStates() {
  if (!nextBtn || !prevBtn) return;
  if (filteredIndices.length === 0) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }
  const currentFilteredIndex = filteredIndices.indexOf(currentQuestionIndex);
  prevBtn.disabled = currentFilteredIndex === 0;
  nextBtn.disabled = currentFilteredIndex >= filteredIndices.length - 1;
}
