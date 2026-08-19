import { encodePng } from "../../encoders/png";
import type { EncodeFormat, EncodeResult, EncoderAdapter, EncoderOptions, NormalizedImage, PngCompression } from "../core/types";

export class PngLosslessEncoder implements EncoderAdapter {
  readonly format: EncodeFormat = "png";

  isSupported(): boolean {
    return true;
  }

  async encode(bitmap: NormalizedImage, options: EncoderOptions): Promise<EncodeResult> {
    const compression: PngCompression = options.pngCompression ?? "balanced";
    const data = encodePng(bitmap, compression);
    return {
      data,
      mimeType: "image/png",
      format: "png",
      width: bitmap.width,
      height: bitmap.height,
    };
  }
}
