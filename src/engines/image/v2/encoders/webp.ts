import type { EncodeFormat, EncodeResult, EncoderAdapter, EncoderOptions, NormalizedImage } from "../core/types";

export class WebpEncoder implements EncoderAdapter {
  readonly format: EncodeFormat = "webp";

  isSupported(): boolean {
    if (typeof document === "undefined") return false;
    const canvas = document.createElement("canvas");
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  }

  async encode(bitmap: NormalizedImage, options: EncoderOptions): Promise<EncodeResult> {
    const quality = Math.max(1, Math.min(100, options.quality ?? 80));

    if (this.isSupported()) {
      return this.encodeNative(bitmap, quality);
    }
    return this.encodeWasm(bitmap, quality);
  }

  private async encodeNative(bitmap: NormalizedImage, quality: number): Promise<EncodeResult> {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context for WebP encoding.");

    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height),
      0,
      0,
    );

    const q = quality / 100;
    const blob = await canvasToBlob(canvas, "image/webp", q);
    const buffer = await blob.arrayBuffer();
    return {
      data: new Uint8Array(buffer),
      mimeType: "image/webp",
      format: "webp",
      width: bitmap.width,
      height: bitmap.height,
    };
  }

  private async encodeWasm(bitmap: NormalizedImage, quality: number): Promise<EncodeResult> {
    try {
      const wasm = await import("@jsquash/webp/encode.js");
      await wasm.init();
      const imageData = new ImageData(
        new Uint8ClampedArray(bitmap.data),
        bitmap.width,
        bitmap.height,
      );
      const buffer = await wasm.default(imageData, { quality, lossless: 0 });
      return {
        data: new Uint8Array(buffer),
        mimeType: "image/webp",
        format: "webp",
        width: bitmap.width,
        height: bitmap.height,
      };
    } catch {
      throw new Error("WebP encoding is not supported in this browser.");
    }
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
