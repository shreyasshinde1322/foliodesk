import type { ConversionOptions, ResizeMode } from "./types";

export interface Size {
  width: number;
  height: number;
}

const MAX_DIMENSION = 12000;
const MAX_PERCENTAGE = 500;

/**
 * Compute the target output dimensions for a source image.
 *
 * - `keep`: unchanged.
 * - `exact`: force to width/height. With `maintainAspectRatio` the image is
 *   scaled to fit inside the requested box (contain) without distortion.
 * - `max-width` / `max-height`: downscale only, preserving aspect ratio.
 * - `percentage`: scale by 1-500%, never above 100% unless `allowUpscale`.
 */
export function computeTargetSize(
  sourceWidth: number,
  sourceHeight: number,
  options: ConversionOptions,
): Size {
  const safeSource: Size = {
    width: clampDimension(sourceWidth),
    height: clampDimension(sourceHeight),
  };
  if (safeSource.width <= 0 || safeSource.height <= 0) {
    return { width: 1, height: 1 };
  }
  const mode: ResizeMode = options.resizeMode ?? "keep";

  if (mode === "keep") {
    return safeSource;
  }

  if (mode === "exact") {
    const requestedWidth = clampDimension(options.width ?? safeSource.width);
    const requestedHeight = clampDimension(options.height ?? safeSource.height);
    if (options.maintainAspectRatio) {
      const ratio = Math.min(requestedWidth / safeSource.width, requestedHeight / safeSource.height);
      return {
        width: clampDimension(Math.round(safeSource.width * ratio)),
        height: clampDimension(Math.round(safeSource.height * ratio)),
      };
    }
    return { width: requestedWidth, height: requestedHeight };
  }

  if (mode === "max-width") {
    const target = clampDimension(options.width ?? safeSource.width);
    if (target >= safeSource.width) return safeSource;
    const ratio = target / safeSource.width;
    return {
      width: clampDimension(Math.round(safeSource.width * ratio)),
      height: clampDimension(Math.round(safeSource.height * ratio)),
    };
  }

  if (mode === "max-height") {
    const target = clampDimension(options.height ?? safeSource.height);
    if (target >= safeSource.height) return safeSource;
    const ratio = target / safeSource.height;
    return {
      width: clampDimension(Math.round(safeSource.width * ratio)),
      height: clampDimension(Math.round(safeSource.height * ratio)),
    };
  }

  if (mode === "percentage") {
    const pct = clampPercentage(options.percentage ?? 100);
    const ratio = pct / 100;
    if (pct > 100 && options.allowUpscale !== true) return safeSource;
    return {
      width: clampDimension(Math.round(safeSource.width * ratio)),
      height: clampDimension(Math.round(safeSource.height * ratio)),
    };
  }

  return safeSource;
}

export function needsResize(
  sourceWidth: number,
  sourceHeight: number,
  options: ConversionOptions,
): boolean {
  const target = computeTargetSize(sourceWidth, sourceHeight, options);
  return target.width !== sourceWidth || target.height !== sourceHeight;
}

function clampDimension(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(MAX_DIMENSION, Math.round(value));
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Math.min(MAX_PERCENTAGE, Math.max(1, Math.round(value)));
}
