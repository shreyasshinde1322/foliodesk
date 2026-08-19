import type {
  CompressRequest,
  CompressResult,
  EncodedCandidate,
  NormalizedImage,
} from "./core/types";
import { generateCandidates } from "./strategies/smart";
import { generatePngCandidates, selectBestCandidate } from "./optimizers/target-size";
import { validateOutput, validateLossless } from "./validators/validate";

export async function compressImage(request: CompressRequest): Promise<CompressResult> {
  const { bitmap, outputFormat, mode, targetSizeBytes, pngCompression, allowResize, isCancelled } = request;
  const hasTarget = mode === "target-size" && targetSizeBytes !== undefined && targetSizeBytes > 0;

  let candidates: EncodedCandidate[] = [];

  if (hasTarget && outputFormat === "png") {
    const targetCandidates = await generatePngCandidates(
      bitmap,
      targetSizeBytes,
      pngCompression ?? "balanced",
      allowResize ?? false,
      isCancelled,
    );
    candidates = targetCandidates.map((tc) => tc.result);

    const best = selectBestCandidate(targetCandidates, targetSizeBytes);
    const validated = best ? await validateCandidate(best.result, bitmap, outputFormat) : null;

    return {
      candidates,
      best: validated ?? best?.result ?? candidates[0],
      targetAchieved: best !== null && best.sizeBytes <= targetSizeBytes,
      actualSizeBytes: best?.result.result.data.byteLength ?? 0,
      targetSizeBytes,
    };
  }

  if (hasTarget && outputFormat !== "png") {
    candidates = await generateCandidates({
      ...request,
      mode: "recommended",
    });

    const qualitySearch = await searchQualityForTarget(bitmap, request, targetSizeBytes);
    if (qualitySearch) {
      candidates.push(qualitySearch);
    }

    const best = selectBestFromList(candidates, targetSizeBytes);
    const validated = best ? await validateCandidate(best, bitmap, outputFormat) : null;

    return {
      candidates,
      best: validated ?? best ?? candidates[0],
      targetAchieved: best !== null && best.result.data.byteLength <= targetSizeBytes,
      actualSizeBytes: best?.result.data.byteLength ?? 0,
      targetSizeBytes,
    };
  }

  candidates = await generateCandidates(request);

  if (candidates.length === 0) {
    throw new Error("No compression candidate could be produced.");
  }

  const best = selectSmallest(candidates);
  const validated = await validateCandidate(best, bitmap, outputFormat);

  return {
    candidates,
    best: validated ?? best,
    targetAchieved: false,
    actualSizeBytes: best.result.data.byteLength,
    targetSizeBytes: 0,
  };
}

async function validateCandidate(
  candidate: EncodedCandidate,
  input: NormalizedImage,
  outputFormat: string,
): Promise<EncodedCandidate | null> {
  if (outputFormat === "png" && candidate.pngMode === "lossless") {
    const result = await validateLossless(input, candidate.result);
    if (!result.valid) return null;
    return candidate;
  }

  const result = await validateOutput(input, candidate.result);
  if (!result.valid) return null;
  return candidate;
}

async function searchQualityForTarget(
  bitmap: NormalizedImage,
  request: CompressRequest,
  targetSizeBytes: number,
): Promise<EncodedCandidate | null> {
  const { outputFormat, isCancelled } = request;
  let low = 10;
  let high = 100;
  let best: EncodedCandidate | null = null;

  for (let i = 0; i < 6; i += 1) {
    if (isCancelled?.()) break;
    const mid = Math.round((low + high) / 2);

    let candidate: EncodedCandidate | null = null;
    try {
      if (outputFormat === "jpg") {
        const { JpegEncoder } = await import("./encoders/jpeg");
        const enc = new JpegEncoder();
        const result = await enc.encode(bitmap, { quality: mid });
        candidate = { result, label: `JPEG q${mid} (binary search)`, quality: mid };
      } else if (outputFormat === "webp") {
        const { WebpEncoder } = await import("./encoders/webp");
        const enc = new WebpEncoder();
        const result = await enc.encode(bitmap, { quality: mid });
        candidate = { result, label: `WebP q${mid} (binary search)`, quality: mid };
      } else if (outputFormat === "avif") {
        const { AvifEncoder } = await import("./encoders/avif");
        const enc = new AvifEncoder();
        if (enc.isSupported()) {
          const result = await enc.encode(bitmap, { quality: mid });
          candidate = { result, label: `AVIF q${mid} (binary search)`, quality: mid };
        }
      }
    } catch { /* skip */ }

    if (!candidate) break;

    if (!best || candidate.result.data.byteLength < best.result.data.byteLength) {
      best = candidate;
    }

    if (candidate.result.data.byteLength <= targetSizeBytes) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return best;
}

function selectBestFromList(candidates: EncodedCandidate[], targetSizeBytes: number): EncodedCandidate | null {
  let best: EncodedCandidate | null = null;
  let bestSize = Infinity;

  for (const c of candidates) {
    const size = c.result.data.byteLength;
    if (size <= targetSizeBytes && size < bestSize) {
      best = c;
      bestSize = size;
    }
  }

  if (best) return best;

  let smallest: EncodedCandidate | null = null;
  for (const c of candidates) {
    if (!smallest || c.result.data.byteLength < smallest.result.data.byteLength) {
      smallest = c;
    }
  }
  return smallest;
}

function selectSmallest(candidates: EncodedCandidate[]): EncodedCandidate {
  return candidates.reduce((a, b) =>
    a.result.data.byteLength <= b.result.data.byteLength ? a : b,
  );
}
