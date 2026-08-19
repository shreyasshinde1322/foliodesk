import type { EncodeFormat, EncodeResult, EncoderAdapter, EncoderOptions, NormalizedImage } from "../core/types";

export class JpegEncoder implements EncoderAdapter {
  readonly format: EncodeFormat = "jpg";

  isSupported(): boolean {
    return typeof document !== "undefined";
  }

  async encode(bitmap: NormalizedImage, options: EncoderOptions): Promise<EncodeResult> {
    const quality = Math.max(1, Math.min(100, options.quality ?? 85));
    const q = quality / 100;

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context for JPEG encoding.");

    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height),
      0,
      0,
    );

    const blob = await canvasToBlob(canvas, "image/jpeg", q);
    const buffer = await blob.arrayBuffer();
    return {
      data: new Uint8Array(buffer),
      mimeType: "image/jpeg",
      format: "jpg",
      width: bitmap.width,
      height: bitmap.height,
    };
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob returned null."));
      },
      type,
      quality,
    );
  });
}
