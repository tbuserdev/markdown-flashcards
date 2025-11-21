# GitHub Gist Export

The extension allows you to save your extracted flashcards directly to a **GitHub Gist**. This is incredibly useful because it gives you a permanent URL for your deck that you can instantly load into the [Markdown Flashcards App](/markdown-flashcards/introduction).

## What is a GitHub Gist?
A Gist is a simple way to share snippets of code or text. In our case, it acts as a cloud host for your flashcard files.

## Setup Guide

To use this feature, you need a **Personal Access Token (PAT)** from GitHub. This acts like a password that allows the extension to create Gists on your behalf.

### Step 1: Get a Token
1.  Log in to your [GitHub account](https://github.com/).
2.  Go to **Settings** (click your profile picture -> Settings).
3.  Scroll down to **Developer settings** (bottom left).
4.  Click **Personal access tokens** -> **Tokens (classic)**.
5.  Click **Generate new token (classic)**.
6.  **Note**: Give it a name like "NotebookLM Extractor".
7.  **Scopes**: You only need to check one box:
    *   [x] `gist` (Create gists)
8.  Click **Generate token**.
9.  **Copy the token immediately**. You won't be able to see it again!

### Step 2: Configure the Extension
1.  Open the **NotebookLM Extractor** extension.
2.  Click the **Settings** (gear icon) or look for the GitHub section.
3.  Paste your token into the **GitHub Personal Access Token** field.
4.  Check the box **Push to Gist by default** if you want this to be your primary save method.

## Security Note
Your token is encrypted before being saved in your browser's local storage. It is never sent to any server other than GitHub's official API.

## How to Use
Once set up:
1.  Extract your data as usual.
2.  Click the **Push to GitHub Gist** button.
3.  The extension will upload the file and automatically copy the **Raw URL** to your clipboard.
4.  Paste that URL directly into the Flashcard App's "Load Deck" dialog!
