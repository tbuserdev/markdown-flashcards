export async function transformUrl(url: string): Promise<string> {
  if (
    url.includes("gist.github.com") &&
    !url.includes("gist.githubusercontent.com")
  ) {
    const parts = url.split("/");
    const gistId = parts[parts.length - 1].split("#")[0];

    try {
      const apiResponse = await fetch(`https://api.github.com/gists/${gistId}`);
      if (apiResponse.ok) {
        const gistData = await apiResponse.json();
        interface GistFile {
          filename: string;
          raw_url: string;
        }
        const files: GistFile[] = Object.values(gistData.files);
        const mdFile =
          files.find((f: GistFile) => f.filename.endsWith(".md")) || files[0];
        if (mdFile && mdFile.raw_url) {
          return mdFile.raw_url;
        }
      }
    } catch (error) {
      console.warn(
        "Could not fetch gist API, falling back to default raw URL:",
        error,
      );
    }

    const username = parts[3];
    return `https://gist.githubusercontent.com/${username}/${gistId}/raw/`;
  }
  if (
    url.includes("github.com") &&
    !url.includes("raw.githubusercontent.com") &&
    !url.includes("gist.github.com")
  ) {
    return url
      .replace("github.com", "raw.githubusercontent.com")
      .replace("/blob/", "/");
  }
  if (url.includes("gitlab.com") && !url.includes("raw")) {
    return url.replace("/-/blob/", "/-/raw/");
  }
  if (
    url.includes("1drv.ms") ||
    (url.includes("onedrive.live.com") && !url.includes("download.aspx"))
  ) {
    const base64Url = btoa(url)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    return `https://api.onedrive.com/v1.0/shares/u!${base64Url}/root/content`;
  }
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/(?:file|document)\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://docs.google.com/document/d/${fileId}/export?format=txt`;
    }
  }
  return url;
}

export function handleShareClick() {
  const lastSourceUrl = localStorage.getItem("lastSourceUrl");
  if (!lastSourceUrl) {
    alert("No source URL to share. Load a deck from a URL first.");
    return;
  }
  const shareUrl = generateShareUrl(lastSourceUrl);
  copyToClipboard(shareUrl);
}

function generateShareUrl(sourceUrl: string): string {
  const url = new URL(location.href);
  url.searchParams.set("preload", sourceUrl);
  return url.href;
}

function copyToClipboard(text: string) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Shareable URL copied to clipboard!"))
      .catch((err) => {
        console.error("Failed to copy with navigator.clipboard:", err);
        prompt(
          "Could not copy automatically. Please copy this URL manually:",
          text,
        );
      });
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        alert("Shareable URL copied to clipboard!");
      } else {
        prompt("Fallback copy failed. Please copy this URL manually:", text);
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
      prompt(
        "Could not copy automatically. Please copy this URL manually:",
        text,
      );
    }
    document.body.removeChild(textArea);
  }
}
