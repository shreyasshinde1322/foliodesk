import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";
import { createCanvas, get2dContext } from "../canvas";

/**
 * HEIC/HEIF decode via `heic2any` (libheif compiled to WebAssembly).
 *
 * heic2any depends on `window` and `document` and embeds its own worker
 * string, so it MUST run on the main thread, never inside our worker. It is
 * imported lazily so a missing/crashing module only affects HEIC input.
 */
export async function decodeHeic(bytes: Uint8Array): Promise<DecodedBitmap> {
  if (typeof window === "undefined" || typeof createImageBitmap !== "function") {
    throw new ImageProcessingError(
      "HEIC/HEIF decoding is only available in the browser.",
      "unsupported-format",
    );
  }
  let heic2any: ((input: Heic2AnyInput) => Promise<Blob | Blob[]>) | null = null;
  try {
    heic2any = (await import("heic2any")).default;
  } catch {
    heic2any = null;
  }
  if (!heic2any) {
    throw new ImageProcessingError(
      "HEIC decoding could not be loaded in this browser.",
      "unsupported-format",
    );
  }

  const blob = new Blob([new Uint8Array(bytes)], { type: "image/heic" });
  try {
    const output = await heic2any({ blob, toType: "image/png", quality: 1 });
    const decoded = Array.isArray(output) ? output[0] : output;
    if (!decoded) throw new Error("heic2any produced no output.");
    const bitmap = await createImageBitmap(decoded);
    try {
      const context = get2dContext(createCanvas(bitmap.width, bitmap.height));
      context.drawImage(bitmap, 0, 0);
      const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
      return { width: bitmap.width, height: bitmap.height, data: imageData.data };
    } finally {
      if (typeof bitmap.close === "function") bitmap.close();
    }
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError(
      "This HEIC/HEIF file could not be decoded. Some HEIF files use formats this browser cannot read.",
      "decode-failed",
    );
  }
}

interface Heic2AnyInput {
  blob: Blob;
  toType: string;
  quality?: number;
}
