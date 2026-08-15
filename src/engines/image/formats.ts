import { ImageProcessingError, type EncodeFormat, type ImageFormat, type OutputKind } from "./types";

export interface ImageFormatMeta {
  extension: string;
  mime: string;
  label: string;
  supportsAlpha: boolean;
  lossy: boolean;
  kind: OutputKind;
}

export const IMAGE_FORMAT_META: Record<ImageFormat, ImageFormatMeta> = {
  jpg: { extension: "jpg", mime: "image/jpeg", label: "JPG", supportsAlpha: false, lossy: true, kind: "raster" },
  png: { extension: "png", mime: "image/png", label: "PNG", supportsAlpha: true, lossy: false, kind: "raster" },
  webp: { extension: "webp", mime: "image/webp", label: "WebP", supportsAlpha: true, lossy: true, kind: "raster" },
  gif: { extension: "gif", mime: "image/gif", label: "GIF", supportsAlpha: true, lossy: true, kind: "raster" },
  avif: { extension: "avif", mime: "image/avif", label: "AVIF", supportsAlpha: true, lossy: true, kind: "raster" },
  heic: { extension: "heic", mime: "image/heic", label: "HEIC", supportsAlpha: true, lossy: true, kind: "raster" },
  heif: { extension: "heif", mime: "image/heif", label: "HEIF", supportsAlpha: true, lossy: true, kind: "raster" },
  psd: { extension: "psd", mime: "image/vnd.adobe.photoshop", label: "PSD", supportsAlpha: true, lossy: false, kind: "raster" },
  bmp: { extension: "bmp", mime: "image/bmp", label: "BMP", supportsAlpha: false, lossy: false, kind: "raster" },
  ico: { extension: "ico", mime: "image/x-icon", label: "ICO", supportsAlpha: true, lossy: false, kind: "raster" },
  svg: { extension: "svg", mime: "image/svg+xml", label: "SVG", supportsAlpha: true, lossy: false, kind: "vector" },
};

export const ENCODE_FORMATS: EncodeFormat[] = ["jpg", "png", "webp", "avif"];

export const ENCODE_MIME: Record<EncodeFormat, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export const INPUT_EXTENSIONS: string[] = [
  "jpg", "jpeg", "png", "webp", "gif", "avif",
  "heic", "heif", "psd", "bmp", "ico", "svg",
];

const EXTENSION_TO_FORMAT: Record<string, ImageFormat> = {
  jpg: "jpg",
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
  avif: "avif",
  heic: "heic",
  heif: "heif",
  psd: "psd",
  bmp: "bmp",
  ico: "ico",
  svg: "svg",
};

export function formatFromExtension(name: string): ImageFormat | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TO_FORMAT[ext] ?? null;
}

/** Maximum accepted file size for the Image Converter (25 MB). */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function isSupportedInput(name: string): boolean {
  return formatFromExtension(name) !== null;
}

export function isVectorFormat(format: ImageFormat | EncodeFormat): boolean {
  return IMAGE_FORMAT_META[format as ImageFormat]?.kind === "vector";
}

const HEIF_BRANDS = new Set([
  "heic", "heix", "hevc", "hevx", "heim", "heis", "hevm", "hevs",
  "mif1", "msf1",
]);

/**
 * Detect the image format from magic bytes. Never trust the filename alone.
 * Returns null when the bytes do not match a supported format.
 */
export function detectFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
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
  if (bytes.length >= 8 && asciiAt(bytes, 0, "8BPS")) {
    return "psd";
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return "bmp";
  }
  if (bytes.length >= 6 && bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00) {
    return "ico";
  }
  if (bytes.length >= 12 && asciiAt(bytes, 4, "ftyp")) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
    if (brand.startsWith("avif") || brand.startsWith("avis")) {
      return "avif";
    }
    if (HEIF_BRANDS.has(brand)) {
      return "heic";
    }
  }
  if (detectSvg(bytes)) {
    return "svg";
  }
  return null;
}

/**
 * SVG files are text, so they have no fixed binary magic. Look for an `<svg`
 * root within the leading bytes (allowing an XML declaration or a DOCTYPE).
 */
function detectSvg(bytes: Uint8Array): boolean {
  const probeLength = Math.min(bytes.length, 2048);
  const prefix = String.fromCharCode(...bytes.subarray(0, probeLength)).toLowerCase();
  const normalized = prefix.replace(/\ufeff/g, "");
  return normalized.includes("<svg");
}

export function assertSupportedInput(bytes: Uint8Array, name: string): ImageFormat {
  const byBytes = detectFormat(bytes);
  if (!byBytes) {
    throw new ImageProcessingError(
      "This file is not a supported image. Supported input: JPG, PNG, WebP, GIF, AVIF, HEIC, HEIF, PSD, BMP, ICO, or SVG.",
      "unsupported-format",
    );
  }
  const byName = formatFromExtension(name);
  if (byName && byName !== byBytes) {
    // The bytes win for truthfulness; callers can surface a warning about the
    // mismatch between the filename extension and the real content.
    return byBytes;
  }
  return byBytes;
}

function asciiAt(bytes: Uint8Array, index: number, text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (bytes[index + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}
