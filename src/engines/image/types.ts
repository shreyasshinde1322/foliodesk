export type ImageFormat =
  | "jpg"
  | "png"
  | "webp"
  | "gif"
  | "avif"
  | "heic"
  | "heif"
  | "psd"
  | "bmp"
  | "ico"
  | "svg";

export type EncodeFormat = "jpg" | "png" | "webp" | "avif";

export type OutputKind = "raster" | "vector";

export type ResizeMode =
  | "keep"
  | "exact"
  | "max-width"
  | "max-height"
  | "percentage";

export type PngCompression = "fast" | "balanced" | "maximum";

export interface ConversionOptions {
  /** Target output format. */
  outputFormat: EncodeFormat;
  /** Quality for lossy formats, clamped to 10-100. Ignored for PNG. */
  quality: number;
  /** Background hex color used when flattening alpha (JPG output). */
  background: string;
  resizeMode: ResizeMode;
  width?: number;
  height?: number;
  percentage?: number;
  maintainAspectRatio: boolean;
  /** Whether percentage upscaling is allowed (never used by max-* modes). */
  allowUpscale: boolean;
  /** PNG deflate effort (only used by the built-in PNG encoder). */
  pngCompression: PngCompression;
}

export interface EncodeOptions {
  pngCompression?: PngCompression;
}

export interface DecodedBitmap {
  width: number;
  height: number;
  /** Raw RGBA pixel data (4 bytes per pixel). */
  data: Uint8ClampedArray;
}

export interface EncodeOutput {
  data: Uint8Array;
  mimeType: string;
}

/**
 * Environment-specific image codec.
 *
 * The browser implementation (`codec.ts`) uses `createImageBitmap`,
 * `OffscreenCanvas`/`canvas`, `toBlob`, the built-in PNG encoder, and lazy
 * WASM fallbacks. Tests inject a Node/`sharp` implementation. The engine only
 * depends on this interface, which keeps the core logic pure and future tools
 * (resizer, cropper, compressor) reusable.
 */
export interface ImageCodec {
  decode(data: Uint8Array, sourceFormat: ImageFormat): Promise<DecodedBitmap>;
  scale(bitmap: DecodedBitmap, width: number, height: number): Promise<DecodedBitmap>;
  encode(
    bitmap: DecodedBitmap,
    format: EncodeFormat,
    quality: number,
    encodeOptions?: EncodeOptions,
  ): Promise<EncodeOutput>;
}

export interface ConvertedImage {
  format: EncodeFormat;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  outputName: string;
  data: Uint8Array;
}

/**
 * Granular pipeline stage used by the UI to show what each file is doing.
 * `analyzing` = magic-byte/metadata detection, `decoding` = pixel decode,
 * `processing` = transform/resize, `encoding` = final encode.
 */
export type JobStage =
  | "queued"
  | "analyzing"
  | "decoding"
  | "processing"
  | "encoding"
  | "complete"
  | "failed"
  | "cancelled";

export class ImageProcessingError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "ImageProcessingError";
    this.code = code;
  }
}
