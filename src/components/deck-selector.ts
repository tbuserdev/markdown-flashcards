import { decks, activeDeckId } from "../lib/state";

let deckSelector: HTMLSelectElement;
let currentHandler: ((e: Event) => void) | null = null;

export function initDeckSelector(onDeckSelect: (deckId: string) => void) {
  deckSelector = document.getElementById("deck-selector") as HTMLSelectElement;

  if (deckSelector) {
    if (currentHandler) {
      deckSelector.removeEventListener("change", currentHandler);
    }

    deckSelector.innerHTML = "";
    decks.forEach((deck) => {
      const option = document.createElement("option");
      option.value = deck.id;
      option.textContent = deck.name;
      if (deck.id === activeDeckId) {
        option.selected = true;
      }
      deckSelector.appendChild(option);
    });

    currentHandler = (e) => {
      const selectedDeckId = (e.target as HTMLSelectElement).value;
      onDeckSelect(selectedDeckId);
    };
    deckSelector.addEventListener("change", currentHandler);
  }
}
