import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";

function toImageData(bitmap: DecodedBitmap): ImageData {
  return new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height);
}

export async function encodeWasmMozJpeg(
  bitmap: DecodedBitmap,
  quality: number,
): Promise<{ data: Uint8Array; mimeType: string }> {
  try {
    const wasm = await import("@jsquash/jpeg/encode.js");
    await wasm.init();
    const buffer = await wasm.default(toImageData(bitmap), {
      quality,
      baseline: true,
      arithmetic: false,
      progressive: true,
      optimize_coding: true,
      smoothing: 0,
      color_space: 1,
      quant_table: 0,
      trellis_multipass: false,
      trellis_opt_zero: false,
      trellis_opt_table: false,
      trellis_loops: 1,
      auto_subsample: true,
      chroma_subsample: 0,
      separate_chroma_quality: false,
      chroma_quality: 75,
    });
    return { data: new Uint8Array(buffer), mimeType: "image/jpeg" };
  } catch {
    throw new ImageProcessingError("This browser could not encode MozJPEG.", "encode-failed");
  }
}
