import { ENCODE_FORMATS } from "./formats";
import type { ConversionOptions, EncodeFormat } from "./types";

export const DEFAULT_OPTIONS: ConversionOptions = {
  outputFormat: "webp",
  quality: 85,
  background: "#ffffff",
  resizeMode: "keep",
  width: undefined,
  height: undefined,
  percentage: 100,
  maintainAspectRatio: true,
};

export function normalizeConversionOptions(
  input: Partial<ConversionOptions> = {},
): ConversionOptions {
  const format = toEncodeFormat(input.outputFormat) ?? DEFAULT_OPTIONS.outputFormat;
  return {
    outputFormat: format,
    quality: clampQuality(input.quality),
    background: normalizeHexColor(input.background),
    resizeMode: input.resizeMode ?? "keep",
    width: clampPositiveInt(input.width),
    height: clampPositiveInt(input.height),
    percentage: clampPercentage(input.percentage),
    maintainAspectRatio: input.maintainAspectRatio ?? true,
  };
}

export function clampQuality(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return DEFAULT_OPTIONS.quality;
  return Math.min(100, Math.max(10, Math.round(value)));
}

export function clampPercentage(value: number | undefined): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 100;
  return Math.min(500, Math.max(1, Math.round(value)));
}

export function clampPositiveInt(value: number | undefined): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value) || value <= 0) return undefined;
  return Math.round(value);
}

export function normalizeHexColor(value: string | undefined): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec((value ?? "").trim());
  if (match) return `#${match[1].toLowerCase()}`;
  return DEFAULT_OPTIONS.background;
}

function toEncodeFormat(value: EncodeFormat | undefined): EncodeFormat | undefined {
  if (value && ENCODE_FORMATS.includes(value)) return value;
  return undefined;
}
