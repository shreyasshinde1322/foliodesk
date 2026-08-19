export type ResizeMode = "exact" | "percentage" | "max" | "fit-box";

export type ResizeAlgorithm =
  | "lanczos3"
  | "catrom"
  | "mitchell"
  | "triangle"
  | "hqx"
  | "magicKernel"
  | "magicKernelSharp2013"
  | "magicKernelSharp2021";

export type ResizePreset = "web" | "social" | "email" | "thumbnail" | "print" | "custom";

export type FitMode = "contain" | "cover" | "stretch";

export type OutputFormatChoice = "original" | "jpg" | "png" | "webp";

export type SocialRatio = "1:1" | "4:5" | "16:9" | "9:16" | "custom";

export type PrintUnit = "in" | "cm" | "mm";

export const SOCIAL_RATIO_VALUES: Record<SocialRatio, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  custom: 0,
};

export const SOCIAL_OUTPUT_DIMENSIONS: Record<SocialRatio, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "16:9": { width: 1920, height: 1080 },
  "9:16": { width: 1080, height: 1920 },
  custom: { width: 0, height: 0 },
};

export interface ResizeSettings {
  resizeMode: ResizeMode;
  width: number;
  height: number;
  percentage: number;
  maxWidth: number;
  maxHeight: number;
  boxWidth: number;
  boxHeight: number;
  fitMode: FitMode;
  lockAspect: boolean;
  allowUpscale: boolean;
  algorithm: ResizeAlgorithm;
  quality: number;
  outputFormat: OutputFormatChoice;
  background: string;
  preset: ResizePreset;
  socialRatio: SocialRatio;
  printUnit: PrintUnit;
  printDpi: number;
  printPhysicalWidth: number;
  printPhysicalHeight: number;
}

export const DEFAULT_RESIZE_SETTINGS: ResizeSettings = {
  resizeMode: "max",
  width: 1600,
  height: 1600,
  percentage: 50,
  maxWidth: 1600,
  maxHeight: 1600,
  boxWidth: 1200,
  boxHeight: 800,
  fitMode: "contain",
  lockAspect: true,
  allowUpscale: false,
  algorithm: "lanczos3",
  quality: 85,
  outputFormat: "original",
  background: "#ffffff",
  preset: "custom",
  socialRatio: "1:1",
  printUnit: "in",
  printDpi: 300,
  printPhysicalWidth: 6,
  printPhysicalHeight: 4,
};

export const ALGORITHM_PRESETS: Record<string, ResizeAlgorithm> = {
  fast: "triangle",
  balanced: "mitchell",
  "high-quality": "lanczos3",
  "pixel-art": "hqx",
};

export const STORAGE_KEY = "folio-desk.image-resizer.v1";

export function loadResizeSettings(): ResizeSettings {
  if (typeof window === "undefined") return DEFAULT_RESIZE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RESIZE_SETTINGS;
    return sanitizeResizeSettings(JSON.parse(raw) as Partial<ResizeSettings>);
  } catch {
    return DEFAULT_RESIZE_SETTINGS;
  }
}

export function saveResizeSettings(settings: ResizeSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode or full storage.
  }
}

function sanitizeResizeSettings(input: Partial<ResizeSettings>): ResizeSettings {
  const d = DEFAULT_RESIZE_SETTINGS;
  return {
    resizeMode: ["exact", "percentage", "max", "fit-box"].includes(input.resizeMode as string)
      ? (input.resizeMode as ResizeMode)
      : d.resizeMode,
    width: clampInt(input.width, 1, 16384, d.width),
    height: clampInt(input.height, 1, 16384, d.height),
    percentage: clampInt(input.percentage, 1, 500, d.percentage),
    maxWidth: clampInt(input.maxWidth, 1, 16384, d.maxWidth),
    maxHeight: clampInt(input.maxHeight, 1, 16384, d.maxHeight),
    boxWidth: clampInt(input.boxWidth, 1, 16384, d.boxWidth),
    boxHeight: clampInt(input.boxHeight, 1, 16384, d.boxHeight),
    fitMode: ["contain", "cover", "stretch"].includes(input.fitMode as string)
      ? (input.fitMode as FitMode)
      : d.fitMode,
    lockAspect: input.lockAspect !== false,
    allowUpscale: input.allowUpscale === true,
    algorithm: (input.algorithm as ResizeAlgorithm) || d.algorithm,
    quality: clampInt(input.quality, 1, 100, d.quality),
    outputFormat: ["original", "jpg", "png", "webp"].includes(input.outputFormat as string)
      ? (input.outputFormat as OutputFormatChoice)
      : d.outputFormat,
    background: /^#[0-9a-fA-F]{6}$/.test(input.background ?? "")
      ? input.background!.toLowerCase()
      : d.background,
    preset: (input.preset as ResizePreset) || d.preset,
    socialRatio: (["1:1", "4:5", "16:9", "9:16", "custom"] as string[]).includes(input.socialRatio as string)
      ? (input.socialRatio as SocialRatio)
      : d.socialRatio,
    printUnit: (["in", "cm", "mm"] as string[]).includes(input.printUnit as string)
      ? (input.printUnit as PrintUnit)
      : d.printUnit,
    printDpi: clampInt(input.printDpi, 1, 2400, d.printDpi),
    printPhysicalWidth: clampFloat(input.printPhysicalWidth, 0.1, 999, d.printPhysicalWidth),
    printPhysicalHeight: clampFloat(input.printPhysicalHeight, 0.1, 999, d.printPhysicalHeight),
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampFloat(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value * 100) / 100));
}

export function physicalToPixels(
  physicalSize: number,
  unit: PrintUnit,
  dpi: number,
): number {
  let inches: number;
  switch (unit) {
    case "cm":
      inches = physicalSize / 2.54;
      break;
    case "mm":
      inches = physicalSize / 25.4;
      break;
    default:
      inches = physicalSize;
  }
  return Math.round(inches * dpi);
}

export function getSocialTargetRatio(
  ratio: SocialRatio,
  srcWidth: number,
  srcHeight: number,
): { targetWidth: number; targetHeight: number } {
  const fixed = SOCIAL_OUTPUT_DIMENSIONS[ratio];
  if (fixed && fixed.width > 0 && fixed.height > 0) {
    return { targetWidth: fixed.width, targetHeight: fixed.height };
  }
  return { targetWidth: srcWidth, targetHeight: srcHeight };
}

export interface ContainResult {
  canvasWidth: number;
  canvasHeight: number;
  drawWidth: number;
  drawHeight: number;
  drawX: number;
  drawY: number;
}

export function computeContain(
  srcWidth: number,
  srcHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): ContainResult {
  const scale = Math.min(canvasWidth / srcWidth, canvasHeight / srcHeight);
  const drawWidth = Math.round(srcWidth * scale);
  const drawHeight = Math.round(srcHeight * scale);
  return {
    canvasWidth,
    canvasHeight,
    drawWidth,
    drawHeight,
    drawX: Math.round((canvasWidth - drawWidth) / 2),
    drawY: Math.round((canvasHeight - drawHeight) / 2),
  };
}

export function computeSocialContain(
  srcWidth: number,
  srcHeight: number,
  settings: ResizeSettings,
): ContainResult | null {
  if (settings.preset !== "social" || settings.socialRatio === "custom") return null;
  const { targetWidth, targetHeight } = getSocialTargetRatio(
    settings.socialRatio,
    srcWidth,
    srcHeight,
  );
  if (targetWidth === srcWidth && targetHeight === srcHeight) return null;
  const maxDim = Math.max(settings.maxWidth, settings.maxHeight);
  let cw = targetWidth;
  let ch = targetHeight;
  if (cw > maxDim || ch > maxDim) {
    const s = Math.min(maxDim / cw, maxDim / ch);
    cw = Math.round(cw * s);
    ch = Math.round(ch * s);
  }
  return computeContain(srcWidth, srcHeight, cw, ch);
}

export function printPixelDimensions(settings: ResizeSettings): { width: number; height: number } {
  return {
    width: physicalToPixels(settings.printPhysicalWidth, settings.printUnit, settings.printDpi),
    height: physicalToPixels(settings.printPhysicalHeight, settings.printUnit, settings.printDpi),
  };
}

export function needsUpscale(
  srcWidth: number,
  srcHeight: number,
  targetWidth: number,
  targetHeight: number,
): boolean {
  return targetWidth > srcWidth || targetHeight > srcHeight;
}

/**
 * Compute the target output dimensions based on the resize settings and
 * original image dimensions.
 */
export function computeTargetDimensions(
  srcWidth: number,
  srcHeight: number,
  settings: ResizeSettings,
): { width: number; height: number } {
  if (settings.preset === "print") {
    const { width: pw, height: ph } = printPixelDimensions(settings);
    if (!settings.allowUpscale && needsUpscale(srcWidth, srcHeight, pw, ph)) {
      const scale = Math.min(srcWidth / pw, srcHeight / ph);
      return {
        width: Math.max(1, Math.round(pw * scale)),
        height: Math.max(1, Math.round(ph * scale)),
      };
    }
    return { width: Math.max(1, pw), height: Math.max(1, ph) };
  }

  if (settings.preset === "social" && settings.socialRatio !== "custom") {
    const contain = computeSocialContain(srcWidth, srcHeight, settings);
    if (contain) {
      return { width: contain.canvasWidth, height: contain.canvasHeight };
    }
    return { width: srcWidth, height: srcHeight };
  }

  const { resizeMode } = settings;
  const aspect = srcWidth / srcHeight;

  if (resizeMode === "exact") {
    const w = settings.width;
    let h = settings.height;
    if (settings.lockAspect) {
      h = Math.round(w / aspect);
    }
    return { width: Math.max(1, w), height: Math.max(1, h) };
  }

  if (resizeMode === "percentage") {
    const scale = settings.percentage / 100;
    let w = Math.round(srcWidth * scale);
    let h = Math.round(srcHeight * scale);
    if (!settings.allowUpscale && scale > 1) {
      w = srcWidth;
      h = srcHeight;
    }
    return { width: Math.max(1, w), height: Math.max(1, h) };
  }

  if (resizeMode === "max") {
    let w = srcWidth;
    let h = srcHeight;
    if (srcWidth > settings.maxWidth || srcHeight > settings.maxHeight) {
      const scaleW = settings.maxWidth / srcWidth;
      const scaleH = settings.maxHeight / srcHeight;
      const scale = Math.min(scaleW, scaleH);
      w = Math.round(srcWidth * scale);
      h = Math.round(srcHeight * scale);
    } else if (!settings.allowUpscale) {
      return { width: srcWidth, height: srcHeight };
    }
    return { width: Math.max(1, w), height: Math.max(1, h) };
  }

  if (resizeMode === "fit-box") {
    const bw = settings.boxWidth;
    const bh = settings.boxHeight;
    if (settings.fitMode === "stretch") {
      return { width: Math.max(1, bw), height: Math.max(1, bh) };
    }
    const scale = Math.min(bw / srcWidth, bh / srcHeight);
    return {
      width: Math.max(1, Math.round(srcWidth * scale)),
      height: Math.max(1, Math.round(srcHeight * scale)),
    };
  }

  return { width: srcWidth, height: srcHeight };
}
