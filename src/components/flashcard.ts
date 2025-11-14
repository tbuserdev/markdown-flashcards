import {
  questions,
  currentQuestionIndex,
  filteredIndices,
  setCurrentQuestionIndex,
} from "../lib/state";
import type { Flashcard } from "../lib/state";
import { updateNavButtonStates } from "./navigation";

declare const marked: { parse: (markdown: string) => string };

export let questionTextEl: HTMLElement;
export let answerAreaEl: HTMLElement;
export let answerTextEl: HTMLElement;
export let questionCounterEl: HTMLElement;
let showAnswerBtn: HTMLButtonElement;
let classificationButtonsContainer: HTMLElement;

export function initFlashcard() {
  questionTextEl = document.getElementById("question-text") as HTMLElement;
  answerAreaEl = document.getElementById("answer-area") as HTMLElement;
  answerTextEl = document.getElementById("answer-text") as HTMLElement;
  questionCounterEl = document.getElementById(
    "question-counter"
  ) as HTMLElement;
  showAnswerBtn = document.getElementById(
    "show-answer-btn"
  ) as HTMLButtonElement;
  classificationButtonsContainer = document.getElementById(
    "classification-buttons"
  ) as HTMLElement;
}

export function displayQuestion(index: number) {
  if (index < 0 || index >= questions.length) {
    questionTextEl.textContent = "No questions found. Load a Markdown file.";
    answerTextEl.textContent = "";
    answerAreaEl.classList.add("hidden");
    questionCounterEl.textContent = "0 / 0";
    return;
  }

  setCurrentQuestionIndex(index);
  const qData: Flashcard = questions[index];

  questionTextEl.innerHTML = marked.parse(qData.q);
  answerTextEl.innerHTML = marked.parse(qData.a);
  answerAreaEl.classList.add("hidden");
  showAnswerBtn.classList.remove("hidden");
  classificationButtonsContainer.classList.add("hidden");

  updateQuestionCounter();
  updateNavButtonStates();
}

export function showAnswer() {
  if (questions.length === 0) return;
  answerAreaEl.classList.remove("hidden");
  showAnswerBtn.classList.add("hidden");
  classificationButtonsContainer.classList.remove("hidden");
}

function updateQuestionCounter() {
  const currentFilteredIndex = filteredIndices.indexOf(currentQuestionIndex);
  questionCounterEl.textContent = `Question ${currentFilteredIndex + 1} / ${
    filteredIndices.length
  }`;
}
