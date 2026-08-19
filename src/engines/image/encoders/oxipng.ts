import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";

function toImageData(bitmap: DecodedBitmap): ImageData {
  return new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height);
}

export async function encodeWasmOxiPng(
  bitmap: DecodedBitmap,
  level: number = 6,
): Promise<{ data: Uint8Array; mimeType: string }> {
  try {
    const wasm = await import("@jsquash/oxipng/optimise.js");
    await wasm.init();
    const buffer = await wasm.default(toImageData(bitmap), {
      level,
      interlace: true,
      optimiseAlpha: true,
    });
    return { data: new Uint8Array(buffer), mimeType: "image/png" };
  } catch {
    throw new ImageProcessingError("This browser could not optimize PNG with OxiPNG.", "encode-failed");
  }
}
