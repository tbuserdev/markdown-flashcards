export async function downloadFile(config: ExportConfig): Promise<void> {
  const blob = new Blob([config.content], { type: config.mimeType });
  const blobUrl = URL.createObjectURL(blob);

  try {
    await chrome.downloads.download({
      url: blobUrl,
      filename: config.fileName,
      saveAs: true,
    });
  } catch (err) {
    console.error("Download failed", err);
    throw err;
  } finally {
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }
}
