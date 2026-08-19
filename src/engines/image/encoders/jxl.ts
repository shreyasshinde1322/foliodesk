import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";

function toImageData(bitmap: DecodedBitmap): ImageData {
  return new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height);
}

export async function encodeWasmJxl(
  bitmap: DecodedBitmap,
  quality: number,
): Promise<{ data: Uint8Array; mimeType: string }> {
  try {
    const wasm = await import("@jsquash/jxl/encode.js");
    await wasm.init();
    const buffer = await wasm.default(toImageData(bitmap), {
      quality,
      effort: 4,
      lossless: false,
      progressive: false,
      epf: 0,
      lossyPalette: false,
      decodingSpeedTier: 0,
      photonNoiseIso: 0,
      lossyModular: false,
    });
    return { data: new Uint8Array(buffer), mimeType: "image/jxl" };
  } catch {
    throw new ImageProcessingError("This browser could not encode JPEG XL.", "encode-failed");
  }
}
