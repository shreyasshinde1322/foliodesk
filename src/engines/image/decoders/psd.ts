import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";
import { callWorker } from "../worker/manager";

/**
 * PSD decode via `@webtoon/psd` (a pure JS + WASM parser) running in a Web
 * Worker so parsing a large file does not block the UI thread.
 *
 * Note: `@webtoon/psd` reads the flattened composite. Files saved without a
 * merged composite (Photoshop's "Maximize Compatibility" disabled) cannot be
 * decoded and produce a clear error instead of garbage.
 */
export async function decodePsd(buffer: ArrayBuffer): Promise<DecodedBitmap> {
  if (typeof Worker === "undefined") {
    throw new ImageProcessingError(
      "PSD decoding needs Web Worker support.",
      "unsupported-format",
    );
  }
  let result: { width: number; height: number; data: Uint8ClampedArray };
  try {
    result = await callWorker({ kind: "psd-decode", buffer });
  } catch (error) {
    if (error instanceof ImageProcessingError && error.code === "cancelled") throw error;
    throw new ImageProcessingError(
      "This PSD could not be decoded. Save it with Photoshop's compatibility mode enabled, or export a PNG first.",
      "decode-failed",
    );
  }
  if (!result || !result.data || result.width <= 0 || result.height <= 0) {
    throw new ImageProcessingError("The PSD produced no pixels.", "decode-failed");
  }
  return { width: result.width, height: result.height, data: result.data };
}
