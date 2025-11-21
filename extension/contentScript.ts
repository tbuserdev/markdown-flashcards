// ============================================================================
// Type Definitions
// ============================================================================

interface ExtractionResult {
  status: "ok" | "error";
  data?: NotebookLM_Flashcard | NotebookLM_Quiz;
  error?: string;
}

// ============================================================================
// DOM Utilities
// ============================================================================

/**
 * Waits for an element to appear in the DOM
 */
function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((_mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

// ============================================================================
// Data Extraction
// ============================================================================

/**
 * Gets the app-root element and extracts its data attribute
 */
async function getAppRootData(): Promise<string> {
  // First try to find it immediately
  let appRoot = document.querySelector("app-root");

  // If not found, wait for it
  if (!appRoot) {
    appRoot = await waitForElement("app-root", 5000);
  }

  if (!appRoot) {
    // Debug: Log what we can see
    console.log("Document URL:", document.location.href);
    console.log("Document body exists:", !!document.body);
    console.log("Document title:", document.title);
    throw new Error("app-root not found");
  }

  const rawData = appRoot.getAttribute("data-app-data");

  if (!rawData) {
    throw new Error('Attribute "data-app-data" not present');
  }

  return rawData;
}

/**
 * Cleans and parses the raw JSON string from the data attribute
 */
function parseAppData(rawData: string): NotebookLM_Flashcard | NotebookLM_Quiz {
  const cleanJsonString = rawData.replace(/&quot;/g, '"');

  try {
    return JSON.parse(cleanJsonString);
  } catch (e) {
    console.error("Error parsing the JSON:", e);
    throw new Error("JSON parse error");
  }
}

/**
 * Extracts quiz data from parsed app data
 */
function extractQuizData(
  data: NotebookLM_Flashcard | NotebookLM_Quiz
): NotebookLM_Quiz {
  const quizData = (data as NotebookLM_Quiz).quiz;

  if (!quizData || quizData.length === 0) {
    throw new Error("No quiz questions found");
  }

  console.log("--- Extracted Quiz Data (JSON Content) ---");
  console.log(quizData);
  console.log("------------------------------------------");

  return { quiz: quizData };
}

/**
 * Extracts flashcard data from parsed app data
 */
function extractFlashcardData(
  data: NotebookLM_Flashcard | NotebookLM_Quiz
): NotebookLM_Flashcard {
  const flashcardData = (data as NotebookLM_Flashcard).flashcards;

  if (!flashcardData || flashcardData.length === 0) {
    throw new Error("No flashcards found");
  }

  console.log("--- Extracted Flashcard Data (JSON Content) ---");
  console.log(flashcardData);
  console.log("------------------------------------------");

  return { flashcards: flashcardData };
}

// ============================================================================
// Main Extraction Function
// ============================================================================

/**
 * Main function to extract quiz or flashcard data from NotebookLM page
 */
async function extractData(exportType: InputFormat): Promise<ExtractionResult> {
  try {
    // Quick check: if app-root doesn't exist immediately, skip this frame
    if (!document.querySelector("app-root")) {
      // Return a neutral status that won't be treated as success or failure
      return {
        status: "error",
        error: "Frame does not contain app-root",
      };
    }

    const rawData = await getAppRootData();
    const parsedData = parseAppData(rawData);

    let extractedData: NotebookLM_Flashcard | NotebookLM_Quiz;

    if (exportType === "quiz") {
      extractedData = extractQuizData(parsedData);
    } else if (exportType === "flashcard") {
      extractedData = extractFlashcardData(parsedData);
    } else {
      throw new Error("Invalid export type");
    }

    return { status: "ok", data: extractedData };
  } catch (error: unknown) {
    return {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============================================================================
// Window API
// ============================================================================

window.extractData = extractData;
