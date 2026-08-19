export type ImageFormat = "jpg" | "png" | "webp" | "gif" | "avif" | "heic" | "heif" | "psd" | "bmp" | "ico" | "svg";
export type EncodeFormat = "jpg" | "png" | "webp" | "avif";

export interface NormalizedImage {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface EncodeResult {
  data: Uint8Array;
  mimeType: string;
  format: EncodeFormat;
  width: number;
  height: number;
}

export interface EncodedCandidate {
  result: EncodeResult;
  label: string;
  pngMode?: PngMode;
  quality?: number;
}

export type PngCompression = "fast" | "balanced" | "maximum";
export type PngMode = "lossless" | "recommended" | "maximum";

export type CompressionMode = "best-quality" | "recommended" | "maximum" | "target-size";

export interface CompressRequest {
  bitmap: NormalizedImage;
  sourceFormat: ImageFormat;
  outputFormat: EncodeFormat;
  mode: CompressionMode;
  quality?: number;
  pngCompression?: PngCompression;
  pngMode?: PngMode;
  targetSizeBytes?: number;
  allowResize?: boolean;
  background?: string;
  jobId?: string;
  isCancelled?: () => boolean;
}

export interface CompressResult {
  candidates: EncodedCandidate[];
  best: EncodedCandidate;
  targetAchieved: boolean;
  actualSizeBytes: number;
  targetSizeBytes: number;
}

export interface EncoderAdapter {
  readonly format: EncodeFormat;
  encode(bitmap: NormalizedImage, options: EncoderOptions): Promise<EncodeResult>;
  isSupported(): boolean;
}

export interface EncoderOptions {
  quality?: number;
  pngCompression?: PngCompression;
  pngMode?: PngMode;
  lossless?: boolean;
}

export interface Validator {
  validate(input: NormalizedImage, output: EncodeResult): Promise<ValidationResult>;
}

export interface ValidationResult {
  valid: boolean;
  widthMatch: boolean;
  heightMatch: boolean;
  pixelMatch?: boolean;
  error?: string;
}
