import type { DecodedBitmap } from "./types";

/** Returns true when any pixel has partial or full transparency. */
export function hasAlpha(bitmap: DecodedBitmap): boolean {
  const data = bitmap.data;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 255) return true;
  }
  return false;
}

/**
 * Composite an RGBA bitmap over a solid background color, producing a fully
 * opaque bitmap. Used when the target format cannot store transparency (JPG).
 */
export function flattenBitmap(
  bitmap: DecodedBitmap,
  hexColor: string,
): DecodedBitmap {
  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);
  const source = bitmap.data;
  const output = new Uint8ClampedArray(source.length);
  for (let i = 0; i < source.length; i += 4) {
    const alpha = source[i + 3] / 255;
    const inverse = 1 - alpha;
    output[i] = Math.round(source[i] * alpha + red * inverse);
    output[i + 1] = Math.round(source[i + 1] * alpha + green * inverse);
    output[i + 2] = Math.round(source[i + 2] * alpha + blue * inverse);
    output[i + 3] = 255;
  }
  return { width: bitmap.width, height: bitmap.height, data: output };
}
