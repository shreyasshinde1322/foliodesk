import type { DecodedBitmap, ImageFormat } from "./types";

export interface FormatRecommendation {
  primary: string;
  note: string;
}

/**
 * Recommend an output format based on transparency and an estimate of color
 * complexity. Pure heuristic — used only to guide the user, never to force an
 * output.
 */
export function recommendFormat(
  sourceFormat: ImageFormat,
  hasAlphaChannel: boolean,
  estimatedColors: number,
): FormatRecommendation {
  if (hasAlphaChannel) {
    return {
      primary: "WebP or PNG",
      note: "The image has transparency — WebP or PNG preserve it; JPG would fill it with a solid background.",
    };
  }
  if (estimatedColors >= 0 && estimatedColors < 256) {
    return {
      primary: "PNG or WebP",
      note: "This looks like a simple graphic with few colors — PNG stays crisp, and WebP is the smallest modern choice.",
    };
  }
  if (sourceFormat === "png") {
    return {
      primary: "WebP or JPG",
      note: "PNGs with many colors are large — re-encoding as WebP or JPG usually cuts size dramatically.",
    };
  }
  return {
    primary: "WebP or JPG",
    note: "This looks like a photo — WebP or JPG give the best size-to-quality balance.",
  };
}

/**
 * Cheap, sampled estimate of how many distinct colors are in the image.
 * Strides across the bitmap so it stays fast even for large photos.
 */
export function estimateUniqueColors(bitmap: DecodedBitmap): number {
  const { width, height, data } = bitmap;
  if (width === 0 || height === 0) return 0;

  const sampleLimit = 60000;
  const pixels = width * height;
  const stride = Math.max(1, Math.floor(pixels / sampleLimit));

  const seen = new Set<number>();
  let count = 0;
  for (let p = 0; p < pixels && count < 200000; p += stride) {
    const i = p * 4;
    const key = (data[i] << 16) | (data[i + 1] << 8) | data[i + 2];
    if (!seen.has(key)) {
      seen.add(key);
      count += 1;
    }
  }
  return count;
}

/** Render dimensions as a reduced "W:H" ratio, e.g. 1920×1080 → "16:9". */
export function aspectRatioLabel(width: number, height: number): string {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const g = gcd(w, h);
  const rw = w / g;
  const rh = h / g;
  if (rw > 1000 || rh > 1000) return `${width}×${height}`;
  return `${rw}:${rh}`;
}

function gcd(a: number, b: number): number {
  let x = a;
  let y = b;
  while (y !== 0) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x || 1;
}
