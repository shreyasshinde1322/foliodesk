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
 * which the converter does not support.
 */
export function detectGifAnimation(bytes: Uint8Array): GifAnalysis {
  if (bytes.length < 13) return { animated: false, frameCount: 0 };
  let images = 0;
  let pos = 13;

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
