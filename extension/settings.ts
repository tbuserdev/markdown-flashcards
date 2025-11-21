export async function loadSettings(
  inputType: HTMLSelectElement,
  outputFormat: HTMLSelectElement,
  patInput: HTMLInputElement,
  filenameInput: HTMLInputElement,
  pushToGistInput: HTMLInputElement
): Promise<void> {
  // Using local storage instead of sync for sensitive data like PAT
  const items = await chrome.storage.local.get([
    "inputType",
    "outputFormat",
    "githubPat",
    "defaultFilename",
    "pushToGist",
  ]);
  if (items.inputType) {
    inputType.value = items.inputType as string;
  }
  if (items.outputFormat) {
    outputFormat.value = items.outputFormat as string;
  }
  if (items.githubPat) {
    patInput.value = items.githubPat as string;
  }
  if (items.defaultFilename) {
    filenameInput.value = items.defaultFilename as string;
  }
  if (typeof items.pushToGist === "boolean") {
    pushToGistInput.checked = items.pushToGist;
  }
}

export async function saveSettings(
  inputType: string,
  outputFormat: string,
  pat: string,
  filename: string,
  pushToGist: boolean
): Promise<void> {
  // Using local storage instead of sync for sensitive data like PAT
  await chrome.storage.local.set({
    inputType,
    outputFormat,
    githubPat: pat,
    defaultFilename: filename,
    pushToGist,
  });
}
