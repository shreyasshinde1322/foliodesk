export interface GifAnalysis {
  animated: boolean;
  frameCount: number;
}

function skipSubBlocks(bytes: Uint8Array, start: number): number {
  let pos = start;
  while (pos < bytes.length) {
    const size = bytes[pos];
    if (size === 0) return pos + 1;
    pos += size + 1;
    if (pos >= bytes.length) break;
  }
  return pos;
}

/**
 * Parse the GIF block structure without decoding pixels. Counts image
 * descriptors (0x2C). Multiple image descriptors means the GIF is animated,
 * which the compressor does not support.
 *
 * After the 6-byte header and 7-byte Logical Screen Descriptor, a Global Color
 * Table may follow (when bit 7 of the packed byte is set). The parser must skip
 * it before scanning for block markers, otherwise the first color-table byte can
 * be misinterpreted as a block marker and cause the parser to bail early,
 * misreporting an animated GIF as static.
 */
export function detectGifAnimation(bytes: Uint8Array): GifAnalysis {
  if (bytes.length < 13) return { animated: false, frameCount: 0 };

  // Skip Global Color Table if present.
  // Byte 10 = packed field; bit 7 = GCT flag, bits 0-2 = GCT size (N), table = 3 * 2^(N+1).
  const packed = bytes[10];
  let pos = 13;
  if (packed & 0x80) {
    const gctSize = 3 * (1 << ((packed & 0x07) + 1));
    pos += gctSize;
  }

  let images = 0;
  while (pos < bytes.length) {
    const marker = bytes[pos];
    if (marker === 0x3b) break; // trailer
    if (marker === 0x2c) {
      // Image descriptor
      images += 1;
      pos += 9;
      if (pos >= bytes.length) break;
      if (bytes[pos] & 0x80) {
        pos += 3 * (1 << ((bytes[pos] & 0x07) + 1));
      }
      if (pos >= bytes.length) break;
      pos += 2; // LZW minimum code size + first sub-block length byte
      pos = skipSubBlocks(bytes, pos);
    } else if (marker === 0x21) {
      // Extension
      pos += 2;
      pos = skipSubBlocks(bytes, pos);
    } else {
      break;
    }
  }

  return { animated: images >= 2, frameCount: images };
}
