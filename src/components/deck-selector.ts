import { decks, activeDeckId } from "../lib/state";

let deckSelector: HTMLSelectElement;

export function initDeckSelector(onDeckSelect: (deckId: string) => void) {
  deckSelector = document.getElementById(
    "deck-selector"
  ) as HTMLSelectElement;

  if (deckSelector) {
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

    deckSelector.addEventListener("change", (e) => {
      const selectedDeckId = (e.target as HTMLSelectElement).value;
      onDeckSelect(selectedDeckId);
    });
  }
}
