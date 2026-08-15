import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";

export interface IcoEntry {
  index: number;
  width: number;
  height: number;
  offset: number;
  byteLength: number;
  bitCount: number;
  isPng: boolean;
}

function readU16(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readU32(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
}

function isPng(bytes: Uint8Array, offset: number): boolean {
  return (
    bytes.length >= offset + 8 &&
    bytes[offset] === 0x89 &&
    bytes[offset + 1] === 0x50 &&
    bytes[offset + 2] === 0x4e &&
    bytes[offset + 3] === 0x47
  );
}

/**
 * List the images embedded in an ICO/CUR container and pick the largest one.
 * Returns null when the container is malformed or has no entries.
 */
export function pickBestIcoEntry(bytes: Uint8Array): IcoEntry | null {
  if (bytes.length < 6 || readU16(bytes, 0) !== 0 || readU16(bytes, 2) !== 1) {
    return null;
  }
  const count = readU16(bytes, 4);
  if (count === 0 || bytes.length < 6 + count * 16) return null;

  let best: IcoEntry | null = null;
  let bestArea = -1;
  for (let i = 0; i < count; i += 1) {
    const base = 6 + i * 16;
    const width = bytes[base] === 0 ? 256 : bytes[base];
    const height = bytes[base + 1] === 0 ? 256 : bytes[base + 1];
    const byteLength = readU32(bytes, base + 8);
    const offset = readU32(bytes, base + 12);
    if (byteLength === 0 || offset + byteLength > bytes.length) continue;
    const area = width * height;
    if (area > bestArea) {
      bestArea = area;
      best = {
        index: i,
        width,
        height,
        offset,
        byteLength,
        bitCount: readU16(bytes, base + 6),
        isPng: isPng(bytes, offset),
      };
    }
  }
  return best;
}

/**
 * Decode a BMP-format ICO entry (24-bit or 32-bit) into RGBA. Returns null
 * when the entry is PNG or uses an unsupported DIB layout, so callers can fall
 * back to the browser's native ICO decoding for those cases.
 */
export function decodeIcoBitmap(bytes: Uint8Array, entry: IcoEntry): DecodedBitmap | null {
  if (entry.isPng || entry.bitCount > 32 || entry.bitCount === 0) return null;
  const base = entry.offset;
  const size = readU32(bytes, base);
  if (size < 40) return null;
  const width = readU32(bytes, base + 4);
  const rawHeight = readU32(bytes, base + 8);
  const bitCount = readU16(bytes, base + 14);
  const compression = readU32(bytes, base + 16);
  if (width <= 0 || rawHeight === 0 || width > 2048) return null;
  if (compression !== 0) return null;
  if (bitCount !== 24 && bitCount !== 32) return null;

  // ICO DIBs store twice the true height: XOR bitmap + AND mask.
  const height = rawHeight / 2;
  const bytesPerPixel = bitCount / 8;
  const xorRow = Math.ceil((width * bytesPerPixel) / 4) * 4;
  const andRow = Math.ceil(width / 32) * 4;
  const xorStart = base + size;

  if (xorStart + xorRow * height + andRow * height > bytes.length) return null;

  const data = new Uint8ClampedArray(width * height * 4);
  let alphaSeen = false;

  for (let y = 0; y < height; y += 1) {
    const row = height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const si = xorStart + row * xorRow + x * bytesPerPixel;
      const di = (y * width + x) * 4;
      data[di] = bytes[si + 2];
      data[di + 1] = bytes[si + 1];
      data[di + 2] = bytes[si];
      if (bitCount === 32) {
        const alpha = bytes[si + 3];
        if (alpha !== 0) alphaSeen = true;
        data[di + 3] = alpha;
      } else {
        data[di + 3] = 255;
      }
    }
  }

  if (!alphaSeen) {
    // 32-bit entries that leave alpha at 0 are opaque in practice. For 24-bit
    // entries, apply the AND mask (1 bit per pixel, 1 = transparent).
    if (bitCount === 32) {
      for (let i = 3; i < data.length; i += 4) data[i] = 255;
    } else {
      const andOffset = xorStart + xorRow * height;
      for (let y = 0; y < height; y += 1) {
        const row = height - 1 - y;
        for (let x = 0; x < width; x += 1) {
          const byteIndex = Math.floor(x / 8);
          const bit = 7 - (x % 8);
          const maskBit = (bytes[andOffset + row * andRow + byteIndex] >> bit) & 1;
          if (maskBit === 1) data[(y * width + x) * 4 + 3] = 0;
        }
      }
    }
  }

  return { width, height, data };
}

export function extractPng(bytes: Uint8Array, entry: IcoEntry): Uint8Array | null {
  if (!entry.isPng) return null;
  return bytes.slice(entry.offset, entry.offset + entry.byteLength);
}

export function icoContainerError(): ImageProcessingError {
  return new ImageProcessingError(
    "This ICO file could not be decoded. It may use an unusual layout.",
    "decode-failed",
  );
}
