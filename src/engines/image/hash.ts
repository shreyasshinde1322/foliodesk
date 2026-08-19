/**
 * Client-side content hashing for duplicate detection. Uses the Web Crypto
 * SHA-256 when available (browsers and modern Node); otherwise falls back to a
 * deterministic FNV-1a hash so the feature still works in every environment.
 */
export async function hashBytes(bytes: Uint8Array): Promise<string> {
  if (typeof crypto !== "undefined" && typeof crypto.subtle?.digest === "function") {
    try {
      const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
      return hexFromBuffer(digest);
    } catch {
      return fnv1aHash(bytes);
    }
  }
  return fnv1aHash(bytes);
}

export async function hashFile(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return hashBytes(bytes);
}

function hexFromBuffer(buffer: ArrayBuffer): string {
  const view = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < view.length; i += 1) {
    out += view[i].toString(16).padStart(2, "0");
  }
  return out;
}

function fnv1aHash(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv-${hash.toString(16).padStart(8, "0")}`;
}
