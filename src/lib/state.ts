import { derived, writable } from 'svelte/store';

export type FlashcardStatus = 'unseen' | 'easy' | 'medium' | 'hard';
export type FlashcardFilter = 'all' | FlashcardStatus;

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

export const DEFAULT_DECK_ID = 'default-deck';

export const decks = writable<Deck[]>([]);
export const activeDeckId = writable<string | null>(null);
export const currentFilter = writable<FlashcardFilter>('all');
export const currentQuestionIndex = writable(0);
export const answerVisible = writable(false);

export const activeDeck = derived(
	[decks, activeDeckId],
	([$decks, $activeDeckId]) => $decks.find((deck) => deck.id === $activeDeckId) ?? null
);

export const activeQuestions = derived(activeDeck, ($activeDeck) =>
	$activeDeck ? $activeDeck.questions : []
);

export const filteredIndices = derived(
	[activeQuestions, currentFilter],
	([$activeQuestions, $currentFilter]) =>
		$currentFilter === 'all'
			? $activeQuestions.map((_, index) => index)
			: $activeQuestions
					.map((question, index) => (question.status === $currentFilter ? index : -1))
					.filter((index) => index >= 0)
);

export const summaryCounts = derived(activeQuestions, ($activeQuestions) => {
	const counts = {
		all: $activeQuestions.length,
		unseen: 0,
		easy: 0,
		medium: 0,
		hard: 0
	};

	for (const question of $activeQuestions) {
		counts[question.status]++;
	}

	return counts;
});

export const currentFilteredPosition = derived(
	[filteredIndices, currentQuestionIndex],
	([$filteredIndices, $currentQuestionIndex]) => $filteredIndices.indexOf($currentQuestionIndex)
);

export function setDeckList(nextDecks: Deck[]) {
	decks.set(nextDecks);
}

export function setActiveDeck(deckId: string | null) {
	activeDeckId.set(deckId);
}

export function setCurrentFilter(filter: FlashcardFilter) {
	currentFilter.set(filter);
}

export function setCurrentQuestionIndex(index: number) {
	currentQuestionIndex.set(index);
}

export function setAnswerVisible(visible: boolean) {
	answerVisible.set(visible);
}

export function resetQuestionState() {
	currentQuestionIndex.set(0);
	answerVisible.set(false);
}
