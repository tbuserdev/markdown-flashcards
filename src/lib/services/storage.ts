import { DEFAULT_DECK_ID, type Deck, type FlashcardStatus } from '../state';
import { parseQuestions } from './markdown';
import { createQuickstartDeck } from './decks';
import { DEFAULT_QUICKSTART_MARKDOWN } from '../../assets/quickstart';

const STORAGE_KEYS = {
	decks: 'decks',
	activeDeckId: 'activeDeckId',
	legacyMarkdown: 'markdownContent',
	legacyStatus: 'ipgLernStatus',
	legacySourceUrl: 'lastSourceUrl'
} as const;

function normalizeDeck(deck: Deck): Deck {
	return {
		...deck,
		questions: deck.questions.map((question) => ({
			...question,
			status: question.status ?? 'unseen'
		}))
	};
}

export function createDefaultDeck(): Deck {
	return createQuickstartDeck(
		DEFAULT_DECK_ID,
		'Quickstart Guide',
		DEFAULT_QUICKSTART_MARKDOWN,
		parseQuestions(DEFAULT_QUICKSTART_MARKDOWN)
	);
}

export function loadDecks(): Deck[] {
	try {
		const item = localStorage.getItem(STORAGE_KEYS.decks);
		if (!item) return [];

		const parsed = JSON.parse(item) as Deck[];
		if (!Array.isArray(parsed)) return [];

		return parsed.map(normalizeDeck);
	} catch (error) {
		console.warn('Loading decks from localStorage failed.', error);
		return [];
	}
}

export function saveDecks(deckList: Deck[]) {
	try {
		localStorage.setItem(STORAGE_KEYS.decks, JSON.stringify(deckList));
	} catch (error) {
		console.warn('Saving decks to localStorage failed.', error);
	}
}

export function loadActiveDeckId(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEYS.activeDeckId);
	} catch (error) {
		console.warn('Loading active deck ID from localStorage failed.', error);
		return null;
	}
}

export function saveActiveDeckId(deckId: string | null) {
	try {
		if (deckId) {
			localStorage.setItem(STORAGE_KEYS.activeDeckId, deckId);
		} else {
			localStorage.removeItem(STORAGE_KEYS.activeDeckId);
		}
	} catch (error) {
		console.warn('Saving active deck ID to localStorage failed.', error);
	}
}

export function migrateLegacyStorage(): boolean {
	const oldMarkdown = localStorage.getItem(STORAGE_KEYS.legacyMarkdown);
	const oldStatus = localStorage.getItem(STORAGE_KEYS.legacyStatus);

	if (!oldMarkdown) {
		return false;
	}

	const defaultDeck: Deck = {
		id: DEFAULT_DECK_ID,
		name: 'Default Deck',
		url: null,
		markdown: oldMarkdown,
		questions: []
	};

	const parsedQuestions = parseQuestions(oldMarkdown);
	let oldStatuses: FlashcardStatus[] = [];

	if (oldStatus) {
		try {
			oldStatuses = JSON.parse(oldStatus) as FlashcardStatus[];
		} catch (error) {
			console.warn("Failed to parse old status, using 'unseen' for all cards", error);
		}
	}

	defaultDeck.questions = parsedQuestions.map((question, index) => ({
		...question,
		status: index < oldStatuses.length ? oldStatuses[index] : 'unseen'
	}));

	saveDecks([defaultDeck]);
	saveActiveDeckId(defaultDeck.id);

	localStorage.removeItem(STORAGE_KEYS.legacyMarkdown);
	localStorage.removeItem(STORAGE_KEYS.legacyStatus);
	localStorage.removeItem(STORAGE_KEYS.legacySourceUrl);

	return true;
}

export function clearStoredAppData() {
	localStorage.removeItem(STORAGE_KEYS.decks);
	localStorage.removeItem(STORAGE_KEYS.activeDeckId);
	localStorage.removeItem(STORAGE_KEYS.legacyMarkdown);
	localStorage.removeItem(STORAGE_KEYS.legacyStatus);
	localStorage.removeItem(STORAGE_KEYS.legacySourceUrl);
}
