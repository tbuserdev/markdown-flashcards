# Export Formats

The extension supports two main export formats. Here is how to choose the right one for you.

## 1. Markdown (Recommended)

This is the best format for studying and reading. It creates a `.md` file.

*   **For Quizzes**: It formats the question in bold, followed by the options. The "back" of the card (the answer) contains the correct option and the rationale (explanation).
*   **For Flashcards**: It creates a standard `Front --- Back` format.
*   **Compatibility**: Works with Obsidian, Mochi Cards, and our [Markdown Flashcards App](/markdown-flashcards/introduction).

**Example Output:**
```markdown
**What is the capital of France?**

1. Berlin
2. Madrid
3. Paris
4. Rome
---
3. Paris

Paris is the capital and most populous city of France.
```

## 2. Raw JSON

This format dumps the raw data extracted from the page into a `.json` file.

*   **Use Case**: Developers who want to write their own converters or process the data programmatically.
*   **Content**: Contains the full structure including internal IDs, raw text, and boolean flags for correct answers.

**Example Output:**
```json
[
  {
    "question": "What is the capital of France?",
    "answerOptions": [
      { "text": "Berlin", "isCorrect": false },
      { "text": "Paris", "isCorrect": true }
    ]
  }
]
```
