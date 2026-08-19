import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";

export async function encodeWasmHeic(
  bitmap: DecodedBitmap,
): Promise<{ data: Uint8Array; mimeType: string }> {
  try {
    const { ensureInitialized, jsEncodeImage } = await import("elheif");
    await ensureInitialized();
    const rgba = new Uint8Array(bitmap.data.buffer);
    const result = jsEncodeImage(rgba, bitmap.width, bitmap.height);
    if (result.err) {
      throw new Error(result.err);
    }
    return { data: result.data, mimeType: "image/heic" };
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("This browser could not encode HEIC.", "encode-failed");
  }
}
