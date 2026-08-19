import { encodePng } from "../../encoders/png";
import { quantizeImage, uniqueColorCount, hasAlphaChannel, buildExactPalette } from "../../quantize";
import type { EncodeFormat, EncodeResult, EncoderAdapter, EncoderOptions, NormalizedImage, PngCompression } from "../core/types";

export class PngQuantizedEncoder implements EncoderAdapter {
  readonly format: EncodeFormat = "png";

  isSupported(): boolean {
    return true;
  }

  async encode(bitmap: NormalizedImage, options: EncoderOptions): Promise<EncodeResult> {
    const compression: PngCompression = options.pngCompression ?? "balanced";

    if (options.pngMode === "recommended") {
      const exact = buildExactPalette(bitmap.data, bitmap.width, bitmap.height);
      if (exact) {
        const data = encodePng(bitmap, compression, exact);
        return { data, mimeType: "image/png", format: "png", width: bitmap.width, height: bitmap.height };
      }
      const data = encodePng(bitmap, compression);
      return { data, mimeType: "image/png", format: "png", width: bitmap.width, height: bitmap.height };
    }

    const maxColors = options.quality ?? 64;
    const clampedColors = Math.max(2, Math.min(256, maxColors));
    const quantized = quantizeImage(bitmap.data, bitmap.width, bitmap.height, clampedColors);
    const hasAlpha = hasAlphaChannel(bitmap.data, bitmap.width, bitmap.height);

    const data = encodePng(bitmap, compression, { ...quantized, hasAlpha });
    return { data, mimeType: "image/png", format: "png", width: bitmap.width, height: bitmap.height };
  }
}

export function pickQuantizationColors(
  width: number,
  height: number,
  data: Uint8ClampedArray,
  mode: "recommended" | "maximum",
): number {
  const unique = uniqueColorCount(data, width, height);
  const alpha = hasAlphaChannel(data, width, height);

  if (mode === "recommended") {
    if (unique <= 256) return unique;
    return 256;
  }

  const maxColors = alpha ? 128 : 64;
  return Math.min(unique, maxColors);
}
