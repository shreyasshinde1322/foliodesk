import type { DecodedBitmap } from "../types";
import { ImageProcessingError } from "../types";

export async function encodeGif(
  bitmap: DecodedBitmap,
  quality: number,
): Promise<{ data: Uint8Array; mimeType: string }> {
  try {
    const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
    const rgba = new Uint8Array(bitmap.data.buffer);
    const maxColors = qualityToColors(quality);
    const palette = quantize(rgba, maxColors, { format: "rgb565" });
    const index = applyPalette(rgba, palette, "rgb565");
    const gif = GIFEncoder({ auto: true });
    gif.writeFrame(index, bitmap.width, bitmap.height, { palette });
    gif.finish();
    return { data: gif.bytes(), mimeType: "image/gif" };
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("This browser could not encode GIF.", "encode-failed");
  }
}

function qualityToColors(quality: number): number {
  const q = Math.max(1, Math.min(100, quality));
  return Math.round(2 + (q / 100) * 254);
}
