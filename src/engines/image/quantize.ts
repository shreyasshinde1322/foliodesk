export interface QuantizedImage {
  palette: Uint8Array;
  indices: Uint8Array;
  colorCount: number;
  width: number;
  height: number;
}

const MAX_SAMPLE_PIXELS = 40000;

export function quantizeImage(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  maxColors: number,
): QuantizedImage {
  const pixelCount = width * height;
  const clamped = Math.min(Math.max(2, maxColors), 256);

  // Always copy data so median-cut sorting never mutates the caller's buffer.
  let sampleData: Uint8ClampedArray;
  let sampleCount: number;
  if (pixelCount <= MAX_SAMPLE_PIXELS) {
    sampleData = new Uint8ClampedArray(data);
    sampleCount = pixelCount;
  } else {
    const step = Math.ceil(pixelCount / MAX_SAMPLE_PIXELS);
    sampleCount = Math.ceil(pixelCount / step);
    sampleData = new Uint8ClampedArray(sampleCount * 4);
    let j = 0;
    for (let i = 0; i < pixelCount; i += step) {
      const o = i * 4;
      const d = j * 4;
      sampleData[d] = data[o];
      sampleData[d + 1] = data[o + 1];
      sampleData[d + 2] = data[o + 2];
      sampleData[d + 3] = data[o + 3];
      j += 1;
    }
    sampleCount = j;
  }

  const buckets = medianCut(sampleData, sampleCount, clamped);

  // Build palette from bucket centroids.
  const palette = new Uint8Array(buckets.length * 4);
  const centers = new Uint8Array(buckets.length * 3);
  for (let i = 0; i < buckets.length; i += 1) {
    const b = buckets[i];
    let rSum = 0, gSum = 0, bSum = 0, aSum = 0;
    const count = b.end - b.start;
    for (let j = b.start; j < b.end; j += 1) {
      const o = j * 4;
      rSum += sampleData[o];
      gSum += sampleData[o + 1];
      bSum += sampleData[o + 2];
      aSum += sampleData[o + 3];
    }
    const pi = i * 4;
    palette[pi] = Math.round(rSum / count);
    palette[pi + 1] = Math.round(gSum / count);
    palette[pi + 2] = Math.round(bSum / count);
    palette[pi + 3] = Math.round(aSum / count);
    centers[i * 3] = palette[pi];
    centers[i * 3 + 1] = palette[pi + 1];
    centers[i * 3 + 2] = palette[pi + 2];
  }

  // Map all pixels to nearest palette color.
  const indices = new Uint8Array(pixelCount);
  const numColors = buckets.length;
  for (let i = 0; i < pixelCount; i += 1) {
    const o = i * 4;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let j = 0; j < numColors; j += 1) {
      const c = j * 3;
      const dr = r - centers[c];
      const dg = g - centers[c + 1];
      const db = b - centers[c + 2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = j;
      }
    }
    indices[i] = bestIdx;
  }

  return {
    palette: palette.subarray(0, buckets.length * 4),
    indices,
    colorCount: buckets.length,
    width,
    height,
  };
}

interface Bucket {
  start: number;
  end: number;
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
}

function medianCut(pixels: Uint8ClampedArray, count: number, maxBuckets: number): Bucket[] {
  // Counting sort + median-cut approach.
  // Each bucket tracks its pixel range in the shared `pixels` array.
  // We sort pixels by putting them into a temp buffer via counting sort,
  // then copy back.

  const tempR = new Uint8Array(count);
  const tempG = new Uint8Array(count);
  const tempB = new Uint8Array(count);
  const tempA = new Uint8Array(count);

  const buckets: Bucket[] = [];
  const first = { start: 0, end: count, rMin: 255, rMax: 0, gMin: 255, gMax: 0, bMin: 255, bMax: 0 };
  for (let i = 0; i < count; i += 1) {
    const o = i * 4;
    const r = pixels[o], g = pixels[o + 1], b = pixels[o + 2];
    if (r < first.rMin) first.rMin = r;
    if (r > first.rMax) first.rMax = r;
    if (g < first.gMin) first.gMin = g;
    if (g > first.gMax) first.gMax = g;
    if (b < first.bMin) first.bMin = b;
    if (b > first.bMax) first.bMax = b;
  }
  buckets.push(first);

  let totalBuckets = buckets.length;
  while (totalBuckets < maxBuckets) {
    let bestIdx = -1;
    let bestVol = -1;
    for (let i = 0; i < totalBuckets; i += 1) {
      const b = buckets[i];
      if (b.end - b.start <= 1) continue;
      if (b.rMin === b.rMax && b.gMin === b.gMax && b.bMin === b.bMax) continue;
      const v = (b.rMax - b.rMin + 1) * (b.gMax - b.gMin + 1) * (b.bMax - b.bMin + 1) || 1;
      if (v > bestVol) { bestVol = v; bestIdx = i; }
    }
    if (bestIdx === -1) break;

    const bucket = buckets[bestIdx];
    const rangeR = bucket.rMax - bucket.rMin;
    const rangeG = bucket.gMax - bucket.gMin;
    const rangeB = bucket.bMax - bucket.bMin;
    const channel = rangeR >= rangeG && rangeR >= rangeB ? 0 : rangeG >= rangeB ? 1 : 2;

    // Counting sort on the chosen channel (0-255).
    countingSortByChannel(pixels, tempR, tempG, tempB, tempA, bucket.start, bucket.end, channel);

    // Copy sorted data back into the original array for this bucket's range.
    for (let i = bucket.start; i < bucket.end; i += 1) {
      const d = i * 4;
      const s = (i - bucket.start) * 4;
      pixels[d] = tempR[s];
      pixels[d + 1] = tempG[s];
      pixels[d + 2] = tempB[s];
      pixels[d + 3] = tempA[s];
    }

    // Split at median.
    const mid = (bucket.start + bucket.end) >> 1;

    const left: Bucket = {
      start: bucket.start, end: mid,
      rMin: bucket.rMin, rMax: bucket.rMax,
      gMin: bucket.gMin, gMax: bucket.gMax,
      bMin: bucket.bMin, bMax: bucket.bMax,
    };
    const right: Bucket = {
      start: mid, end: bucket.end,
      rMin: bucket.rMin, rMax: bucket.rMax,
      gMin: bucket.gMin, gMax: bucket.gMax,
      bMin: bucket.bMin, bMax: bucket.bMax,
    };

    recalcBounds(pixels, left);
    recalcBounds(pixels, right);

    buckets[bestIdx] = left;
    buckets.push(right);
    totalBuckets = buckets.length;
  }

  return buckets;
}

function countingSortByChannel(
  src: Uint8ClampedArray,
  outR: Uint8Array, outG: Uint8Array, outB: Uint8Array, outA: Uint8Array,
  start: number, end: number, channel: number,
): void {
  const counts = new Uint32Array(256);

  // Count occurrences.
  for (let i = start; i < end; i += 1) {
    counts[src[i * 4 + channel]] += 1;
  }

  // Prefix sums.
  let total = 0;
  for (let i = 0; i < 256; i += 1) {
    const c = counts[i];
    counts[i] = total;
    total += c;
  }

  // Scatter.
  for (let i = start; i < end; i += 1) {
    const o = i * 4;
    const val = src[o + channel];
    const pos = counts[val];
    const d = pos * 4;
    outR[d] = src[o];
    outG[d] = src[o + 1];
    outB[d] = src[o + 2];
    outA[d] = src[o + 3];
    counts[val] = pos + 1;
  }
}

function recalcBounds(pixels: Uint8ClampedArray, bucket: Bucket): void {
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (let i = bucket.start; i < bucket.end; i += 1) {
    const o = i * 4;
    const r = pixels[o], g = pixels[o + 1], b = pixels[o + 2];
    if (r < rMin) rMin = r;
    if (r > rMax) rMax = r;
    if (g < gMin) gMin = g;
    if (g > gMax) gMax = g;
    if (b < bMin) bMin = b;
    if (b > bMax) bMax = b;
  }
  bucket.rMin = rMin; bucket.rMax = rMax;
  bucket.gMin = gMin; bucket.gMax = gMax;
  bucket.bMin = bMin; bucket.bMax = bMax;
}

export function hasAlphaChannel(data: Uint8ClampedArray, width: number, height: number): boolean {
  const pixelCount = width * height;
  for (let i = 0; i < pixelCount; i += 1) {
    if (data[i * 4 + 3] < 255) return true;
  }
  return false;
}

export function uniqueColorCount(data: Uint8ClampedArray, width: number, height: number): number {
  const seen = new Set<number>();
  const pixelCount = width * height;
  for (let i = 0; i < pixelCount; i += 1) {
    const o = i * 4;
    seen.add((data[o] << 24) | (data[o + 1] << 16) | (data[o + 2] << 8) | data[o + 3]);
  }
  return seen.size;
}

export interface ExactPaletteResult {
  palette: Uint8Array;
  indices: Uint8Array;
  colorCount: number;
  hasAlpha: boolean;
}

export function buildExactPalette(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): ExactPaletteResult | null {
  const pixelCount = width * height;
  const colorMap = new Map<number, number>();
  const paletteRgba: number[] = [];
  const indices = new Uint8Array(pixelCount);
  let hasAlpha = false;

  for (let i = 0; i < pixelCount; i += 1) {
    const o = i * 4;
    const key = (data[o] << 24) | (data[o + 1] << 16) | (data[o + 2] << 8) | data[o + 3];
    let idx = colorMap.get(key);
    if (idx === undefined) {
      if (colorMap.size >= 256) return null;
      idx = colorMap.size;
      colorMap.set(key, idx);
      paletteRgba.push(data[o], data[o + 1], data[o + 2], data[o + 3]);
      if (data[o + 3] < 255) hasAlpha = true;
    }
    indices[i] = idx;
  }

  const colorCount = colorMap.size;
  const palette = new Uint8Array(paletteRgba);
  return { palette, indices, colorCount, hasAlpha };
}
