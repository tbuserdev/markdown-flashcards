export async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab || !tab.id) {
    throw new Error("No active tab found");
  }

  return tab;
}

export async function injectContentScript(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["dist/contentScript.js"],
      world: "MAIN",
    });
  } catch (error) {
    console.log("Content script injection note:", error);
  }
}

export async function extractDataFromPage(
  tabId: number,
  inputFormat: InputFormat
): Promise<NotebookLM_Flashcard | NotebookLM_Quiz> {
  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: async (input: InputFormat) => {
      return await window.extractData(input);
    },
    args: [inputFormat],
    world: "MAIN",
  });

  const successResult = injectionResults.find(
    (r) => r.result && r.result.status === "ok" && r.result.data
  );

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
  return successResult.result!.data!;
}
