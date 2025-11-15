# markdown-flashcards

A super simple client-side application for learning flashcards in the Mochi Cards markdown flavor.

## What is this app?

Markdown Flashcards Trainer is a web-based flashcard learning tool that allows you to study flashcards created from Markdown files. It follows the Mochi Cards format, where each flashcard consists of a question and an answer separated by three dashes (`---`). Questions are grouped by triple newlines.

## What does it do?

- **Load Flashcards**: Import flashcards from Markdown files hosted on GitHub, GitLab, OneDrive, Google Drive, or Gists by entering a URL.
- **Study Mode**: Navigate through flashcards, reveal answers, and classify each card as Easy, Medium, or Hard to track your progress.
- **Filtering**: Filter cards by status (All, Remaining, Easy, Medium, Hard) to focus your study on specific categories.
- **Progress Tracking**: Saves your classifications and current position in your browser's localStorage for persistent sessions.
- **Keyboard Shortcuts**: Use keyboard shortcuts for efficient studying (Space to show answer, arrow keys to navigate, number keys to classify).
- **Markdown Support**: Full Markdown rendering for rich formatting in questions and answers, including code blocks, lists, tables, and more.
- **Responsive Design**: Works on desktop and mobile devices with a clean, dark-themed interface.

## How to use

1. Open the app in your browser.
2. Click the "^" button at the bottom or "Open Importer" to load flashcards.
3. Enter a URL to a Markdown file containing flashcards.
4. Click "LOAD" to fetch and start studying.
5. Use the controls to navigate, reveal answers, and classify cards.

## Markdown Format

Create flashcards in your Markdown file like this:

```
Question 1
---
Answer 1


Question 2
---
Answer 2
```

Use Markdown formatting within questions and answers for enhanced readability.

## Hosting your Flashcards with GitHub Gists

You can host your flashcards using GitHub Gists for easy access. Here's how:

1. Go to [GitHub Gists](https://gist.github.com/).
2. Create a new gist and paste your flashcards in the Markdown format described above.
3. Save the gist and copy the URL.
4. Use this URL in the app to load your flashcards.

## Development

This app is built with vanilla HTML, CSS, and JavaScript. It uses:

- Tailwind CSS for styling
- Marked.js for Markdown rendering
- Vite for development server

To run locally:

```bash
pnpm install
pnpm run dev
```
