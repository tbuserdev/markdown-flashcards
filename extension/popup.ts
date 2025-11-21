// popup.ts
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("exportBtn") as HTMLButtonElement | null;
  const status = document.getElementById("status") as HTMLElement | null;

  if (!btn || !status) return;

  async function runScriptingInjection() {
    if (!status) return;
    status.textContent = "Sending request to all frames...";

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        status.textContent = "No active tab found.";
        return;
      }

      // 1. Injection of the content script into ALL FRAMES (world: 'MAIN')
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["dist/contentScript.js"],
        world: "MAIN",
      });

      // 2. Execution of the function in all frames.
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        func: () => {
          // Calls the function that now returns { status, data }
          return (window as any).extractAndDownloadQuiz();
        },
        world: "MAIN",
      });

      // 3. Process the results and start download
      const successResult = injectionResults.find(
        (r) => r.result && r.result.status === "ok" && r.result.data
      );
      const errorResult = injectionResults.find(
        (r) => r.result && r.result.status === "error"
      );

      if (successResult) {
        const quizData = successResult.result.data;
        const fileName = "notebooklm_quiz_export.json";

        // Download via the privileged Chrome Downloads API
        const dataUrl =
          "data:application/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(quizData, null, 2));

        // Requires the 'downloads' permission in the manifest!
        chrome.downloads.download({
          url: dataUrl,
          filename: fileName,
          saveAs: false,
        });

        status.textContent = `Export successful. ${quizData.length} questions were saved as "${fileName}".`;
      } else if (errorResult) {
        status.textContent = `Error: ${errorResult.result.error}`;
      } else {
        status.textContent = "No frame could extract the quiz data.";
      }
    } catch (e: unknown) {
      status.textContent = `General error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  btn.addEventListener("click", runScriptingInjection);

  status.textContent = "Ready for export.";
});
