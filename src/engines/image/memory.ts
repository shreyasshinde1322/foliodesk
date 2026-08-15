/**
 * Memory safeguards. The converter is fully client-side, so a single huge
 * image can exhaust the tab. We enforce a hard pixel cap and expose a warning
 * threshold so the UI can tell the user before starting a heavy job.
 */
export const MAX_PIXELS = 80_000_000;
export const WARN_PIXELS = 20_000_000;
export const MAX_DIMENSION_PIXELS = 12000;

export function pixelCount(width: number, height: number): number {
  return width * height;
}

/** Estimated peak memory for the RGBA working buffer, in bytes. */
export function estimateWorkingBytes(width: number, height: number): number {
  return width * height * 4;
}

export function isBelowHardLimit(width: number, height: number): boolean {
  return width <= MAX_DIMENSION_PIXELS && height <= MAX_DIMENSION_PIXELS && pixelCount(width, height) <= MAX_PIXELS;
}

export function isHeavy(width: number, height: number): boolean {
  return pixelCount(width, height) >= WARN_PIXELS;
}

/** Human-readable memory estimate, e.g. "192 MB". */
export function formatMegabytes(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / (1024 * 1024)))} MB`;
}
