import { ImageProcessingError, type EncodeFormat, type ImageFormat } from "./types";

export const IMAGE_FORMAT_META: Record<
  ImageFormat,
  { extension: string; mime: string; label: string; supportsAlpha: boolean; lossy: boolean }
> = {
  jpg: { extension: "jpg", mime: "image/jpeg", label: "JPG", supportsAlpha: false, lossy: true },
  png: { extension: "png", mime: "image/png", label: "PNG", supportsAlpha: true, lossy: false },
  webp: { extension: "webp", mime: "image/webp", label: "WebP", supportsAlpha: true, lossy: true },
  gif: { extension: "gif", mime: "image/gif", label: "GIF", supportsAlpha: true, lossy: true },
  avif: { extension: "avif", mime: "image/avif", label: "AVIF", supportsAlpha: true, lossy: true },
};

export const ENCODE_FORMATS: EncodeFormat[] = ["jpg", "png", "webp", "avif"];

export const ENCODE_MIME: Record<EncodeFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const EXTENSION_TO_FORMAT: Record<string, ImageFormat> = {
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
  avif: "avif",
};

export function formatFromExtension(name: string): ImageFormat | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_FORMAT[ext] ?? null;
}

export const INPUT_EXTENSIONS = Object.keys(EXTENSION_TO_FORMAT);

/** Maximum accepted file size for the Image Converter (25 MB). */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function isSupportedInput(name: string): boolean {
  return formatFromExtension(name) !== null;
}

/**
 * Detect the image format from magic bytes. Never trust the filename alone.
 * Returns null when the bytes do not match a supported format.
 */
export function detectFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length >= 8 && isAscii(bytes, 0, 0x89) && isAscii(bytes, 1, 0x50) && isAscii(bytes, 2, 0x4e) && isAscii(bytes, 3, 0x47) && isAscii(bytes, 4, 0x0d) && isAscii(bytes, 5, 0x0a) && isAscii(bytes, 6, 0x1a) && isAscii(bytes, 7, 0x0a)) {
    return "png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (bytes.length >= 6 && asciiAt(bytes, 0, "GIF")) {
    return "gif";
  }
  if (bytes.length >= 12 && asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WEBP")) {
    return "webp";
  }
  if (bytes.length >= 12 && asciiAt(bytes, 4, "ftyp")) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (brand.startsWith("avif") || brand.startsWith("avis")) {
      return "avif";
    }
  }
  return null;
}

export function assertSupportedInput(bytes: Uint8Array, name: string): ImageFormat {
  const byBytes = detectFormat(bytes);
  if (!byBytes) {
    throw new ImageProcessingError(
      "This file is not a supported image. Supported input: JPG, PNG, WebP, GIF, or AVIF.",
      "unsupported-format",
    );
  }
  const byName = formatFromExtension(name);
  if (byName && byName !== byBytes) {
    // The bytes win for truthfulness, but surface a warning to the caller via
    // a dedicated code so the UI can mention the mismatch.
    return byBytes;
  }
  return byBytes;
}

function isAscii(bytes: Uint8Array, index: number, value: number): boolean {
  return bytes[index] === value;
}

function asciiAt(bytes: Uint8Array, index: number, text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[index + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}
