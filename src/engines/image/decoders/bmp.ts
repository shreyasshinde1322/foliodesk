import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";

const SUPPORTED_DIB = 40;

function readU16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function readI32(bytes: Uint8Array, offset: number): number {
  const value = readU32(bytes, offset);
  return value > 0x7fffffff ? value - 0x100000000 : value;
}

/**
 * Pure, dependency-free BMP decoder. Supports 24-bit and 32-bit uncompressed
 * (BI_RGB) BITMAPINFOHEADER files — the overwhelmingly common case. Other
 * variants are rejected with a clear message instead of being guessed at.
 */
export function decodeBmp(bytes: Uint8Array): DecodedBitmap {
  if (bytes.length < 54) {
    throw new ImageProcessingError("The BMP file is too small to be valid.", "decode-failed");
  }
  const offset = readU32(bytes, 10);
  const dibSize = readU32(bytes, 14);
  if (dibSize < SUPPORTED_DIB) {
    throw new ImageProcessingError(
      "This BMP uses an older header that is not supported. Use 24-bit or 32-bit BMP.",
      "unsupported-variant",
    );
  }
  const width = readI32(bytes, 18);
  const rawHeight = readI32(bytes, 22);
  const bitCount = readU16(bytes, 28);
  const compression = readU32(bytes, 30);
  if (width <= 0 || rawHeight === 0) {
    throw new ImageProcessingError("The BMP has invalid dimensions.", "decode-failed");
  }
  if (compression !== 0) {
    throw new ImageProcessingError(
      "Compressed BMP files are not supported yet. Save the BMP as uncompressed 24-bit or 32-bit.",
      "unsupported-variant",
    );
  }
  if (bitCount !== 24 && bitCount !== 32) {
    throw new ImageProcessingError(
      `BMP with ${bitCount}-bit color is not supported. Use 24-bit or 32-bit BMP.`,
      "unsupported-variant",
    );
  }

  const topDown = rawHeight < 0;
  const height = Math.abs(rawHeight);
  const bytesPerPixel = bitCount / 8;
  const paddedRow = Math.ceil((width * bytesPerPixel) / 4) * 4;
  if (offset + paddedRow * height > bytes.length) {
    throw new ImageProcessingError("The BMP pixel data is truncated.", "decode-failed");
  }

  const data = new Uint8ClampedArray(width * height * 4);
  let alphaSeen = false;

  for (let y = 0; y < height; y += 1) {
    const sourceRow = topDown ? y : height - 1 - y;
    const rowStart = offset + sourceRow * paddedRow;
    for (let x = 0; x < width; x += 1) {
      const si = rowStart + x * bytesPerPixel;
      const di = (y * width + x) * 4;
      data[di] = bytes[si + 2];
      data[di + 1] = bytes[si + 1];
      data[di + 2] = bytes[si];
      const alpha = bitCount === 32 ? bytes[si + 3] : 255;
      if (alpha !== 0) alphaSeen = true;
      data[di + 3] = alpha;
    }
  }

  // Many 32-bit BMP writers store 0 in the alpha byte while meaning "opaque".
  // If no pixel has any alpha at all, treat the image as fully opaque.
  if (!alphaSeen) {
    for (let i = 3; i < data.length; i += 4) data[i] = 255;
  }

  return { width, height, data };
}
