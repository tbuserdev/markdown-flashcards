import { questions, currentQuestionIndex } from "../lib/state";
import type { FlashcardStatus } from "../lib/state";
import { saveDecks } from "../lib/storage";
import { showAnswer } from "./flashcard";

let countAllEl: HTMLElement;
let countUnseenEl: HTMLElement;
let countEasyEl: HTMLElement;
let countMediumEl: HTMLElement;
let countHardEl: HTMLElement;

export function initClassification() {
  countAllEl = document.getElementById("count-all") as HTMLElement;
  countUnseenEl = document.getElementById("count-unseen") as HTMLElement;
  countEasyEl = document.getElementById("count-easy") as HTMLElement;
  countMediumEl = document.getElementById("count-medium") as HTMLElement;
  countHardEl = document.getElementById("count-hard") as HTMLElement;
}

export function classifyQuestion(
  status: FlashcardStatus,
  goToNext: () => void
) {
  if (questions.length === 0) return;
  questions[currentQuestionIndex].status = status;
  showAnswer();
  updateSummaryCounts();
  saveDecks();
  goToNext();
}

export function updateSummaryCounts() {
  let counts = {
    all: questions.length,
    unseen: 0,
    easy: 0,
    medium: 0,
    hard: 0,
  };
  for (const q of questions) {
    counts[q.status]++;
  }
  countAllEl.textContent = counts.all.toString();
  countUnseenEl.textContent = counts.unseen.toString();
  countEasyEl.textContent = counts.easy.toString();
  countMediumEl.textContent = counts.medium.toString();
  countHardEl.textContent = counts.hard.toString();
}
