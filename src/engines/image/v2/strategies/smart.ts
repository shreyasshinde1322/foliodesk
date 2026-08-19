import type { CompressRequest, EncodedCandidate, EncoderAdapter } from "../core/types";
import { PngLosslessEncoder } from "../encoders/png-lossless";
import { PngQuantizedEncoder, pickQuantizationColors } from "../encoders/png-quantized";
import { JpegEncoder } from "../encoders/jpeg";
import { WebpEncoder } from "../encoders/webp";
import { AvifEncoder } from "../encoders/avif";

const jpegEncoder = new JpegEncoder();
const webpEncoder = new WebpEncoder();
const avifEncoder = new AvifEncoder();
const pngLossless = new PngLosslessEncoder();
const pngQuantized = new PngQuantizedEncoder();

export async function generateCandidates(
  request: CompressRequest,
): Promise<EncodedCandidate[]> {
  const { outputFormat } = request;
  const candidates: EncodedCandidate[] = [];

  if (outputFormat === "png") {
    await generatePngCandidates(request, candidates);
  } else if (outputFormat === "jpg") {
    await generateJpegCandidates(request, candidates);
  } else if (outputFormat === "webp") {
    await generateWebpCandidates(request, candidates);
  } else if (outputFormat === "avif") {
    await generateAvifCandidates(request, candidates);
  }

  return candidates;
}

async function generatePngCandidates(
  request: CompressRequest,
  candidates: EncodedCandidate[],
): Promise<void> {
  const { bitmap, mode, pngCompression } = request;
  const compression = pngCompression ?? "balanced";

  if (mode === "best-quality" || mode === "recommended") {
    await tryAdd(pngLossless, { pngCompression: compression }, `PNG Lossless (${compression})`, candidates, request);
  }

  if (mode === "recommended") {
    const unique = uniqueColorCount(bitmap.data, bitmap.width, bitmap.height);
    if (unique <= 256) {
      const colors = pickQuantizationColors(bitmap.width, bitmap.height, bitmap.data, "recommended");
      await tryAdd(pngQuantized, { quality: colors, pngCompression: compression, pngMode: "recommended" }, `PNG Palette ${colors}c`, candidates, request);
    }
  }

  if (mode === "maximum" || mode === "recommended") {
    const maxColors = pickQuantizationColors(bitmap.width, bitmap.height, bitmap.data, "maximum");
    await tryAdd(pngQuantized, { quality: maxColors, pngCompression: compression, pngMode: "maximum" }, `PNG Quantized ${maxColors}c`, candidates, request);
  }
}

async function generateJpegCandidates(
  request: CompressRequest,
  candidates: EncodedCandidate[],
): Promise<void> {
  const { mode, quality } = request;

  if (mode === "best-quality") {
    const q = quality ?? 95;
    await tryAdd(jpegEncoder, { quality: q }, `JPEG q${q}`, candidates, request);
  } else if (mode === "recommended") {
    const q = quality ?? 85;
    await tryAdd(jpegEncoder, { quality: q }, `JPEG q${q}`, candidates, request);
  } else if (mode === "maximum") {
    const q = quality ?? 70;
    await tryAdd(jpegEncoder, { quality: q }, `JPEG q${q}`, candidates, request);
    const q2 = Math.max(10, q - 15);
    await tryAdd(jpegEncoder, { quality: q2 }, `JPEG q${q2}`, candidates, request);
  } else {
    const q = quality ?? 80;
    await tryAdd(jpegEncoder, { quality: q }, `JPEG q${q}`, candidates, request);
  }
}

async function generateWebpCandidates(
  request: CompressRequest,
  candidates: EncodedCandidate[],
): Promise<void> {
  const { mode, quality } = request;

  if (mode === "best-quality") {
    const q = quality ?? 90;
    await tryAdd(webpEncoder, { quality: q }, `WebP q${q}`, candidates, request);
  } else if (mode === "recommended") {
    const q = quality ?? 80;
    await tryAdd(webpEncoder, { quality: q }, `WebP q${q}`, candidates, request);
  } else if (mode === "maximum") {
    const q = quality ?? 65;
    await tryAdd(webpEncoder, { quality: q }, `WebP q${q}`, candidates, request);
    const q2 = Math.max(10, q - 15);
    await tryAdd(webpEncoder, { quality: q2 }, `WebP q${q2}`, candidates, request);
  } else {
    const q = quality ?? 80;
    await tryAdd(webpEncoder, { quality: q }, `WebP q${q}`, candidates, request);
  }
}

async function generateAvifCandidates(
  request: CompressRequest,
  candidates: EncodedCandidate[],
): Promise<void> {
  const { mode, quality } = request;

  if (!avifEncoder.isSupported()) return;

  const q = mode === "best-quality" ? (quality ?? 70) : mode === "recommended" ? (quality ?? 60) : (quality ?? 45);
  await tryAdd(avifEncoder, { quality: q }, `AVIF q${q}`, candidates, request);
}

async function tryAdd(
  encoder: EncoderAdapter,
  options: { quality?: number; pngCompression?: "fast" | "balanced" | "maximum"; pngMode?: "lossless" | "recommended" | "maximum" },
  label: string,
  candidates: EncodedCandidate[],
  request: CompressRequest,
): Promise<void> {
  if (request.isCancelled?.()) return;
  try {
    if (!encoder.isSupported()) return;
    const result = await encoder.encode(request.bitmap, options);
    candidates.push({ result, label, pngMode: options.pngMode, quality: options.quality });
  } catch { /* skip */ }
}

function uniqueColorCount(data: Uint8ClampedArray, width: number, height: number): number {
  const seen = new Set<number>();
  const pixelCount = width * height;
  for (let i = 0; i < pixelCount; i += 1) {
    const o = i * 4;
    seen.add((data[o] << 24) | (data[o + 1] << 16) | (data[o + 2] << 8) | data[o + 3]);
  }
  return seen.size;
}
