import { zlibSync } from "fflate";
import type { DecodedBitmap, PngCompression } from "../types";
import { ImageProcessingError } from "../types";

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const COMPRESSION_LEVEL: Record<PngCompression, number> = {
  fast: 1,
  balanced: 6,
  maximum: 9,
};

/**
 * Pure TypeScript PNG encoder using `fflate` for deflate. This is the encoder
 * behind PNG output because it gives exact control over compression effort
 * (Fast / Balanced / Maximum), which canvas `toBlob` does not expose.
 */
export function encodePng(
  bitmap: DecodedBitmap,
  compression: PngCompression = "balanced",
): Uint8Array {
  const { width, height, data } = bitmap;
  if (width <= 0 || height <= 0) {
    throw new ImageProcessingError("Cannot encode an image with no pixels.", "encode-failed");
  }

  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 4);
    raw[rowStart] = 0;
    raw.set(data.subarray(y * width * 4, (y + 1) * width * 4), rowStart + 1);
  }

  const level = COMPRESSION_LEVEL[compression] as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  let idat: Uint8Array;
  try {
    idat = zlibSync(raw, { level });
  } catch (error) {
    throw new ImageProcessingError(
      error instanceof Error ? error.message : "PNG compression failed.",
      "encode-failed",
    );
  }

  const chunks: Uint8Array[] = [PNG_SIGNATURE];
  const ihdr = new Uint8Array(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 8;
  ihdr[9] = 6;
  chunks.push(buildChunk("IHDR", ihdr));
  chunks.push(buildChunk("IDAT", idat));
  chunks.push(buildChunk("IEND", new Uint8Array(0)));

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
