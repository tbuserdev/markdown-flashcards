export async function createGist(
  content: string,
  filename: string,
  token: string
): Promise<string> {
  try {
    const response = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: "NotebookLM Flashcard Export",
        public: false,
        files: {
          [filename]: {
            content: content,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `GitHub API Error: ${response.statusText} - ${errorText}`
      );
    }

    let data;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        data = await response.json();
      } catch (err) {
        throw new Error(`Failed to parse GitHub API response as JSON: ${err}`);
      }
    } else {
      const text = await response.text();
      throw new Error(
        `Unexpected content-type from GitHub API: ${contentType}. Response: ${text}`
      );
    }
    return data.html_url;
  } catch (err: unknown) {
    if (err instanceof TypeError) {
      throw new Error(
        "Network error: Please check your internet connection and try again."
      );
    }
    throw err;
  }
}
