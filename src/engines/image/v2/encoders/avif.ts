import type { EncodeFormat, EncodeResult, EncoderAdapter, EncoderOptions, NormalizedImage } from "../core/types";

export class AvifEncoder implements EncoderAdapter {
  readonly format: EncodeFormat = "avif";

  private _supported: boolean | null = null;

  isSupported(): boolean {
    if (this._supported !== null) return this._supported;
    if (typeof document === "undefined") {
      this._supported = false;
      return false;
    }
    const canvas = document.createElement("canvas");
    const dataUrl = canvas.toDataURL("image/avif");
    this._supported = dataUrl.indexOf("data:image/avif") === 0;
    return this._supported;
  }

  async encode(bitmap: NormalizedImage, options: EncoderOptions): Promise<EncodeResult> {
    const quality = Math.max(1, Math.min(100, options.quality ?? 60));

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
    if (!ctx) throw new Error("Failed to get 2D context for AVIF encoding.");

    ctx.putImageData(
      new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height),
      0,
      0,
    );

    const q = quality / 100;
    const blob = await canvasToBlob(canvas, "image/avif", q);
    const buffer = await blob.arrayBuffer();
    return {
      data: new Uint8Array(buffer),
      mimeType: "image/avif",
      format: "avif",
      width: bitmap.width,
      height: bitmap.height,
    };
  }

  private async encodeWasm(bitmap: NormalizedImage, quality: number): Promise<EncodeResult> {
    try {
      const wasm = await import("@jsquash/avif/encode.js");
      await wasm.init();
      const imageData = new ImageData(
        new Uint8ClampedArray(bitmap.data),
        bitmap.width,
        bitmap.height,
      );
      const buffer = await wasm.default(imageData, { quality, lossless: false });
      return {
        data: new Uint8Array(buffer),
        mimeType: "image/avif",
        format: "avif",
        width: bitmap.width,
        height: bitmap.height,
      };
    } catch {
      throw new Error("AVIF encoding is not supported in this browser.");
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
