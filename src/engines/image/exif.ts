import type { ImageFormat } from "./types";

/** Camera-orientation tag (0x0112) values 1–8 as rendered by browsers. */
export const EXIF_ORIENTATION_LABELS: Record<number, string> = {
  1: "Normal",
  2: "Mirrored horizontally",
  3: "Rotated 180°",
  4: "Mirrored vertically",
  5: "Mirrored + rotated 90° CW",
  6: "Rotated 90° CW",
  7: "Mirrored + rotated 90° CCW",
  8: "Rotated 90° CCW",
};

export interface ImageMetadataReport {
  orientation: number;
  orientationLabel: string;
  metadataDetected: boolean;
}

const CHUNK_NAMES_WITH_METADATA = new Set(["tEXt", "zTXt", "iTXt", "eXIf"]);

/**
 * Inspect raw file bytes for metadata that would be silently stripped during
 * re-encoding. `orientation` is read from the JPEG EXIF APP1 segment (values
 * 1–8, default 1); `metadataDetected` is true when EXIF/ICC/PNG text chunks are
 * present. Non-JPEG inputs report orientation 1 ("Normal").
 *
 * The report is informational: the browser decode path already bakes EXIF
 * orientation into the pixels and our encoders never emit metadata, so the
 * output is always correctly oriented and metadata-free.
 */
export function inspectImageBytes(
  bytes: Uint8Array,
  sourceFormat: ImageFormat,
): ImageMetadataReport {
  if (sourceFormat === "jpg") {
    const parsed = readJpegExif(bytes);
    return {
      orientation: parsed.orientation,
      orientationLabel: EXIF_ORIENTATION_LABELS[parsed.orientation] ?? "Unknown",
      metadataDetected: parsed.hasMetadata,
    };
  }

  if (sourceFormat === "png") {
    return {
      orientation: 1,
      orientationLabel: EXIF_ORIENTATION_LABELS[1] ?? "Normal",
      metadataDetected: hasPngMetadata(bytes),
    };
  }

  return {
    orientation: 1,
    orientationLabel: EXIF_ORIENTATION_LABELS[1] ?? "Normal",
    metadataDetected: false,
  };
}

interface JpegExifResult {
  orientation: number;
  hasMetadata: boolean;
}

/**
 * Scan JPEG markers for an Exif APP1 segment and read the Orientation tag from
 * IFD0. Bounds-checked so malformed files never throw.
 */
export function readJpegExif(bytes: Uint8Array): JpegExifResult {
  const result: JpegExifResult = { orientation: 1, hasMetadata: false };

  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    return result;
  }

  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (offset + 4 > bytes.length) break;
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (length < 2) break;

    const segmentStart = offset + 2;
    const segmentLength = length;
    if (segmentStart + segmentLength > bytes.length) break;

    if (marker === 0xe1) {
      result.hasMetadata = true;
      const exif = readExifSegment(bytes, segmentStart + 2, segmentLength - 2);
      if (exif !== 0) result.orientation = exif;
    }

    offset = segmentStart + segmentLength;
  }

  return result;
}

/** Parse a TIFF IFD0 block inside an Exif segment, returning the orientation. */
function readExifSegment(bytes: Uint8Array, start: number, length: number): number {
  // Expected prefix: "Exif\0\0"
  if (length < 12 || bytes[start] !== 0x45 || bytes[start + 1] !== 0x78) return 0;

  const tiff = start + 6;
  const remaining = length - 6;
  if (remaining < 8) return 0;

  const littleEndian =
    bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49 ? true : bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d ? false : null;
  if (littleEndian === null) return 0;
  if (bytes[tiff + 2] !== 0x2a || bytes[tiff + 3] !== 0x00) return 0;

  const u16 = (o: number): number =>
    littleEndian ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1];
  const u32 = (o: number): number =>
    littleEndian
      ? bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)
      : (bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3];

  const ifd0 = u32(tiff + 4);
  if (ifd0 + 2 > remaining - 4) return 0;

  const count = u16(tiff + ifd0);
  if (count > 64) return 0;

  for (let i = 0; i < count; i += 1) {
    const entry = tiff + ifd0 + 2 + i * 12;
    if (entry + 12 > tiff + remaining) return 0;
    const tag = u16(entry);
    if (tag === 0x0112) {
      const type = u16(entry + 2);
      if (type === 3) return u16(entry + 8);
      return 0;
    }
  }

  return 0;
}

/** Detect ancillary PNG chunks that commonly carry metadata. */
export function hasPngMetadata(bytes: Uint8Array): boolean {
  if (bytes.length < 8 || !(bytes[0] === 0x89) || bytes[1] !== 0x50) return false;

  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    if (CHUNK_NAMES_WITH_METADATA.has(type)) return true;
    offset += 12 + length;
  }
  return false;
}
