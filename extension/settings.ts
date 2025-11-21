// ============================================================================
// Encryption/Decryption Utilities for GitHub PAT
// ============================================================================

/**
 * Derives an encryption key from a master secret using PBKDF2.
 * The master secret is generated once and stored in chrome.storage.session.
 */
async function getDerivedKey(): Promise<CryptoKey> {
  // Get or create a master secret
  const storage = await chrome.storage.session.get("masterSecret");
  let masterSecret = storage.masterSecret as string | undefined;

  if (!masterSecret) {
    // Generate a new master secret using random bytes
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    masterSecret = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await chrome.storage.session.set({ masterSecret });
  }

  // Derive a key from the master secret using PBKDF2
  const encoder = new TextEncoder();
  const salt = encoder.encode("github-pat-encryption"); // Fixed salt for consistency
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(masterSecret),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    256 // 256 bits for AES-256
  );

  return crypto.subtle.importKey("raw", derivedBits, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypts the GitHub PAT using AES-GCM.
 */
async function encryptPat(pat: string): Promise<string> {
  if (!pat) {
    return "";
  }

  const key = await getDerivedKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(pat);

  // Generate a random IV (initialization vector)
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );

  // Combine IV and encrypted data, then encode as base64
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(new Uint8Array(iv), 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode.apply(null, Array.from(combined)));
}

/**
 * Decrypts the GitHub PAT using AES-GCM.
 */
async function decryptPat(encryptedPat: string): Promise<string> {
  if (!encryptedPat) {
    return "";
  }

  try {
    const key = await getDerivedKey();
    const decoder = new TextDecoder();

    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedPat)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );

    return decoder.decode(decryptedData);
  } catch (err) {
    console.error("Failed to decrypt PAT:", err);
    throw new Error(
      "Failed to decrypt GitHub PAT. The stored token may be corrupted."
    );
  }
}

// ============================================================================
// Settings Load/Save Functions
// ============================================================================

export async function loadSettings(
  inputType: HTMLSelectElement,
  outputFormat: HTMLSelectElement,
  patInput: HTMLInputElement,
  filenameInput: HTMLInputElement,
  pushToGistInput: HTMLInputElement
): Promise<void> {
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
    try {
      const decrypted = await decryptPat(items.githubPat as string);
      patInput.value = decrypted;
    } catch (err) {
      console.error("Failed to load encrypted PAT:", err);
      patInput.value = "";
    }
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
  pushToGist: boolean,
  previousPat?: string
): Promise<void> {
  const settingsToSave: Record<string, unknown> = {
    inputType,
    outputFormat,
    defaultFilename: filename,
    pushToGist,
  };

  // Only encrypt and save the PAT if it has changed
  if (pat !== previousPat) {
    const encryptedPat = await encryptPat(pat);
    settingsToSave.githubPat = encryptedPat;
  }

  await chrome.storage.local.set(settingsToSave);
}
