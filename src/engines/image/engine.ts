import { flattenBitmap, hasAlpha } from "./bitmap";
import { detectGifAnimation } from "./decoders/gif";
import { buildOutputName } from "./filename";
import { IMAGE_FORMAT_META, MAX_FILE_BYTES, assertSupportedInput } from "./formats";
import { isBelowHardLimit } from "./memory";
import { normalizeConversionOptions } from "./options";
import { computeTargetSize, type Size } from "./resize";
import type {
  ConversionOptions,
  ConvertedImage,
  DecodedBitmap,
  ImageCodec,
  ImageFormat,
} from "./types";
import { ImageProcessingError } from "./types";

export interface ConvertRequest {
  /** File-like object (a `File` in the browser, a `Blob` in Node tests). */
  blob: Blob;
  name: string;
  options: Partial<ConversionOptions>;
  codec: ImageCodec;
}

export interface BatchEntry {
  id: string;
  blob: Blob;
  name: string;
}

export interface AnalyzedImage {
  sourceFormat: ImageFormat;
  bitmap: DecodedBitmap;
}

/**
 * Validate a file and decode it, returning both the detected source format and
 * the decoded RGBA bitmap. Used by the UI to show source dimensions and alpha
 * before conversion without decoding twice.
 */
export async function analyzeImage(blob: Blob, name: string, codec: ImageCodec): Promise<AnalyzedImage> {
  const bytes = new Uint8Array(await blob.arrayBuffer());

  if (bytes.length === 0) {
    throw new ImageProcessingError("The file is empty.", "invalid-file");
  }
  if (bytes.length > MAX_FILE_BYTES) {
    throw new ImageProcessingError(
      "This file is larger than the 25 MB limit for the Image Converter.",
      "file-too-large",
    );
  }

  const sourceFormat = assertSupportedInput(bytes, name);

  if (sourceFormat === "gif") {
    const { animated } = detectGifAnimation(bytes);
    if (animated) {
      throw new ImageProcessingError(
        "Animated GIFs cannot be converted yet — converting them would silently drop frames. Please convert a static image instead.",
        "animated-gif",
      );
    }
  }

  const bitmap = await codec.decode(bytes, sourceFormat);

  if (!isBelowHardLimit(bitmap.width, bitmap.height)) {
    throw new ImageProcessingError(
      `This image is too large to convert in the browser (${bitmap.width}×${bitmap.height} pixels). Please reduce its size first.`,
      "image-too-large",
    );
  }

  return { sourceFormat, bitmap };
}

/**
 * Transform an already-decoded bitmap: resize when requested, flatten alpha
 * when the raster target format has no alpha channel. Never touches the DOM.
 */
export async function transformBitmap(
  bitmap: DecodedBitmap,
  optionsInput: Partial<ConversionOptions>,
  codec: ImageCodec,
): Promise<{ bitmap: DecodedBitmap; options: ConversionOptions; target: Size }> {
  const options = normalizeConversionOptions(optionsInput);

  const target = computeTargetSize(bitmap.width, bitmap.height, options);
  let working = bitmap;
  if (target.width !== bitmap.width || target.height !== bitmap.height) {
    working = await codec.scale(bitmap, target.width, target.height);
  }

  const targetFormat = options.outputFormat;
  if (hasAlpha(working) && !IMAGE_FORMAT_META[targetFormat].supportsAlpha) {
    working = flattenBitmap(working, options.background);
  }

  return { bitmap: working, options, target };
}

/**
 * Encode a transformed bitmap through the codec with format-specific options.
 */
export async function encodeBitmap(
  working: DecodedBitmap,
  name: string,
  options: ConversionOptions,
  codec: ImageCodec,
): Promise<ConvertedImage> {
  const format = options.outputFormat;
  const targetMeta = IMAGE_FORMAT_META[format];
  const quality = targetMeta.lossy ? options.quality : 100;
  const output = await codec.encode(working, format, quality, {
    pngCompression: options.pngCompression,
  });
  validateEncodeOutput(output.data, output.mimeType);

  return {
    format,
    width: working.width,
    height: working.height,
    sizeBytes: output.data.byteLength,
    mimeType: output.mimeType,
    outputName: buildOutputName(name, format),
    data: output.data,
  };
}

function validateEncodeOutput(data: Uint8Array, mimeType: string): void {
  if (data.byteLength === 0) {
    throw new ImageProcessingError("The encoder produced an empty file.", "output-invalid");
  }
  if (!mimeType || !mimeType.startsWith("image/")) {
    throw new ImageProcessingError("The encoder produced an invalid file.", "output-invalid");
  }
}

/**
 * Convert a single already-decoded bitmap entirely in-process.
 *
 * Pipeline: resize (optional) → flatten alpha (when the target format has no
 * alpha) → encode.
 *
 * The function is environment-agnostic: it never touches the DOM. Browser and
 * Node codecs implement the same `ImageCodec` interface.
 */
export async function convertBitmap(
  bitmap: DecodedBitmap,
  name: string,
  optionsInput: Partial<ConversionOptions>,
  codec: ImageCodec,
): Promise<ConvertedImage> {
  const { bitmap: working, options } = await transformBitmap(bitmap, optionsInput, codec);
  return encodeBitmap(working, name, options, codec);
}

/**
 * Convert a single image entirely in-process.
 *
 * Pipeline: detect format → decode → resize (optional) → flatten alpha
 * (when the target format has no alpha) → encode.
 */
export async function convertImage(request: ConvertRequest): Promise<ConvertedImage> {
  const { bitmap } = await analyzeImage(request.blob, request.name, request.codec);
  return convertBitmap(bitmap, request.name, request.options, request.codec);
}

/**
 * Convert many images with bounded concurrency. Results are keyed by entry id.
 * Throws on the first failure so callers can surface a single clear error.
 */
export async function convertBatch(
  entries: BatchEntry[],
  options: Partial<ConversionOptions>,
  codec: ImageCodec,
  onProgress?: (done: number, total: number, id: string) => void,
  concurrency = 2,
): Promise<Map<string, ConvertedImage>> {
  const results = new Map<string, ConvertedImage>();
  let done = 0;
  let cursor = 0;
  const total = entries.length;

  const worker = async (): Promise<void> => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= total) return;
      const entry = entries[index];
      try {
        const result = await convertImage({
          blob: entry.blob,
          name: entry.name,
          options,
          codec,
        });
        results.set(entry.id, result);
      } catch (error) {
        const code = error instanceof ImageProcessingError ? error.code : "convert-failed";
        const message =
          error instanceof Error ? error.message : "The image could not be converted.";
        throw new ImageProcessingError(message, code);
      }
      done += 1;
      onProgress?.(done, total, entry.id);
    }
  };

  const limit = Math.max(1, Math.min(concurrency, total));
  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
  return results;
}
