export type FormatChoice = "webp" | "jpg" | "jxl" | "original";

export interface CompressSettings {
  /** Output format choice; "original" keeps the source format. */
  format: FormatChoice;
  /** Quality for lossy encodes, 1-100. */
  quality: number;
  /** Compare WebP/JPG/AVIF per file and keep the smallest. */
  autoFormat: boolean;
  /** Skip files whose compressed output would be larger than the original. */
  neverLarger: boolean;
  /** Background used when flattening alpha into JPG. */
  background: string;
  /** Target file size in bytes. 0 means no target. */
  targetSize: number;
  /** Display unit for target size input. */
  targetSizeUnit: "kb" | "mb";
  /** Allow the target-size algorithm to reduce dimensions to hit the target. */
  allowResizeForTarget: boolean;
}

export const DEFAULT_SETTINGS: CompressSettings = {
  format: "original",
  quality: 80,
  autoFormat: false,
  neverLarger: true,
  background: "#ffffff",
  targetSize: 0,
  targetSizeUnit: "kb",
  allowResizeForTarget: false,
};

const STORAGE_KEY = "folio-desk.image-compressor.v1";

export function loadCompressSettings(): CompressSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return sanitizeSettings(JSON.parse(raw) as Partial<CompressSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveCompressSettings(settings: CompressSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode or a full storage quota — persistence is best-effort.
  }
}

function sanitizeSettings(input: Partial<CompressSettings>): CompressSettings {
  const defaults = DEFAULT_SETTINGS;
  const formats: FormatChoice[] = ["webp", "jpg", "jxl", "original"];

  return {
    format: includes(formats, input.format) ? input.format! : defaults.format,
    quality: clampNumber(input.quality, 1, 100, defaults.quality),
    autoFormat: input.autoFormat === true,
    neverLarger: input.neverLarger !== false,
    background: /^#[0-9a-fA-F]{6}$/.test(input.background ?? "")
      ? input.background!.toLowerCase()
      : defaults.background,
    targetSize: clampNumber(input.targetSize, 0, 100 * 1024 * 1024, defaults.targetSize),
    targetSizeUnit: input.targetSizeUnit === "mb" ? "mb" : "kb",
    allowResizeForTarget: input.allowResizeForTarget === true,
  };
}

function includes<T extends string>(list: T[], value: T | undefined): value is T {
  return typeof value === "string" && (list as string[]).includes(value);
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;
}
