export const DEFAULT_QUICKSTART_MARKDOWN = `# Markdown Flashcards Trainer - Quickstart Guide

Welcome to the Markdown Flashcards Trainer!
---
This app helps you study flashcards created from Markdown files. Each flashcard has a question and an answer, separated by '---'. Questions are grouped by triple newlines.


What is a flashcard in this app?
---
A flashcard consists of a question and an answer. The question appears first. Click 'Show Answer' or press Space to reveal the answer. Then classify it as Easy, Medium, or Hard.


How do I load my own flashcards?
---
Click the '^' button at the bottom or 'Open Importer' in the top-right. Enter a URL to a Markdown file from GitHub, GitLab, OneDrive, Google Drive, or a Gist. Click 'LOAD' to fetch and save it.


How do I navigate between flashcards?
---
Use the ← and → buttons, or press the Left/Right arrow keys on your keyboard. The counter shows your current position (e.g., Question 3 / 10).


How do I classify flashcards?
---
After revealing the answer, choose Easy (3), Medium (2), or Hard (1) using the buttons or number keys. This tracks your progress and helps with filtering.


What do the filters do?
---
Use the filter buttons at the top: 'All' shows everything, 'Remaining' shows unseen cards, and the others show cards you've classified as Easy/Medium/Hard. Switch filters to focus your study.


What are the keyboard shortcuts?
---
- Space: Show answer
- 1: Hard
- 2: Medium
- 3: Easy
- ←: Previous card
- →: Next card


How do I reset my progress?
---
In the importer (bottom panel), click 'DELETE ALL' to clear saved flashcards and progress. This reloads the page with default content.


Can I use local files?
---
For local development, use a local server (e.g., \`python -m http.server\`) to serve your Markdown file, then enter the localhost URL in the importer.


What format should my Markdown be?
---
Write questions and answers like this:

Question 1
---
Answer 1


Question 2
---
Answer 2

Use Markdown formatting (bold, italic, lists, code) in questions and answers.


How does progress saving work?
---
Your classifications are saved in your browser's localStorage. They persist between sessions but are cleared when you load new content or delete all data.`;
