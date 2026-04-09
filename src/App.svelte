<script lang="ts">
	import { afterUpdate, onMount, tick } from 'svelte';
	import DeckSelector from './lib/components/DeckSelector.svelte';
	import FilterBar from './lib/components/FilterBar.svelte';
	import FlashcardView from './lib/components/FlashcardView.svelte';
	import ClassifyControls from './lib/components/ClassifyControls.svelte';
	import Dialog from './lib/components/Dialog.svelte';
	import ToastRegion from './lib/components/ToastRegion.svelte';
	import {
		activeDeck,
		activeDeckId,
		activeQuestions,
		answerVisible,
		currentFilter,
		currentQuestionIndex,
		decks,
		filteredIndices,
		resetQuestionState,
		setActiveDeck,
		setAnswerVisible,
		setCurrentFilter,
		setCurrentQuestionIndex,
		setDeckList,
		summaryCounts,
		type Deck,
		type Flashcard,
		type FlashcardStatus
	} from './lib/state';
	import { fetchDeckMarkdown } from './lib/services/deckImport';
	import { parseQuestions, renderMarkdown } from './lib/services/markdown';
	import {
		createDeck,
		appendDeck,
		classifyQuestion,
		findDeckByUrl,
		removeDeck,
		renameDeck,
		updateDeck
	} from './lib/services/decks';
	import {
		createDefaultDeck,
		loadActiveDeckId,
		loadDecks,
		migrateLegacyStorage,
		saveActiveDeckId,
		saveDecks
	} from './lib/services/storage';
	import { generateShareUrl, getDefaultDeckName } from './lib/services/urlTransform';

	type ImportPreview = {
		sourceUrl: string;
		transformedUrl: string;
		markdown: string;
		questions: Flashcard[];
		duplicateDeck: Deck | null;
	};

	type ToastTone = 'info' | 'success' | 'warning' | 'error';
	type ToastItem = {
		id: number;
		tone: ToastTone;
		message: string;
	};

	let importDialogOpen = false;
	let renameDialogOpen = false;
	let deleteDialogOpen = false;
	let shareFallbackDialogOpen = false;

	let importSourceUrl = '';
	let importDeckName = '';
	let importLoading = false;
	let importError = '';
	let importPreview: ImportPreview | null = null;
	let importWasPreloaded = false;

	let renameDraft = '';
	let renameError = '';

	let shareFallbackUrl = '';

	let toasts: ToastItem[] = [];
	let toastCounter = 0;

	let isNameConflict = false;
	let lastRenderedQuestionKey = '';

	function addToast(message: string, tone: ToastTone = 'info') {
		const id = ++toastCounter;
		toasts = [...toasts, { id, tone, message }];
		window.setTimeout(() => {
			toasts = toasts.filter((toast) => toast.id !== id);
		}, 3500);
	}

	function clearPreloadUrl() {
		const url = new URL(location.href);
		if (!url.searchParams.has('preload')) return;
		url.searchParams.delete('preload');
		history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
	}

	function openImportDialog(url = '', preload = false) {
		importDialogOpen = true;
		importSourceUrl = url;
		importDeckName = url ? getDefaultDeckName(url) : '';
		importLoading = false;
		importError = '';
		importPreview = null;
		importWasPreloaded = preload;
	}

	function closeImportDialog() {
		importDialogOpen = false;
		importLoading = false;
		importError = '';
		importPreview = null;
		importSourceUrl = '';
		importDeckName = '';
		isNameConflict = false;

		if (importWasPreloaded) {
			clearPreloadUrl();
			importWasPreloaded = false;
		}
	}

	function openRenameDialog() {
		if (!$activeDeck) {
			addToast('No deck selected.', 'warning');
			return;
		}

		renameDraft = $activeDeck.name;
		renameError = '';
		renameDialogOpen = true;
	}

	function closeRenameDialog() {
		renameDialogOpen = false;
		renameError = '';
	}

	function openDeleteDialog() {
		if (!$activeDeck) {
			addToast('No deck selected.', 'warning');
			return;
		}

		deleteDialogOpen = true;
	}

	function closeDeleteDialog() {
		deleteDialogOpen = false;
	}

	function openShareFallbackDialog(url: string) {
		shareFallbackUrl = url;
		shareFallbackDialogOpen = true;
	}

	function closeShareFallbackDialog() {
		shareFallbackDialogOpen = false;
		shareFallbackUrl = '';
	}

	function syncSelectedDeck(deckId: string) {
		if (!deckId) return;
		const nextDeck = $decks.find((deck) => deck.id === deckId);
		if (!nextDeck) return;

		setActiveDeck(deckId);
		saveActiveDeckId(deckId);
		setCurrentFilter('all');
		resetQuestionState();
	}

	function goToNext() {
		const visibleIndex = getVisibleQuestionIndex();
		if (visibleIndex === null) return;

		const currentPosition = $filteredIndices.indexOf(visibleIndex);
		if (currentPosition < 0 || currentPosition >= $filteredIndices.length - 1) {
			return;
		}

		setCurrentQuestionIndex($filteredIndices[currentPosition + 1]);
		setAnswerVisible(false);
	}

	function goToPrev() {
		const visibleIndex = getVisibleQuestionIndex();
		if (visibleIndex === null) return;

		const currentPosition = $filteredIndices.indexOf(visibleIndex);
		if (currentPosition <= 0) {
			return;
		}

		setCurrentQuestionIndex($filteredIndices[currentPosition - 1]);
		setAnswerVisible(false);
	}

	function showAnswer() {
		if (getVisibleQuestionIndex() === null) return;
		setAnswerVisible(true);
	}

	function getVisibleQuestionIndex(): number | null {
		if ($filteredIndices.length === 0) return null;

		return $filteredIndices.includes($currentQuestionIndex)
			? $currentQuestionIndex
			: $filteredIndices[0];
	}

	function getCurrentQuestion(): Flashcard | null {
		const visibleIndex = getVisibleQuestionIndex();
		return visibleIndex === null ? null : ($activeQuestions[visibleIndex] ?? null);
	}

	function getQuestionHtml(): string {
		const currentQuestion = getCurrentQuestion();
		return currentQuestion ? renderMarkdown(currentQuestion.q) : '';
	}

	function getAnswerHtml(): string {
		const currentQuestion = getCurrentQuestion();
		return currentQuestion ? renderMarkdown(currentQuestion.a) : '';
	}

	function getQuestionCounterText(): string {
		const visibleIndex = getVisibleQuestionIndex();
		if (visibleIndex !== null) {
			const visiblePosition = $filteredIndices.indexOf(visibleIndex);
			if (visiblePosition >= 0) {
				return `Question ${visiblePosition + 1} / ${$filteredIndices.length}`;
			}
		}

		return `Question 0 / ${$filteredIndices.length}`;
	}

	function getCanGoPrev(): boolean {
		const visibleIndex = getVisibleQuestionIndex();
		if (visibleIndex === null) return false;

		return $filteredIndices.indexOf(visibleIndex) > 0;
	}

	function getCanGoNext(): boolean {
		const visibleIndex = getVisibleQuestionIndex();
		if (visibleIndex === null) return false;

		const currentPosition = $filteredIndices.indexOf(visibleIndex);
		return currentPosition >= 0 && currentPosition < $filteredIndices.length - 1;
	}

	function getEmptyStateMessage(): string {
		return $activeQuestions.length > 0 && $filteredIndices.length === 0
			? 'No questions found in this filter.'
			: 'No questions found. Load a Markdown file.';
	}

	function classifyCurrentQuestion(status: FlashcardStatus) {
		if (!$activeDeck) return;
		if ($activeQuestions.length === 0) return;

		const visibleIndex = getVisibleQuestionIndex();
		if (visibleIndex === null) return;

		const currentPosition = $filteredIndices.indexOf(visibleIndex);
		const nextIndex = currentPosition >= 0 ? $filteredIndices[currentPosition + 1] : undefined;

		const nextDecks = classifyQuestion($decks, $activeDeck.id, visibleIndex, status);

		setDeckList(nextDecks);
		saveDecks(nextDecks);
		setAnswerVisible(false);

		if (typeof nextIndex === 'number') {
			setCurrentQuestionIndex(nextIndex);
		}
	}

	async function handleImportSubmit() {
		importError = '';

		const sourceUrl = importSourceUrl.trim();
		if (!sourceUrl) {
			importError = 'Enter a URL to load a deck.';
			return;
		}

		importLoading = true;

		try {
			const deckData = await fetchDeckMarkdown(sourceUrl);
			const questions = parseQuestions(deckData.markdown);

			if (questions.length === 0) {
				throw new Error('No flashcards found in the loaded markdown.');
			}

			importPreview = {
				sourceUrl: deckData.sourceUrl,
				transformedUrl: deckData.transformedUrl,
				markdown: deckData.markdown,
				questions,
				duplicateDeck: findDeckByUrl($decks, deckData.sourceUrl)
			};

			if (!importDeckName.trim()) {
				importDeckName = getDefaultDeckName(deckData.sourceUrl);
			}

			isNameConflict = $decks.some(
				(deck) =>
					deck.name === importDeckName.trim() && deck.id !== importPreview?.duplicateDeck?.id
			);

			if (importPreview.duplicateDeck) {
				importError = `A deck from this URL already exists as "${importPreview.duplicateDeck.name}". You can replace it or save another copy.`;
			} else if (isNameConflict) {
				importError = `A deck named "${importDeckName.trim()}" already exists. You can still keep it or change the name.`;
			} else {
				importError = '';
			}

			addToast('Deck content loaded. Review the settings before saving.', 'info');
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to load deck content.';
			importError = message;
			addToast(message, 'error');
		} finally {
			importLoading = false;
		}
	}

	function saveImportedDeck(mode: 'replace' | 'keep') {
		if (!importPreview) return;

		const nextName = importDeckName.trim() || getDefaultDeckName(importPreview.sourceUrl);
		const targetDeck =
			mode === 'replace' && importPreview.duplicateDeck ? importPreview.duplicateDeck : null;

		const nextDeck = createDeck({
			id: targetDeck?.id,
			name: nextName,
			url: importPreview.sourceUrl,
			markdown: importPreview.markdown,
			questions: importPreview.questions
		});

		const nextDecks =
			targetDeck !== null
				? updateDeck($decks, targetDeck.id, nextDeck)
				: appendDeck($decks, nextDeck);

		setDeckList(nextDecks);
		saveDecks(nextDecks);
		setActiveDeck(nextDeck.id);
		saveActiveDeckId(nextDeck.id);
		setCurrentFilter('all');
		resetQuestionState();

		addToast(
			mode === 'replace' ? 'Deck replaced successfully.' : 'Deck imported successfully.',
			'success'
		);

		closeImportDialog();
	}

	function renameActiveDeck() {
		if (!$activeDeck) return;

		const nextName = renameDraft.trim();
		if (!nextName) {
			renameError = 'Deck name cannot be empty.';
			return;
		}

		const nameExists = $decks.some((deck) => deck.name === nextName && deck.id !== $activeDeck.id);
		if (nameExists) {
			renameError = `A deck named "${nextName}" already exists.`;
			return;
		}

		const nextDecks = renameDeck($decks, $activeDeck.id, nextName);
		setDeckList(nextDecks);
		saveDecks(nextDecks);
		addToast('Deck renamed successfully.', 'success');
		closeRenameDialog();
	}

	function deleteActiveDeck() {
		if (!$activeDeck) return;

		let nextDecks = removeDeck($decks, $activeDeck.id);
		if (nextDecks.length === 0) {
			const defaultDeck = createDefaultDeck();
			nextDecks = [defaultDeck];
			setDeckList(nextDecks);
			setActiveDeck(defaultDeck.id);
			saveDecks(nextDecks);
			saveActiveDeckId(defaultDeck.id);
		} else {
			const nextDeckId = nextDecks[0].id;
			setDeckList(nextDecks);
			setActiveDeck(nextDeckId);
			saveDecks(nextDecks);
			saveActiveDeckId(nextDeckId);
		}

		setCurrentFilter('all');
		resetQuestionState();
		addToast('Deck deleted successfully.', 'success');
		closeDeleteDialog();
	}

	async function copyShareUrl() {
		if (!$activeDeck?.url) {
			addToast('Load a deck from a URL before sharing it.', 'warning');
			return;
		}

		const shareUrl = generateShareUrl($activeDeck.url);

		try {
			await navigator.clipboard.writeText(shareUrl);
			addToast('Shareable URL copied to clipboard.', 'success');
		} catch (error) {
			console.warn('Clipboard copy failed:', error);
			openShareFallbackDialog(shareUrl);
		}
	}

	function handleFilterChange(event: CustomEvent<'all' | FlashcardStatus>) {
		const nextFilter = event.detail;
		const nextFilteredIndices =
			nextFilter === 'all'
				? $activeQuestions.map((_, index) => index)
				: $activeQuestions
						.map((question, index) => (question.status === nextFilter ? index : -1))
						.filter((index) => index >= 0);

		setCurrentFilter(nextFilter);
		setCurrentQuestionIndex(nextFilteredIndices[0] ?? 0);
		setAnswerVisible(false);
	}

	async function queueMathTypeset() {
		await tick();

		const mathJax = window.MathJax as { typesetPromise?: () => Promise<void> } | undefined;

		if (!mathJax?.typesetPromise) return;

		try {
			await mathJax.typesetPromise();
		} catch (error) {
			console.warn('MathJax typesetting failed:', error);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		const target = event.target as HTMLElement | null;
		if (
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement ||
			target?.isContentEditable
		) {
			return;
		}

		if (event.key === 'ArrowRight') {
			event.preventDefault();
			goToNext();
		}

		if (event.key === 'ArrowLeft') {
			event.preventDefault();
			goToPrev();
		}

		if (event.key === ' ') {
			event.preventDefault();
			showAnswer();
		}

		if (event.key === '1') {
			event.preventDefault();
			classifyCurrentQuestion('hard');
		}

		if (event.key === '2') {
			event.preventDefault();
			classifyCurrentQuestion('medium');
		}

		if (event.key === '3') {
			event.preventDefault();
			classifyCurrentQuestion('easy');
		}

		if (event.key === 'Escape') {
			if (shareFallbackDialogOpen) {
				closeShareFallbackDialog();
			} else if (importDialogOpen) {
				closeImportDialog();
			} else if (renameDialogOpen) {
				closeRenameDialog();
			} else if (deleteDialogOpen) {
				closeDeleteDialog();
			}
		}
	}

	onMount(() => {
		migrateLegacyStorage();

		const storedDecks = loadDecks();
		const storedActiveDeckId = loadActiveDeckId();

		if (storedDecks.length === 0) {
			const defaultDeck = createDefaultDeck();
			setDeckList([defaultDeck]);
			saveDecks([defaultDeck]);
			setActiveDeck(defaultDeck.id);
			saveActiveDeckId(defaultDeck.id);
		} else {
			setDeckList(storedDecks);
			const nextActiveDeckId =
				storedActiveDeckId && storedDecks.some((deck) => deck.id === storedActiveDeckId)
					? storedActiveDeckId
					: storedDecks[0].id;
			setActiveDeck(nextActiveDeckId);
			saveActiveDeckId(nextActiveDeckId);
		}

		setCurrentFilter('all');
		resetQuestionState();

		const preloadUrl = new URL(location.href).searchParams.get('preload');
		if (preloadUrl) {
			openImportDialog(preloadUrl, true);
			addToast('A shared deck URL has been loaded into the importer.', 'info');
		}
	});

	afterUpdate(() => {
		const currentQuestion = getCurrentQuestion();
		if (!currentQuestion) {
			lastRenderedQuestionKey = '';
			return;
		}

		const renderedKey = `${currentQuestion.q}:::${currentQuestion.a}`;
		if (renderedKey !== lastRenderedQuestionKey) {
			lastRenderedQuestionKey = renderedKey;
			void queueMathTypeset();
		}
	});
</script>

<svelte:window on:keydown={handleKeydown} />

<svelte:head>
	<title>Markdown Flashcards Trainer</title>
</svelte:head>

<div class="relative flex min-h-screen flex-col items-center justify-center p-4 pb-20 md:p-8">
	<div
		class="flex w-full max-w-4xl flex-col overflow-hidden rounded border border-neutral-800 bg-neutral-900"
		style="min-height: 60vh"
	>
		<div
			id="status-bar"
			class="flex flex-col justify-between gap-4 border-b border-neutral-800 p-4 md:items-center"
		>
			<div class="flex w-full flex-wrap items-center justify-between gap-2 pb-1">
				<DeckSelector
					decks={$decks}
					activeDeckId={$activeDeckId}
					on:select={(event) => syncSelectedDeck(event.detail)}
					on:add={() => openImportDialog()}
					on:rename={() => openRenameDialog()}
					on:delete={() => openDeleteDialog()}
					on:share={() => void copyShareUrl()}
				/>
			</div>
			<div class="flex w-full flex-wrap justify-between gap-2">
				<FilterBar
					activeFilter={$currentFilter}
					counts={$summaryCounts}
					on:change={handleFilterChange}
				/>
				<div class="flex items-center gap-4">
					<div id="question-counter" class="flex items-center text-sm font-normal text-neutral-500">
						{getQuestionCounterText()}
						<span class="ml-2 rounded bg-neutral-700 px-1 text-xs text-neutral-300">i</span>
					</div>
				</div>
			</div>
		</div>

		<div class="flex-grow overflow-y-auto p-6 md:p-10">
			<FlashcardView
				questionHtml={getQuestionHtml()}
				answerHtml={getAnswerHtml()}
				answerVisible={$answerVisible}
				emptyMessage={getEmptyStateMessage()}
			/>
		</div>

		<div
			id="controls-area"
			class="flex items-end justify-between gap-4 border-t border-neutral-800 bg-neutral-900 p-4 sm:items-center"
		>
			<button
				id="prev-btn"
				class="rounded bg-neutral-800 px-6 py-3 font-normal text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
				disabled={!getCanGoPrev()}
				on:click={goToPrev}
			>
				&larr;
			</button>

			{#if !$answerVisible}
				<button
					id="show-answer-btn"
					class="mb-1 rounded bg-neutral-100 px-5 py-2 text-base font-normal text-neutral-900 transition-colors hover:bg-white sm:mb-0"
					on:click={showAnswer}
				>
					Show Answer <span class="key-hint">␣</span>
				</button>
			{:else}
				<ClassifyControls
					visible={$answerVisible}
					on:classify={(event) => classifyCurrentQuestion(event.detail)}
				/>
			{/if}

			<button
				id="next-btn"
				class="rounded bg-neutral-800 px-6 py-3 font-normal text-neutral-200 transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
				disabled={!getCanGoNext()}
				on:click={goToNext}
			>
				&rarr;
			</button>
		</div>
	</div>

	<div
		class="absolute bottom-4 mt-4 flex gap-4 text-center text-xs text-neutral-400 text-neutral-500"
	>
		<a
			href="https://tbuserdev.github.io/markdown-flashcards/docs/"
			class="transition-colors hover:text-neutral-300"
		>
			Documentation
		</a>
		<p>|</p>
		<a
			href="https://tbuserdev.github.io/markdown-flashcards/docs/misc/privacy-policy"
			class="transition-colors hover:text-neutral-300"
		>
			Privacy Policy
		</a>
		<p>|</p>
		<a
			href="https://tbuserdev.github.io/markdown-flashcards/docs/misc/terms-of-service"
			class="transition-colors hover:text-neutral-300"
		>
			Terms of Service
		</a>
		<p>|</p>
		<a
			href="https://tbuserdev.github.io/markdown-flashcards/docs/misc/changelog"
			class="transition-colors hover:text-neutral-300"
		>
			Changelog
		</a>
	</div>

	<Dialog
		open={importDialogOpen}
		title="Import deck"
		subtitle={importWasPreloaded
			? 'This deck was loaded from a shared URL.'
			: 'Load a public markdown deck from a URL.'}
		maxWidth="max-w-2xl"
		on:close={closeImportDialog}
	>
		<div class="space-y-4">
			<div class="space-y-2">
				<label class="block text-sm text-neutral-300" for="import-url">Deck URL</label>
				<input
					id="import-url"
					bind:value={importSourceUrl}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-500"
					placeholder="https://gist.github.com/..."
				/>
			</div>

			<div class="space-y-2">
				<label class="block text-sm text-neutral-300" for="import-name">Deck name</label>
				<input
					id="import-name"
					bind:value={importDeckName}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-500"
					placeholder="My Deck"
				/>
			</div>

			{#if importError}
				<div
					class="rounded border border-amber-500/40 bg-amber-950/60 px-3 py-2 text-sm text-amber-100"
				>
					{importError}
				</div>
			{/if}

			{#if isNameConflict}
				<div
					class="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-300"
				>
					Another deck already uses this name. You can keep it or change the name before saving.
				</div>
			{/if}

			<div
				class="rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-500"
			>
				Supported sources: GitHub, GitLab, Gist, OneDrive, and Google Docs exports.
			</div>

			{#if importPreview}
				<div
					class="rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-400"
				>
					Loaded from: {importPreview.transformedUrl}
				</div>
			{/if}

			{#if !importPreview}
				<div class="flex flex-wrap items-center justify-end gap-2 pt-2">
					<button
						class="rounded bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
						type="button"
						on:click={closeImportDialog}
					>
						Cancel
					</button>
					<button
						class="rounded bg-neutral-100 px-4 py-2 text-sm text-neutral-900 hover:bg-white disabled:opacity-50"
						type="button"
						disabled={importLoading}
						on:click={handleImportSubmit}
					>
						{#if importLoading}
							Loading...
						{:else}
							Load Deck
						{/if}
					</button>
				</div>
			{:else if importPreview.duplicateDeck}
				<div class="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-800 pt-2">
					<button
						class="rounded bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
						type="button"
						on:click={closeImportDialog}
					>
						Cancel
					</button>
					<button
						class="rounded bg-neutral-700 px-4 py-2 text-sm text-neutral-100 hover:bg-neutral-600"
						type="button"
						on:click={() => saveImportedDeck('keep')}
					>
						Save as New Deck
					</button>
					<button
						class="rounded bg-neutral-100 px-4 py-2 text-sm text-neutral-900 hover:bg-white"
						type="button"
						on:click={() => saveImportedDeck('replace')}
					>
						Replace Existing
					</button>
				</div>
			{:else}
				<div class="flex flex-wrap items-center justify-end gap-2 border-t border-neutral-800 pt-2">
					<button
						class="rounded bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
						type="button"
						on:click={closeImportDialog}
					>
						Cancel
					</button>
					<button
						class="rounded bg-neutral-100 px-4 py-2 text-sm text-neutral-900 hover:bg-white"
						type="button"
						on:click={() => saveImportedDeck('keep')}
					>
						Save Deck
					</button>
				</div>
			{/if}
		</div>
	</Dialog>

	<Dialog
		open={renameDialogOpen}
		title="Rename deck"
		subtitle="Choose a unique name for this deck."
		on:close={closeRenameDialog}
	>
		<div class="space-y-4">
			<div class="space-y-2">
				<label class="block text-sm text-neutral-300" for="rename-name">Deck name</label>
				<input
					id="rename-name"
					bind:value={renameDraft}
					class="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 outline-none focus:border-neutral-500"
				/>
			</div>

			{#if renameError}
				<div
					class="rounded border border-amber-500/40 bg-amber-950/60 px-3 py-2 text-sm text-amber-100"
				>
					{renameError}
				</div>
			{/if}

			<div class="flex items-center justify-end gap-2">
				<button
					class="rounded bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
					type="button"
					on:click={closeRenameDialog}
				>
					Cancel
				</button>
				<button
					class="rounded bg-neutral-100 px-4 py-2 text-sm text-neutral-900 hover:bg-white"
					type="button"
					on:click={renameActiveDeck}
				>
					Save
				</button>
			</div>
		</div>
	</Dialog>

	<Dialog
		open={deleteDialogOpen}
		title="Delete deck"
		subtitle={$activeDeck
			? `Delete "${$activeDeck.name}"? This cannot be undone.`
			: 'Delete the active deck?'}
		on:close={closeDeleteDialog}
	>
		<div class="space-y-4">
			<div class="rounded border border-red-500/30 bg-red-950/50 px-3 py-2 text-sm text-red-100">
				The deck and its progress will be removed from this browser.
			</div>
			<div class="flex items-center justify-end gap-2">
				<button
					class="rounded bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
					type="button"
					on:click={closeDeleteDialog}
				>
					Cancel
				</button>
				<button
					class="rounded bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-400"
					type="button"
					on:click={deleteActiveDeck}
				>
					Delete
				</button>
			</div>
		</div>
	</Dialog>

	<Dialog
		open={shareFallbackDialogOpen}
		title="Copy share URL"
		subtitle="Your browser did not allow automatic clipboard access."
		maxWidth="max-w-2xl"
		on:close={closeShareFallbackDialog}
	>
		<div class="space-y-4">
			<textarea
				class="min-h-32 w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none"
				readonly
				bind:value={shareFallbackUrl}
			></textarea>
			<div class="flex items-center justify-end gap-2">
				<button
					class="rounded bg-neutral-800 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-700"
					type="button"
					on:click={closeShareFallbackDialog}
				>
					Close
				</button>
			</div>
		</div>
	</Dialog>

	<ToastRegion {toasts} />
</div>
