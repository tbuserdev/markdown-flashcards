export async function loadSettings(
  patInput: HTMLInputElement,
  filenameInput: HTMLInputElement
): Promise<void> {
  // Using local storage instead of sync for sensitive data like PAT
  const items = await chrome.storage.local.get([
    "githubPat",
    "defaultFilename",
  ]);
  if (items.githubPat) {
    patInput.value = items.githubPat as string;
  }
  if (items.defaultFilename) {
    filenameInput.value = items.defaultFilename as string;
  }
}

export async function saveSettings(
  pat: string,
  filename: string
): Promise<void> {
  // Using local storage instead of sync for sensitive data like PAT
  await chrome.storage.local.set({
    githubPat: pat,
    defaultFilename: filename,
  });
}
