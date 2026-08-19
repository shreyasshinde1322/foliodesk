import { hasAlpha } from "./bitmap";
import { encodeBitmap, transformBitmap } from "./engine";
import { clampQuality } from "./options";
import type {
  ConversionOptions,
  ConvertedImage,
  DecodedBitmap,
  EncodeFormat,
  ImageCodec,
  PngCompression,
  PngMode,
} from "./types";
import { ImageProcessingError } from "./types";

export interface OptimizationRequest {
  bitmap: DecodedBitmap;
  name: string;
  codec: ImageCodec;
  /** Explicit output format, or `null` to compare candidates automatically. */
  format: EncodeFormat | null;
  /** Quality for lossy encodes, 1-100. */
  quality: number;
  background: string;
  pngCompression: PngCompression;
  pngMode: PngMode;
  /** Target file size in bytes. 0 means no target. */
  targetSize?: number;
  /** Allow dimension reduction to reach the target size. */
  allowResizeForTarget?: boolean;
  isCancelled?: () => boolean;
}

export interface OptimizationResult {
  image: ConvertedImage;
  attempts: number;
}

interface Candidate {
  image: ConvertedImage;
}

export async function optimizeImage(request: OptimizationRequest): Promise<OptimizationResult> {
  const sourceHasAlpha = hasAlpha(request.bitmap);
  const formats = formatCandidates(request, sourceHasAlpha);
  const quality = clampQuality(request.quality);
  const targetSize = request.targetSize ?? 0;
  const hasTarget = targetSize > 0;

  const candidates: Candidate[] = [];
  let attempts = 0;

  const tryEncode = async (
    format: EncodeFormat,
    q: number,
    scaleFactor?: number,
  ): Promise<number> => {
    if (request.isCancelled?.()) {
      throw new ImageProcessingError("Compression was cancelled.", "cancelled");
    }
    attempts += 1;
    try {
      const options: Partial<ConversionOptions> = {
        outputFormat: format,
        quality: q,
        background: request.background,
        resizeMode: "keep",
        maintainAspectRatio: true,
        allowUpscale: false,
        pngCompression: request.pngCompression,
        pngMode: request.pngMode,
      };
      let bitmap = request.bitmap;

      if (scaleFactor !== undefined && scaleFactor < 1) {
        const newWidth = Math.max(1, Math.round(request.bitmap.width * scaleFactor));
        const newHeight = Math.max(1, Math.round(request.bitmap.height * scaleFactor));
        bitmap = await request.codec.scale(request.bitmap, newWidth, newHeight);
      }

      const { bitmap: working, options: normalized } = await transformBitmap(
        bitmap,
        options,
        request.codec,
      );
      const image = await encodeBitmap(working, request.name, normalized, request.codec);
      candidates.push({ image });
      return image.sizeBytes;
    } catch (error) {
      if (error instanceof ImageProcessingError && error.code === "encode-failed") return 0;
      throw error;
    }
  };

  for (const format of formats) {
    if (hasTarget) {
      await tryWithTarget(format, quality, tryEncode);
    } else {
      await tryEncode(format, quality);
    }
  }

  if (candidates.length === 0) {
    throw new ImageProcessingError(
      "No compression candidate could be produced by this browser.",
      "encode-failed",
    );
  }

  const best = hasTarget ? pickBestForTarget(candidates, targetSize) : pickSmallest(candidates);
  return { image: best.image, attempts };

  async function tryWithTarget(
    format: EncodeFormat,
    q: number,
    encode: typeof tryEncode,
  ): Promise<void> {
    let low = 10;
    let high = q;
    let bestQuality = -1;
    let bestSize = Infinity;

    for (let i = 0; i < 6; i++) {
      if (request.isCancelled?.()) return;
      const mid = Math.round((low + high) / 2);
      const size = await encode(format, mid);
      if (size <= 0) break;

      if (size <= targetSize) {
        if (size > bestSize || bestQuality < 0) {
          bestQuality = mid;
          bestSize = size;
        }
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (bestQuality >= 0) return;
    if (high < low) return;

    for (let q2 = low; q2 <= high; q2 += 5) {
      if (request.isCancelled?.()) return;
      const size = await encode(format, q2);
      if (size <= 0) break;
      if (size <= targetSize) return;
    }

    if (!request.allowResizeForTarget) return;

    const scales = [0.75, 0.5, 0.375, 0.25, 0.125];
    for (const scale of scales) {
      if (request.isCancelled?.()) return;
      const size = await encode(format, 10, scale);
      if (size <= 0) break;
      if (size <= targetSize) return;
    }
  }
}

function pickBestForTarget(candidates: Candidate[], targetSize: number): Candidate {
  let best: Candidate | null = null;
  let bestSize = 0;

  for (const c of candidates) {
    if (c.image.sizeBytes <= targetSize) {
      if (best === null || c.image.sizeBytes > bestSize) {
        best = c;
        bestSize = c.image.sizeBytes;
      }
    }
  }

  if (best) return best;

  return pickSmallest(candidates);
}

function formatCandidates(request: OptimizationRequest, sourceHasAlpha: boolean): EncodeFormat[] {
  if (request.format) return [request.format];
  if (sourceHasAlpha) return ["webp", "avif", "jxl"];
  return ["webp", "jpg", "avif", "jxl"];
}

function pickSmallest(candidates: Candidate[]): Candidate {
  return candidates.reduce((a, b) => (a.image.sizeBytes <= b.image.sizeBytes ? a : b));
}
