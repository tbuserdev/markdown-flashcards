let toggleImporterBtn: HTMLButtonElement;
let importerContainer: HTMLElement;

export function initImporter() {
    toggleImporterBtn = document.getElementById("toggle-importer-btn") as HTMLButtonElement;
    importerContainer = document.getElementById("importer-container") as HTMLElement;
}

export function toggleImporter() {
  importerContainer.classList.toggle("hidden");
  toggleImporterBtn.textContent = importerContainer.classList.contains(
    "hidden"
  )
    ? "Open Importer"
    : "Close Importer";
}
