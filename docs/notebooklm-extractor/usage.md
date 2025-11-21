# Usage Guide

## Installation

Since this extension is a custom tool, it is not hosted on the Chrome Web Store. You will need to install it manually ("Load Unpacked"). Don't worry, it's safe and easy!

### Prerequisites
1.  Download the source code for this project (or `git clone` it).
2.  Ensure you have the `extension` folder available on your computer.

### Steps to Install

1.  **Open Extensions Management**:
    *   Open your browser (Chrome, Edge, Brave, etc.).
    *   Navigate to `chrome://extensions/`.
2.  **Enable Developer Mode**:
    *   Look for a toggle switch named **Developer mode** in the top right corner and turn it **ON**.
3.  **Load the Extension**:
    *   Click the **Load unpacked** button that appears in the top left.
    *   Select the `extension` folder from this project on your computer.
    *   *Important: Select the folder containing `manifest.json`.*
4.  **Done!** You should now see the "NotebookLM Extractor" icon in your browser toolbar.

## How to Extract Data

1.  **Go to NotebookLM**: Open [NotebookLM](https://notebooklm.google.com/) and open one of your notebooks.
2.  **Generate Content**: Ask NotebookLM to create a Quiz or Flashcards (or use the suggested actions).
3.  **Open the Extension**: Click the extension icon in your toolbar.
4.  **Choose Settings**:
    *   **Input Type**: Select "Quiz" or "Flashcards" depending on what is on your screen.
    *   **Output Format**: Usually "Markdown" is best for studying.
5.  **Extract**: Click **Extract Data**.
    *   If successful, you will see a preview of the content.
6.  **Save**:
    *   Click **Download File** to save it to your computer.
    *   Or click **Push to GitHub Gist** to save it online (requires setup, see [Gist Export](/notebooklm-extractor/github-gist-export)).
