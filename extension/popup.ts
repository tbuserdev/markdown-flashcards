// ============================================================================
// Imports
// ============================================================================

import {
  getActiveTab,
  injectContentScript,
  extractDataFromPage,
} from "./dataExtractor.js";
import { prepareExport } from "./formatters.js";
import { createGist } from "./gistExporter.js";
import { downloadFile } from "./fileDownloader.js";
import { loadSettings, saveSettings } from "./settings.js";

// ============================================================================
// Constants
// ============================================================================

const FLASHCARD_BASE_URL = "https://tbuserdev.github.io/markdown-flashcards/";

// ============================================================================
// Main Export Logic
// ============================================================================

export async function handleExport(
  inputType: HTMLSelectElement,
  outputFormat: HTMLSelectElement,
  status: HTMLElement,
  githubPatInput: HTMLInputElement,
  filenameInput: HTMLInputElement,
  pushToGistInput: HTMLInputElement,
  resultLinksDiv: HTMLElement,
  gistLinkAnchor: HTMLAnchorElement,
  flashcardLinkAnchor: HTMLAnchorElement
): Promise<void> {
  status.textContent = "Sending request to all frames...";
  resultLinksDiv.style.display = "none";

  try {
    const tab = await getActiveTab();
    await injectContentScript(tab.id!);

    const inputFormat: InputFormat =
      inputType.value === "flashcards" ? "flashcard" : "quiz";
    const data = await extractDataFromPage(tab.id!, inputFormat);

    const customFilename = filenameInput.value.trim() || undefined;

    const exportConfig = prepareExport(
      data,
      outputFormat.value as ExportFormat,
      customFilename
    );

    if (pushToGistInput.checked) {
      const token = githubPatInput.value.trim();
      if (!token) {
        throw new Error("GitHub PAT is required for Gist export.");
      }

      status.textContent = "Creating Gist...";
      const gistUrl = await createGist(
        exportConfig.content,
        exportConfig.fileName,
        token
      );

      const flashcardUrl = `${FLASHCARD_BASE_URL}?preload=${encodeURIComponent(gistUrl)}`;

      gistLinkAnchor.href = gistUrl;
      flashcardLinkAnchor.href = flashcardUrl;
      resultLinksDiv.style.display = "flex";

      // Save settings after successful Gist creation
      await saveSettings(githubPatInput.value, filenameInput.value);

      status.textContent = `Export successful! Gist created.`;
    } else {
      await downloadFile(exportConfig);

      // Save settings after successful file download
      await saveSettings(githubPatInput.value, filenameInput.value);

      status.textContent = `Export successful. ${exportConfig.itemCount} items ready to save.`;
    }
  } catch (error: unknown) {
    status.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// ============================================================================
// Initialization
// ============================================================================

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Required element with id '${id}' not found in the DOM.`);
  }
  return element as T;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const btn = getElement<HTMLButtonElement>("exportBtn");
    const status = getElement<HTMLElement>("status");
    const inputType = getElement<HTMLSelectElement>("inputType");
    const outputFormat = getElement<HTMLSelectElement>("outputFormat");
    const githubPatInput = getElement<HTMLInputElement>("githubPat");
    const filenameInput = getElement<HTMLInputElement>("filename");
    const pushToGistInput = getElement<HTMLInputElement>("pushToGist");
    const resultLinksDiv = getElement<HTMLElement>("resultLinks");
    const gistLinkAnchor = getElement<HTMLAnchorElement>("gistLink");
    const flashcardLinkAnchor = getElement<HTMLAnchorElement>("flashcardLink");
    const patStatus = getElement<HTMLElement>("patStatus");
    const gistOptions = getElement<HTMLElement>("gistOptions");

    // Load saved settings
    await loadSettings(githubPatInput, filenameInput);

    // Show indicator if PAT is saved
    if (githubPatInput.value) {
      patStatus.style.display = "inline";
      githubPatInput.placeholder = "••••••••••••••••";
    }

    // Toggle gist options visibility based on checkbox
    pushToGistInput.addEventListener("change", () => {
      console.log("Checkbox changed:", pushToGistInput.checked);
      gistOptions.style.display = pushToGistInput.checked ? "block" : "none";
    });

    btn.addEventListener("click", () =>
      handleExport(
        inputType,
        outputFormat,
        status,
        githubPatInput,
        filenameInput,
        pushToGistInput,
        resultLinksDiv,
        gistLinkAnchor,
        flashcardLinkAnchor
      )
    );

    status.textContent = "Ready for export.";
  } catch (error) {
    console.error("Initialization error:", error);
    const status = document.getElementById("status");
    if (status) {
      status.textContent = "Initialization error. Check console for details.";
    }
  }
});
