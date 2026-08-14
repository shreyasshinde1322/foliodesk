import { IMAGE_FORMAT_META } from "./formats";
import type { EncodeFormat } from "./types";

/** Remove the final extension from a filename, keeping the rest intact. */
export function stripExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index > 0 ? name.slice(0, index) : name;
}

/**
 * Sanitize a filename component for safe local storage and ZIP paths.
 * Preserves Unicode letters and digits (so "screenshot 画像.png" keeps its
 * meaning) while removing path separators, control characters, and reserved
 * filesystem characters. Never empty: falls back to "image".
 */
export function sanitizeFileComponent(name: string): string {
  let out = "";
  for (const ch of name) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 32 || code === 127) continue;
    if (ch === "/" || ch === "\\" || ch === ":" || ch === "*" || ch === "?" || ch === '"' || ch === "<" || ch === ">" || ch === "|") {
      out += "-";
    } else {
      out += ch;
    }
  }
  out = out.replace(/\s+/g, " ").trim();
  out = out.replace(/\.{2,}/g, ".");
  out = out.replace(/^\.+/, "");
  out = out.replace(/[. ]+$/g, "");
  return out || "image";
}

/** Build the converted output filename: `<base>.<extension>`. */
export function buildOutputName(originalName: string, format: EncodeFormat): string {
  const index = originalName.lastIndexOf(".");
  const stem = index > 0 ? originalName.slice(0, index) : index === 0 ? "" : originalName;
  const base = sanitizeFileComponent(stem);
  return `${base}.${IMAGE_FORMAT_META[format].extension}`;
}

/** Ensure two output names never collide inside a batch download. */
export function dedupeNames(names: string[]): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = seen.get(name) ?? 0;
    seen.set(name, count + 1);
    if (count === 0) return name;
    const index = name.lastIndexOf(".");
    const stem = index > 0 ? name.slice(0, index) : name;
    const ext = index > 0 ? name.slice(index) : "";
    return `${stem}-${count + 1}${ext}`;
  });
}
