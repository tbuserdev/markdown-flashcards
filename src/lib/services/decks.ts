import type { Deck, Flashcard, FlashcardStatus } from '../state';

export function createDeck(params: {
	id?: string;
	name: string;
	url: string | null;
	markdown: string;
	questions: Flashcard[];
}): Deck {
	return {
		id: params.id ?? crypto.randomUUID(),
		name: params.name,
		url: params.url,
		markdown: params.markdown,
		questions: params.questions
	};
}

export function updateDeck(deckList: Deck[], deckId: string, nextDeck: Deck): Deck[] {
	return deckList.map((deck) => (deck.id === deckId ? nextDeck : deck));
}

export function appendDeck(deckList: Deck[], nextDeck: Deck): Deck[] {
	return [...deckList, nextDeck];
}

export function removeDeck(deckList: Deck[], deckId: string): Deck[] {
	return deckList.filter((deck) => deck.id !== deckId);
}

export function renameDeck(deckList: Deck[], deckId: string, nextName: string): Deck[] {
	return deckList.map((deck) => (deck.id === deckId ? { ...deck, name: nextName } : deck));
}

export function classifyQuestion(
	deckList: Deck[],
	deckId: string,
	questionIndex: number,
	status: FlashcardStatus
): Deck[] {
	return deckList.map((deck) => {
		if (deck.id !== deckId) return deck;
		return {
			...deck,
			questions: deck.questions.map((question, index) =>
				index === questionIndex ? { ...question, status } : question
			)
		};
	});
}

export function findDeckByUrl(deckList: Deck[], sourceUrl: string): Deck | null {
	return deckList.find((deck) => deck.url === sourceUrl) ?? null;
}

export function createQuickstartDeck(
	deckId: string,
	name: string,
	markdown: string,
	questions: Flashcard[]
): Deck {
	return {
		id: deckId,
		name,
		url: null,
		markdown,
		questions
	};
}
