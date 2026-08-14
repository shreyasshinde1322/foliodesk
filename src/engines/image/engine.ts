import { flattenBitmap, hasAlpha } from "./bitmap";
import { buildOutputName } from "./filename";
import { IMAGE_FORMAT_META, MAX_FILE_BYTES, assertSupportedInput } from "./formats";
import { normalizeConversionOptions } from "./options";
import { computeTargetSize } from "./resize";
import type { ConversionOptions, ConvertedImage, DecodedBitmap, EncodeFormat, ImageCodec, ImageFormat } from "./types";
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
  const bitmap = await codec.decode(bytes, sourceFormat);
  return { sourceFormat, bitmap };
}

/**
 * Transform and encode an already-decoded bitmap. Resizes when requested and
 * flattens alpha when the target format has no alpha channel.
 */
export async function convertBitmap(
  bitmap: DecodedBitmap,
  name: string,
  optionsInput: Partial<ConversionOptions>,
  codec: ImageCodec,
): Promise<ConvertedImage> {
  const options = normalizeConversionOptions(optionsInput);

  const target = computeTargetSize(bitmap.width, bitmap.height, options);
  let working = bitmap;
  if (target.width !== bitmap.width || target.height !== bitmap.height) {
    working = await codec.scale(bitmap, target.width, target.height);
  }

  const targetFormat: EncodeFormat = options.outputFormat;
  const targetMeta = IMAGE_FORMAT_META[targetFormat];
  if (hasAlpha(working) && !targetMeta.supportsAlpha) {
    working = flattenBitmap(working, options.background);
  }

  const quality = targetMeta.lossy ? options.quality : 100;
  const output = await codec.encode(working, targetFormat, quality);

  return {
    format: targetFormat,
    width: working.width,
    height: working.height,
    sizeBytes: output.data.byteLength,
    mimeType: output.mimeType,
    outputName: buildOutputName(name, targetFormat),
    data: output.data,
  };
}

/**
 * Convert a single image entirely in-process.
 *
 * Pipeline: detect format → decode → resize (optional) → flatten alpha
 * (when the target format has no alpha) → encode.
 *
 * The function is environment-agnostic: it never touches the DOM. Browser and
 * Node codecs implement the same `ImageCodec` interface.
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
