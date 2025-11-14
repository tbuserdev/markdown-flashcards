import {
  questions,
  setCurrentFilter,
  filteredIndices,
} from "../lib/state";
import { displayQuestion } from "./flashcard";
import { updateSummaryCounts } from "./classification";
import { updateNavButtonStates } from "./navigation";

let filterButtons: NodeListOf<Element>;

let questionTextEl: HTMLElement;
let answerTextEl: HTMLElement;
let answerAreaEl: HTMLElement;
let questionCounterEl: HTMLElement;
let prevBtn: HTMLButtonElement;
let nextBtn: HTMLButtonElement;

export function initFilter() {
    filterButtons = document.querySelectorAll(".filter-btn");
    questionTextEl = document.getElementById("question-text") as HTMLElement;
    answerTextEl = document.getElementById("answer-text") as HTMLElement;
    answerAreaEl = document.getElementById("answer-area") as HTMLElement;
    questionCounterEl = document.getElementById("question-counter") as HTMLElement;
    prevBtn = document.getElementById("prev-btn") as HTMLButtonElement;
    nextBtn = document.getElementById("next-btn") as HTMLButtonElement;
}


export function applyFilter(filter: string) {
  setCurrentFilter(filter);

  let newFilteredIndices: number[];
  if (filter === "all") {
    newFilteredIndices = questions.map((_, i) => i);
  } else {
    newFilteredIndices = questions
      .map((q, i) => ({ status: q.status, index: i }))
      .filter((q) => q.status === filter)
      .map((q) => q.index);
  }

  filteredIndices.length = 0;
  filteredIndices.push(...newFilteredIndices);

  filterButtons.forEach((btn) => {
    const isActive = (btn as HTMLElement).dataset.filter === filter;
    btn.classList.remove(
      "bg-neutral-100",
      "text-neutral-900",
      "ring-1",
      "ring-neutral-100"
    );
    btn.classList.add(
      "bg-neutral-800",
      "hover:bg-neutral-700",
      "text-neutral-300"
    );
    if (isActive) {
      btn.classList.remove(
        "bg-neutral-800",
        "hover:bg-neutral-700",
        "text-neutral-300"
      );
      btn.classList.add("bg-neutral-100", "text-neutral-900");
    }
  });

  updateSummaryCounts();

  if (filteredIndices.length > 0) {
    displayQuestion(filteredIndices[0]);
  } else {
    questionTextEl.textContent = "No questions found in this filter.";
    answerTextEl.textContent = "";
    answerAreaEl.classList.add("hidden");
    questionCounterEl.textContent = "0 / 0";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  }
  updateNavButtonStates();
}
