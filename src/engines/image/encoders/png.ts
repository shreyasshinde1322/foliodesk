import { zlibSync } from "fflate";
import type { DecodedBitmap, PngCompression } from "../types";
import { ImageProcessingError } from "../types";

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const COMPRESSION_LEVEL: Record<PngCompression, number> = {
  fast: 1,
  balanced: 6,
  maximum: 9,
};

const FILTER_NONE = 0;
const FILTER_SUB = 1;
const FILTER_UP = 2;
const FILTER_AVG = 3;
const FILTER_PAETH = 4;

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function absByte(v: number): number {
  return v < 128 ? v : 256 - v;
}

function applyFilter(
  srcRow: Uint8Array,
  prevRow: Uint8Array | null,
  bpp: number,
  filter: number,
  out: Uint8Array,
): void {
  const bytesPerRow = srcRow.length;
  out[0] = filter;
  for (let x = 0; x < bytesPerRow; x += 1) {
    const rawByte = srcRow[x];
    let a = 0;
    let b = 0;
    let c = 0;
    if (x >= bpp) a = out[1 + x - bpp];
    if (prevRow) {
      b = prevRow[1 + x];
      if (x >= bpp) c = prevRow[1 + x - bpp];
    }
    switch (filter) {
      case FILTER_SUB:
        out[1 + x] = (rawByte - a) & 0xff;
        break;
      case FILTER_UP:
        out[1 + x] = (rawByte - b) & 0xff;
        break;
      case FILTER_AVG:
        out[1 + x] = (rawByte - ((a + b) >> 1)) & 0xff;
        break;
      case FILTER_PAETH:
        out[1 + x] = (rawByte - paethPredictor(a, b, c)) & 0xff;
        break;
      default:
        out[1 + x] = rawByte;
        break;
    }
  }
}

function estimateRowEntropy(row: Uint8Array, start: number, end: number): number {
  let sum = 0;
  for (let i = start; i < end; i += 1) sum += absByte(row[i]);
  return sum;
}

function filterAndCompress(
  rows: Uint8Array[],
  bpp: number,
  width: number,
  compression: PngCompression,
): Uint8Array {
  const height = rows.length;
  const stride = width * bpp;
  const candidateBuf = new Uint8Array(1 + stride);
  const filtered = new Uint8Array(height * (1 + stride));
  let prevFilteredRow: Uint8Array | null = null;

  for (let y = 0; y < height; y += 1) {
    const srcRow = rows[y];
    let bestFilter = FILTER_NONE;
    let bestEntropy = Infinity;

    for (let f = FILTER_NONE; f <= FILTER_PAETH; f += 1) {
      applyFilter(srcRow, prevFilteredRow, bpp, f, candidateBuf);
      const entropy = estimateRowEntropy(candidateBuf, 1, candidateBuf.length);
      if (entropy < bestEntropy) {
        bestEntropy = entropy;
        bestFilter = f;
      }
    }

    applyFilter(srcRow, prevFilteredRow, bpp, bestFilter, candidateBuf);
    const rowOffset = y * (1 + stride);
    filtered.set(candidateBuf, rowOffset);
    prevFilteredRow = filtered.subarray(rowOffset, rowOffset + 1 + stride);
  }

  const level = COMPRESSION_LEVEL[compression] as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  return zlibSync(filtered, { level });
}

export interface PaletteInput {
  palette: Uint8Array;
  indices: Uint8Array;
  colorCount: number;
  hasAlpha: boolean;
}

/**
 * PNG encoder with adaptive row filtering.
 * Supports both truecolor (RGBA) and palette (indexed) modes.
 */
export function encodePng(
  bitmap: DecodedBitmap,
  compression: PngCompression = "balanced",
  paletteInput?: PaletteInput,
): Uint8Array {
  const { width, height } = bitmap;
  if (width <= 0 || height <= 0) {
    throw new ImageProcessingError("Cannot encode an image with no pixels.", "encode-failed");
  }

  if (paletteInput && paletteInput.colorCount <= 256) {
    return encodePalettePng(bitmap, compression, paletteInput);
  }
  return encodeTruecolorPng(bitmap, compression);
}

function encodeTruecolorPng(
  bitmap: DecodedBitmap,
  compression: PngCompression,
): Uint8Array {
  const { width, height, data } = bitmap;
  const bpp = 4;
  const stride = width * bpp;
  const srcRow = new Uint8Array(stride);

  const rows: Uint8Array[] = [];
  for (let y = 0; y < height; y += 1) {
    const srcOffset = y * stride;
    for (let i = 0; i < stride; i += 1) srcRow[i] = data[srcOffset + i];
    const row = new Uint8Array(stride);
    row.set(srcRow);
    rows.push(row);
  }

  const idat = filterAndCompress(rows, bpp, width, compression);

  const chunks: Uint8Array[] = [PNG_SIGNATURE];
  const ihdr = new Uint8Array(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  chunks.push(buildChunk("IHDR", ihdr));
  chunks.push(buildChunk("IDAT", idat));
  chunks.push(buildChunk("IEND", new Uint8Array(0)));
  const png = assembleChunks(chunks);
  validatePng(png);
  return png;
}

function encodePalettePng(
  bitmap: DecodedBitmap,
  compression: PngCompression,
  paletteInput: PaletteInput,
): Uint8Array {
  const { width, height } = bitmap;
  const { palette, indices, hasAlpha } = paletteInput;
  const colorCount = paletteInput.colorCount;

  const rows: Uint8Array[] = [];
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width;
    const row = new Uint8Array(width);
    for (let x = 0; x < width; x += 1) {
      row[x] = indices[rowStart + x];
    }
    rows.push(row);
  }

  const idat = filterAndCompress(rows, 1, width, compression);

  const chunks: Uint8Array[] = [PNG_SIGNATURE];

  const ihdr = new Uint8Array(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 3;
  chunks.push(buildChunk("IHDR", ihdr));

  const plte = new Uint8Array(colorCount * 3);
  for (let i = 0; i < colorCount; i += 1) {
    plte[i * 3] = palette[i * 4];
    plte[i * 3 + 1] = palette[i * 4 + 1];
    plte[i * 3 + 2] = palette[i * 4 + 2];
  }
  chunks.push(buildChunk("PLTE", plte));

  if (hasAlpha) {
    const trns = new Uint8Array(colorCount);
    for (let i = 0; i < colorCount; i += 1) {
      trns[i] = palette[i * 4 + 3];
    }
    chunks.push(buildChunk("tRNS", trns));
  }

  chunks.push(buildChunk("IDAT", idat));
  chunks.push(buildChunk("IEND", new Uint8Array(0)));
  const png = assembleChunks(chunks);
  validatePng(png);
  return png;
}

function validatePng(png: Uint8Array): void {
  if (png.length < 8) {
    throw new ImageProcessingError("PNG output is too small to be valid.", "encode-failed");
  }
  for (let i = 0; i < 8; i += 1) {
    if (png[i] !== PNG_SIGNATURE[i]) {
      throw new ImageProcessingError("PNG output has invalid signature.", "encode-failed");
    }
  }
  // Minimum: 8 sig + 13 IHDR data + 12 chunk overhead + 12 IEND = 45 bytes.
  const minBytes = 8 + (12 + 13) + (12 + 0);
  if (png.length < minBytes) {
    throw new ImageProcessingError("PNG output is too small to contain valid chunks.", "encode-failed");
  }
}

function assembleChunks(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const chunk of chunks) total += chunk.length;
  const output = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}

function buildChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  writeU32(chunk, 0, data.length);
  for (let i = 0; i < 4; i += 1) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  writeU32(chunk, 8 + data.length, crc32(type, data));
  return chunk;
}

function crc32(type: string, data: Uint8Array): number {
  const table = crc32Table();
  let crc = 0xffffffff;
  for (let i = 0; i < 4; i += 1) crc = table[(crc ^ type.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
  for (let i = 0; i < data.length; i += 1) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

let crcTable: Uint32Array | null = null;

function crc32Table(): Uint32Array {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}

function writeU32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = (value >>> 24) & 255;
  target[offset + 1] = (value >>> 16) & 255;
  target[offset + 2] = (value >>> 8) & 255;
  target[offset + 3] = value & 255;
}
