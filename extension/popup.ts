// ============================================================================
// Type Definitions
// ============================================================================

interface ExportConfig {
  fileName: string;
  mimeType: string;
  content: string;
}

// ============================================================================
// Data Extraction and Injection
// ============================================================================

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab || !tab.id) {
    throw new Error("No active tab found");
  }

  return tab;
}

async function injectContentScript(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["dist/contentScript.js"],
      world: "MAIN",
    });
  } catch (error) {
    // Content script might already be injected via manifest, which is fine
    console.log("Content script injection note:", error);
  }
}

async function extractDataFromPage(
  tabId: number,
  inputFormat: InputFormat
): Promise<NotebookLM_Flashcard | NotebookLM_Quiz> {
  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: async (input: InputFormat) => {
      // Call the async extractData function and await it
      return await window.extractData(input);
    },
    args: [inputFormat],
    world: "MAIN",
  });

  console.log("Injection results:", injectionResults);

  const successResult = injectionResults.find(
    (r) => r.result && r.result.status === "ok" && r.result.data
  );

  // Filter out frames that simply don't have app-root
  const meaningfulErrors = injectionResults.filter(
    (r) =>
      r.result &&
      r.result.status === "error" &&
      r.result.error !== "Frame does not contain app-root"
  );

  if (meaningfulErrors.length > 0 && !successResult) {
    const errorResult = meaningfulErrors[0];
    console.error(
      "Error result details:",
      JSON.stringify(errorResult.result, null, 2)
    );
    console.error("Full error result:", errorResult);
    throw new Error(errorResult.result!.error || "Unknown extraction error");
  }

  if (!successResult) {
    console.error("No successful frame found. All results:", injectionResults);
    throw new Error(
      "No frame could extract the data. Make sure you're on a NotebookLM flashcard or quiz page."
    );
  }

  console.log("Success result:", successResult);
  return successResult.result!.data!;
}

// ============================================================================
// Data Formatting
// ============================================================================

function formatQuizAsMarkdown(quizData: Quiz[]): string {
  return quizData
    .map((q) => {
      const front = `**${q.question}**\n\n${q.answerOptions
        .map((option, index) => `${index + 1}. ${option.text}`)
        .join("\n")}`;

      const correctIndex = q.answerOptions.findIndex((o) => o.isCorrect);
      const correct = q.answerOptions[correctIndex];
      const back = correct
        ? `${correctIndex + 1}. ${correct.text}\n\n${correct.rationale}`
        : "No correct answer";

      return `${front}\n---\n${back}`;
    })
    .join("\n\n\n");
}

function formatFlashcardsAsMarkdown(flashcardData: Flashcard[]): string {
  return flashcardData.map((f) => `${f.f}\n---\n${f.b}`).join("\n\n\n");
}

function prepareQuizExport(
  quizData: Quiz[],
  outputFormat: ExportFormat
): ExportConfig {
  if (outputFormat === "raw-json") {
    return {
      fileName: "notebooklm_quiz_export.json",
      mimeType: "application/json",
      content: JSON.stringify(quizData, null, 2),
    };
  } else {
    return {
      fileName: "notebooklm_quiz_export.md",
      mimeType: "text/markdown",
      content: formatQuizAsMarkdown(quizData),
    };
  }
}

function prepareFlashcardExport(
  flashcardData: Flashcard[],
  outputFormat: ExportFormat
): ExportConfig {
  if (outputFormat === "raw-json") {
    return {
      fileName: "notebooklm_flashcards_export.json",
      mimeType: "application/json",
      content: JSON.stringify(flashcardData, null, 2),
    };
  } else {
    return {
      fileName: "notebooklm_flashcards_export.md",
      mimeType: "text/markdown",
      content: formatFlashcardsAsMarkdown(flashcardData),
    };
  }
}

function prepareExport(
  data: NotebookLM_Flashcard | NotebookLM_Quiz,
  outputFormat: ExportFormat,
  customFilename?: string
): ExportConfig & { itemCount: number } {
  let config: ExportConfig;
  let itemCount: number;

  if ("quiz" in data) {
    const quizData = (data as NotebookLM_Quiz).quiz;
    config = prepareQuizExport(quizData, outputFormat);
    itemCount = quizData.length;
  } else if ("flashcards" in data) {
    const flashcardData = (data as NotebookLM_Flashcard).flashcards;
    config = prepareFlashcardExport(flashcardData, outputFormat);
    itemCount = flashcardData.length;
  } else {
    throw new Error("Unknown data format");
  }

  if (customFilename) {
      // If it doesn't have an extension, add one based on output format
      if (!customFilename.includes(".")) {
          if (outputFormat === "raw-json") {
              customFilename += ".json";
          } else {
              customFilename += ".md";
          }
      }
      config.fileName = customFilename;
  }

  return { ...config, itemCount };
}

// ============================================================================
// GitHub Gist Export
// ============================================================================

async function createGist(
  content: string,
  filename: string,
  token: string
): Promise<string> {
  const response = await fetch("https://api.github.com/gists", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: "NotebookLM Flashcard Export",
      public: true, // or false if you prefer secret gists
      files: {
        [filename]: {
          content: content,
        },
      },
    }),
  });

  if (!response.ok) {
    let errorMessage = `GitHub API Error: ${response.status} ${response.statusText}`;
    let errorDetails = "";
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.message) {
        errorDetails = errorJson.message;
      }
    } catch {
      // Fallback to text if JSON parsing fails
      errorDetails = await response.text();
    }
    if (response.status === 401) {
      errorMessage = "Invalid GitHub token. Please check your credentials.";
    } else if (response.status === 403) {
      errorMessage = "Rate limit exceeded or insufficient permissions for GitHub API.";
    }
    throw new Error(`${errorMessage}${errorDetails ? " - " + errorDetails : ""}`);
  }

  const data = await response.json();
  return data.html_url;
}

// ============================================================================
// File Download
// ============================================================================

async function downloadFile(config: ExportConfig) {
  const blob = new Blob([config.content], { type: config.mimeType });
  const blobUrl = URL.createObjectURL(blob);

  // Return the promise so we can await it
  try {
    await chrome.downloads.download({
      url: blobUrl,
      filename: config.fileName,
      saveAs: true, // This forces the "Save As" dialog
    });
  } catch (err) {
    console.error("Download failed", err);
    throw err;
  } finally {
    // Optional: clean up the blob URL to prevent memory leaks
    // setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }
}

// ============================================================================
// Settings Management
// ============================================================================

async function loadSettings(
  patInput: HTMLInputElement,
  filenameInput: HTMLInputElement
) {
  const items = await chrome.storage.sync.get(["githubPat", "defaultFilename"]);
  if (items.githubPat) {
    patInput.value = items.githubPat as string;
  }
  if (items.defaultFilename) {
    filenameInput.value = items.defaultFilename as string;
  }
}

async function saveSettings(pat: string, filename: string) {
  await chrome.storage.sync.set({
    githubPat: pat,
    defaultFilename: filename,
  });
}

// ============================================================================
// Main Export Logic
// ============================================================================

async function handleExport(
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

    // Save settings
    await saveSettings(githubPatInput.value, filenameInput.value);

    if (pushToGistInput.checked) {
      const token = githubPatInput.value.trim();
      if (!token) {
        throw new Error("GitHub Personal Access Token is required to export to Gist. Please enter your PAT in the field above or uncheck 'Push to GitHub Gist' to download locally.");
      }

      status.textContent = "Creating Gist...";
      const gistUrl = await createGist(exportConfig.content, exportConfig.fileName, token);

      const flashcardBaseUrl = "https://tbuserdev.github.io/markdown-flashcards/";
      const flashcardUrl = `${flashcardBaseUrl}?preload=${encodeURIComponent(gistUrl)}`;

      gistLinkAnchor.href = gistUrl;
      flashcardLinkAnchor.href = flashcardUrl;
      resultLinksDiv.style.display = "flex";

      status.textContent = `Export successful! Gist created.`;
    } else {
      downloadFile(exportConfig);
      status.textContent = `Export successful. ${exportConfig.itemCount} items ready to save.`;
    }

  } catch (error: unknown) {
    status.textContent = `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("exportBtn") as HTMLButtonElement | null;
  const status = document.getElementById("status") as HTMLElement | null;
  const inputType = document.getElementById(
    "inputType"
  ) as HTMLSelectElement | null;
  const outputFormat = document.getElementById(
    "outputFormat"
  ) as HTMLSelectElement | null;

  const githubPatInput = document.getElementById("githubPat") as HTMLInputElement | null;
  const filenameInput = document.getElementById("filename") as HTMLInputElement | null;
  const pushToGistInput = document.getElementById("pushToGist") as HTMLInputElement | null;
  const resultLinksDiv = document.getElementById("resultLinks") as HTMLElement | null;
  const gistLinkAnchor = document.getElementById("gistLink") as HTMLAnchorElement | null;
  const flashcardLinkAnchor = document.getElementById("flashcardLink") as HTMLAnchorElement | null;


  if (!btn || !status || !inputType || !outputFormat || !githubPatInput || !filenameInput || !pushToGistInput || !resultLinksDiv || !gistLinkAnchor || !flashcardLinkAnchor) {
    console.error("One or more required elements are missing in the popup.");
    return;
  }

  // Load saved settings
  await loadSettings(githubPatInput, filenameInput);

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
});
