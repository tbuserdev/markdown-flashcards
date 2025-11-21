/**
 * Waits for an element to appear in the DOM
 * @param {string} selector - CSS selector for the element
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Element|null>} The element or null if timeout
 */
function waitForElement(
  selector: string,
  timeout: number = 5000
): Promise<Element | null> {
  return new Promise((resolve) => {
    // Check if element already exists
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    // Set up a MutationObserver to watch for the element
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

    // Set timeout
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Searches for the quiz JSON in the data-app-data attribute,
 * decodes it and starts the download as a JSON file.
 */
async function extractAndDownloadQuiz(): Promise<{
  status: string;
  data?: any;
  error?: string;
}> {
  // Wait for app-root to be available (with retry logic)
  const appRoot = await waitForElement("app-root", 10000);

  // Check if the element exists
  if (!appRoot) {
    // No alert, just return so that other frames can try
    return { status: "error", error: "app-root not found" };
  }

  const rawData = appRoot.getAttribute("data-app-data");

  if (!rawData) {
    return {
      status: "error",
      error: 'Attribute "data-app-data" not present',
    };
  }

  // 1. Cleaning: convert &quot; to " (important for JSON.parse)
  const cleanJsonString = rawData.replace(/&quot;/g, '"');

  // 2. Parse the string into a JavaScript object
  let data: any;
  try {
    data = JSON.parse(cleanJsonString);
  } catch (e) {
    console.error("Error parsing the JSON:", e);
    return { status: "error", error: "JSON parse error" };
  }

  // 3. Extract the quiz array
  const quizData = data.quiz;
  if (!quizData || quizData.length === 0) {
    return { status: "error", error: "No quiz questions found" };
  }

  console.log("--- Extracted Quiz Data (JSON Content) ---");
  console.log(quizData);
  console.log("------------------------------------------");

  return { status: "ok", data: quizData };
}

// Expose to window so it can be called by popup.js via executeScript
(window as any).extractAndDownloadQuiz = extractAndDownloadQuiz;
