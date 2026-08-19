"use client";

import type {
  BrowserCapabilities,
  ConversionOptions,
  EncodeFormat,
  PngCompression,
  ResizeMode,
} from "@/engines/image";
import { ENCODE_FORMATS, IMAGE_FORMAT_META } from "@/engines/image";
import { cn } from "@/lib/cn";

const fieldClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]";

const RESIZE_MODES: Array<{ value: ResizeMode; label: string }> = [
  { value: "keep", label: "Keep original" },
  { value: "exact", label: "Exact dimensions" },
  { value: "max-width", label: "Maximum width" },
  { value: "max-height", label: "Maximum height" },
  { value: "percentage", label: "Percentage" },
];

const PNG_COMPRESSION: Array<{ value: PngCompression; label: string }> = [
  { value: "fast", label: "Fastest (largest file)" },
  { value: "balanced", label: "Balanced" },
  { value: "maximum", label: "Maximum (smallest file)" },
];

export function OptionsPanel({
  options,
  capabilities,
  onChange,
}: {
  options: ConversionOptions;
  capabilities: BrowserCapabilities | null;
  onChange: (patch: Partial<ConversionOptions>) => void;
}) {
  const encodeSupport: Record<EncodeFormat, boolean> = capabilities?.encode ?? {
    jpg: true,
    png: true,
    webp: true,
    avif: true,
    jxl: true,
    heic: true,
    gif: true,
  };
  const format = options.outputFormat;

  const showQuality = format === "jpg" || format === "webp" || format === "avif" || format === "jxl";
  const showPngCompression = format === "png";
  const showBackgroundColor = format === "jpg";

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="font-serif text-lg font-semibold text-text">Options</h2>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-text">Output format</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ENCODE_FORMATS.filter((f) => f !== "png").map((output: EncodeFormat) => {
            const supported = encodeSupport[output];
            const selected = options.outputFormat === output;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-2 py-2 text-sm font-semibold transition-colors",
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                  !supported && "cursor-not-allowed opacity-50",
                )}
                disabled={!supported}
                key={output}
                onClick={() => onChange({ outputFormat: output })}
                title={
                  supported
                    ? IMAGE_FORMAT_META[output].label
                    : `${IMAGE_FORMAT_META[output].label} is not supported by this browser`
                }
                type="button"
              >
                {IMAGE_FORMAT_META[output].label}
              </button>
            );
          })}
        </div>
        {!encodeSupport.avif ? (
          <p className="mt-2 text-xs text-muted">
            AVIF is disabled because this browser cannot encode it.
          </p>
        ) : null}
      </fieldset>

      {showQuality ? (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-text" htmlFor="image-quality">
              Quality
            </label>
            <span className="text-sm font-semibold text-primary">{options.quality}</span>
          </div>
          <input
            className="mt-2 w-full accent-[var(--primary)]"
            id="image-quality"
            max="100"
            min="10"
            onInput={(event) => onChange({ quality: Number((event.target as HTMLInputElement).value) })}
            onChange={(event) => onChange({ quality: Number(event.target.value) })}
            step="1"
            type="range"
            value={options.quality}
          />
          <p className="mt-1 text-xs text-muted">Lower size ↔ Higher quality</p>
        </div>
      ) : null}

      {showPngCompression ? (
        <div className="mt-5">
          <label className="text-sm font-semibold text-text" htmlFor="image-png-compression">
            Compression
          </label>
          <select
            className={cn(fieldClass, "mt-1")}
            id="image-png-compression"
            onChange={(event) => onChange({ pngCompression: event.target.value as PngCompression })}
            value={options.pngCompression}
          >
            {PNG_COMPRESSION.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted">
            PNG is always lossless. Higher compression produces smaller files but takes longer.
          </p>
        </div>
      ) : null}

      <div className="mt-5">
        <label className="text-sm font-semibold text-text" htmlFor="image-resize-mode">
          Resize
        </label>
        <select
          className={cn(fieldClass, "mt-1")}
          id="image-resize-mode"
          onChange={(event) => onChange({ resizeMode: event.target.value as ResizeMode })}
          value={options.resizeMode}
        >
          {RESIZE_MODES.map((mode) => (
            <option key={mode.value} value={mode.value}>
              {mode.label}
            </option>
          ))}
        </select>

        {options.resizeMode === "exact" ? (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="image-width">
                Width (px)
              </label>
              <input
                className={cn(fieldClass, "mt-1")}
                id="image-width"
                min="1"
                onChange={(event) => onChange({ width: Number(event.target.value) })}
                placeholder="Auto"
                type="number"
                value={options.width ?? ""}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="image-height">
                Height (px)
              </label>
              <input
                className={cn(fieldClass, "mt-1")}
                id="image-height"
                min="1"
                onChange={(event) => onChange({ height: Number(event.target.value) })}
                placeholder="Auto"
                type="number"
                value={options.height ?? ""}
              />
            </div>
          </div>
        ) : options.resizeMode === "max-width" ? (
          <input
            className={cn(fieldClass, "mt-2")}
            id="image-max-width"
            min="1"
            onChange={(event) => onChange({ width: Number(event.target.value) })}
            placeholder="e.g. 1280"
            type="number"
            value={options.width ?? ""}
          />
        ) : options.resizeMode === "max-height" ? (
          <input
            className={cn(fieldClass, "mt-2")}
            id="image-max-height"
            min="1"
            onChange={(event) => onChange({ height: Number(event.target.value) })}
            placeholder="e.g. 1080"
            type="number"
            value={options.height ?? ""}
          />
        ) : options.resizeMode === "percentage" ? (
          <div className="mt-2 flex items-center gap-3">
            <input
              className={cn(fieldClass, "max-w-[6rem]")}
              id="image-percentage"
              max="500"
              min="1"
              onChange={(event) => onChange({ percentage: Number(event.target.value) })}
              type="number"
              value={options.percentage}
            />
            <span className="text-sm text-muted">%</span>
          </div>
        ) : null}

        {options.resizeMode !== "keep" ? (
          <label className="mt-3 flex items-center gap-2 text-sm text-muted">
            <input
              checked={options.maintainAspectRatio}
              className="h-4 w-4 rounded accent-[var(--primary)]"
              onChange={(event) => onChange({ maintainAspectRatio: event.target.checked })}
              type="checkbox"
            />
            Maintain aspect ratio
          </label>
        ) : null}

        {options.resizeMode === "percentage" && (options.percentage ?? 100) > 100 ? (
          <label className="mt-2 flex items-center gap-2 text-sm text-muted">
            <input
              checked={options.allowUpscale}
              className="h-4 w-4 rounded accent-[var(--primary)]"
              onChange={(event) => onChange({ allowUpscale: event.target.checked })}
              type="checkbox"
            />
            Allow upscaling (only shrink by default)
          </label>
        ) : null}
      </div>

      {showBackgroundColor ? (
        <div className="mt-5">
          <label className="text-sm font-semibold text-text" htmlFor="image-background">
            Background color
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              className="h-9 w-12 cursor-pointer rounded-md border border-border bg-white p-1"
              id="image-background"
              onChange={(event) => onChange({ background: event.target.value })}
              type="color"
              value={options.background}
            />
            <input
              className={cn(fieldClass, "max-w-[7rem]")}
              onChange={(event) => onChange({ background: event.target.value })}
              pattern="^#[0-9a-fA-F]{6}$"
              value={options.background}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Used when converting transparent images to JPG. Transparent areas
            are flattened onto this color.
          </p>
        </div>
      ) : null}
    </div>
  );
}
