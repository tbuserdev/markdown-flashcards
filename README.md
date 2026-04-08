# markdown-flashcards

A client-side flashcard trainer for Markdown decks, plus a browser extension for extracting NotebookLM flashcards and quizzes.

## Project Layout

- `src/`: Svelte web app for studying markdown decks
- `extension/`: NotebookLM extractor browser extension
- `docs/`: VitePress documentation site

## Flashcard App

The flashcard app loads decks from public URLs, stores progress in `localStorage`, and supports:

- multi-deck study
- markdown rendering with sanitization
- filtering by status
- keyboard shortcuts
- shareable preload URLs

Decks use the Mochi-style markdown format:

```md
## Question 1

Answer 1

## Question 2

Answer 2
```

## Development

```bash
pnpm install
pnpm run dev
```

## Build

- `pnpm run build` for the flashcard app
- `pnpm run build:extension` for the NotebookLM extension
- `pnpm run docs:build` for the docs site

## Notes

- The flashcard app is built with Svelte, Vite, TypeScript, and Tailwind CSS.
- Public markdown sources are sanitized before rendering.
- The extension is a separate Chrome MV3 project under `extension/`.
