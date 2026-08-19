import type { EncodedCandidate, NormalizedImage, EncoderAdapter, EncoderOptions, PngCompression, PngMode } from "../core/types";
import { PngLosslessEncoder } from "../encoders/png-lossless";
import { PngQuantizedEncoder, pickQuantizationColors } from "../encoders/png-quantized";
import { uniqueColorCount } from "../../quantize";

export interface TargetSizeCandidate {
  result: EncodedCandidate;
  sizeBytes: number;
}

export async function generatePngCandidates(
  bitmap: NormalizedImage,
  targetSizeBytes: number,
  pngCompression: PngCompression,
  allowResize: boolean,
  isCancelled?: () => boolean,
): Promise<TargetSizeCandidate[]> {
  const candidates: TargetSizeCandidate[] = [];
  const lossless = new PngLosslessEncoder();
  const quantized = new PngQuantizedEncoder();

  const addCandidate = async (
    encoder: EncoderAdapter,
    options: EncoderOptions,
    label: string,
    pngMode?: PngMode,
  ) => {
    if (isCancelled?.()) return;
    try {
      const result = await encoder.encode(bitmap, options);
      candidates.push({
        result: { result, label, pngMode, quality: options.quality },
        sizeBytes: result.data.byteLength,
      });
    } catch { /* skip failed candidate */ }
  };

  await addCandidate(lossless, { pngCompression }, "Lossless", "lossless");
  if (candidates.length > 0 && candidates[candidates.length - 1].sizeBytes <= targetSizeBytes) {
    return candidates;
  }

  if (isCancelled?.()) return candidates;
  if (pngCompression !== "maximum") {
    await addCandidate(lossless, { pngCompression: "maximum" }, "Lossless (max DEFLATE)", "lossless");
    if (candidates.length > 0 && candidates[candidates.length - 1].sizeBytes <= targetSizeBytes) {
      return candidates;
    }
  }

  if (isCancelled?.()) return candidates;
  const unique = uniqueColorCount(bitmap.data, bitmap.width, bitmap.height);
  if (unique <= 256) {
    const colors = pickQuantizationColors(bitmap.width, bitmap.height, bitmap.data, "recommended");
    await addCandidate(quantized, { quality: colors, pngCompression }, "Palette (recommended)", "recommended");
    if (candidates.length > 0 && candidates[candidates.length - 1].sizeBytes <= targetSizeBytes) {
      return candidates;
    }
  }

  if (isCancelled?.()) return candidates;
  const maxColors = pickQuantizationColors(bitmap.width, bitmap.height, bitmap.data, "maximum");
  await addCandidate(quantized, { quality: maxColors, pngCompression }, "Palette (maximum)", "maximum");
  if (candidates.length > 0 && candidates[candidates.length - 1].sizeBytes <= targetSizeBytes) {
    return candidates;
  }

  if (!allowResize) return candidates;

  const scales = [0.75, 0.5, 0.375, 0.25, 0.125];
  for (const scale of scales) {
    if (isCancelled?.()) return candidates;
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const resized = await resizeBitmap(bitmap, w, h);
    await addCandidate(
      lossless,
      { pngCompression: "maximum" },
      `Lossless ${w}x${h}`,
      "lossless",
    );
    const last = candidates[candidates.length - 1];
    if (last && last.sizeBytes <= targetSizeBytes) return candidates;

    const rc = pickQuantizationColors(w, h, resized.data, "maximum");
    const resizedQuantized = new PngQuantizedEncoder();
    try {
      const result = await resizedQuantized.encode(resized, { quality: rc, pngCompression: "maximum" });
      candidates.push({
        result: { result, label: `Palette ${w}x${h} (${rc} colors)`, pngMode: "maximum", quality: rc },
        sizeBytes: result.data.byteLength,
      });
      if (candidates[candidates.length - 1].sizeBytes <= targetSizeBytes) return candidates;
    } catch { /* skip */ }
  }

  return candidates;
}

export function selectBestCandidate(
  candidates: TargetSizeCandidate[],
  targetSizeBytes: number,
): TargetSizeCandidate | null {
  let best: TargetSizeCandidate | null = null;
  let bestSize = Infinity;

  for (const c of candidates) {
    if (c.sizeBytes <= targetSizeBytes) {
      if (best === null || c.sizeBytes > bestSize) {
        best = c;
        bestSize = c.sizeBytes;
      }
    }
  }

  if (best) return best;

  let smallest: TargetSizeCandidate | null = null;
  for (const c of candidates) {
    if (smallest === null || c.sizeBytes < smallest.sizeBytes) {
      smallest = c;
    }
  }
  return smallest;
}

async function resizeBitmap(
  bitmap: NormalizedImage,
  width: number,
  height: number,
): Promise<NormalizedImage> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context for resize.");
  ctx.putImageData(
    new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height),
    0,
    0,
  );

  const outCanvas = new OffscreenCanvas(width, height);
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Failed to get output 2D context for resize.");
  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(canvas, 0, 0, width, height);
  const imageData = outCtx.getImageData(0, 0, width, height);
  return {
    width,
    height,
    data: new Uint8ClampedArray(imageData.data),
  };
}
