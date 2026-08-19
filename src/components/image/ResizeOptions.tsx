"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import type {
  ResizeSettings,
  ResizeMode,
  ResizeAlgorithm,
  FitMode,
  OutputFormatChoice,
  ResizePreset,
  SocialRatio,
  PrintUnit,
} from "./resize-settings";
import {
  computeTargetDimensions,
  computeSocialContain,
  printPixelDimensions,
} from "./resize-settings";

const fieldClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]";

const checkboxClass = "h-4 w-4 rounded border-border accent-[var(--primary)]";

const PRESETS: Array<{ value: ResizePreset; label: string; summary: string }> = [
  {
    value: "web",
    label: "Web",
    summary: "Maximum 1600 px, preserve aspect ratio, no upscaling.",
  },
  {
    value: "social",
    label: "Social",
    summary: "Prepare for a selected aspect ratio with optional crop.",
  },
  {
    value: "email",
    label: "Email",
    summary: "Resize to a practical maximum for email use.",
  },
  {
    value: "thumbnail",
    label: "Thumbnail",
    summary: "Create a smaller preview while preserving aspect ratio.",
  },
  {
    value: "print",
    label: "Print",
    summary: "Calculate pixel dimensions from physical size and DPI.",
  },
  {
    value: "custom",
    label: "Custom",
    summary: "Full control over resize behavior.",
  },
];

const RESIZE_MODES: Array<{ value: ResizeMode; label: string }> = [
  { value: "max", label: "Maximum Dimensions" },
  { value: "exact", label: "Exact Dimensions" },
  { value: "percentage", label: "Percentage" },
  { value: "fit-box", label: "Fit to Box" },
];

const OUTPUT_FORMATS: Array<{ value: OutputFormatChoice; label: string }> = [
  { value: "original", label: "Keep original" },
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
];

const PERCENTAGE_QUICK = [25, 50, 75, 100, 150, 200];

const ALGORITHM_PRESET_OPTIONS: Array<{ label: string; algorithm: ResizeAlgorithm }> = [
  { label: "Fast (Triangle)", algorithm: "triangle" },
  { label: "Balanced (Mitchell)", algorithm: "mitchell" },
  { label: "High Quality (Lanczos3)", algorithm: "lanczos3" },
  { label: "Pixel Art (HQX)", algorithm: "hqx" },
];

const ALL_ALGORITHMS: Array<{ value: ResizeAlgorithm; label: string }> = [
  { value: "lanczos3", label: "Lanczos3" },
  { value: "catrom", label: "Catrom" },
  { value: "mitchell", label: "Mitchell" },
  { value: "triangle", label: "Triangle" },
  { value: "hqx", label: "HQX" },
  { value: "magicKernel", label: "Magic Kernel" },
  { value: "magicKernelSharp2013", label: "Magic Kernel Sharp 2013" },
  { value: "magicKernelSharp2021", label: "Magic Kernel Sharp 2021" },
];

const FIT_MODES: Array<{ value: FitMode; label: string }> = [
  { value: "contain", label: "Contain" },
  { value: "cover", label: "Cover" },
  { value: "stretch", label: "Stretch" },
];

const SOCIAL_RATIOS: Array<{ value: SocialRatio; label: string }> = [
  { value: "1:1", label: "1:1" },
  { value: "4:5", label: "4:5" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "custom", label: "Custom" },
];

const PRINT_UNITS: Array<{ value: PrintUnit; label: string }> = [
  { value: "in", label: "Inches" },
  { value: "cm", label: "cm" },
  { value: "mm", label: "mm" },
];

const PRINT_DPI_OPTIONS = [72, 96, 150, 300];

function applyPreset(preset: ResizePreset): Partial<ResizeSettings> {
  switch (preset) {
    case "web":
      return {
        preset: "web",
        resizeMode: "max",
        maxWidth: 1600,
        maxHeight: 1600,
        lockAspect: true,
        allowUpscale: false,
        algorithm: "lanczos3",
        outputFormat: "original",
      };
    case "social":
      return {
        preset: "social",
        resizeMode: "max",
        maxWidth: 1600,
        maxHeight: 1600,
        socialRatio: "1:1",
        lockAspect: true,
        allowUpscale: false,
        algorithm: "lanczos3",
        outputFormat: "original",
      };
    case "email":
      return {
        preset: "email",
        resizeMode: "max",
        maxWidth: 1600,
        maxHeight: 1600,
        lockAspect: true,
        allowUpscale: false,
        algorithm: "lanczos3",
        outputFormat: "original",
      };
    case "thumbnail":
      return {
        preset: "thumbnail",
        resizeMode: "max",
        maxWidth: 800,
        maxHeight: 800,
        lockAspect: true,
        allowUpscale: false,
        algorithm: "lanczos3",
        outputFormat: "original",
      };
    case "print":
      return {
        preset: "print",
        resizeMode: "exact",
        algorithm: "lanczos3",
        allowUpscale: false,
        outputFormat: "original",
        lockAspect: false,
      };
    case "custom":
      return { preset: "custom" };
  }
}

function matchPreset(settings: ResizeSettings): ResizePreset {
  const p = settings.preset;
  if (p === "custom") return "custom";

  if (p === "web") {
    if (
      settings.resizeMode === "max" &&
      settings.maxWidth === 1600 &&
      settings.maxHeight === 1600 &&
      settings.lockAspect === true &&
      settings.allowUpscale === false &&
      settings.algorithm === "lanczos3" &&
      settings.outputFormat === "original"
    ) return "web";
    return "custom";
  }

  if (p === "social") {
    if (
      settings.resizeMode === "max" &&
      settings.maxWidth === 1600 &&
      settings.maxHeight === 1600 &&
      settings.lockAspect === true &&
      settings.allowUpscale === false &&
      settings.algorithm === "lanczos3" &&
      settings.outputFormat === "original"
    ) return "social";
    return "custom";
  }

  if (p === "email") {
    if (
      settings.resizeMode === "max" &&
      settings.maxWidth === 1600 &&
      settings.maxHeight === 1600 &&
      settings.lockAspect === true &&
      settings.allowUpscale === false &&
      settings.algorithm === "lanczos3" &&
      settings.outputFormat === "original"
    ) return "email";
    return "custom";
  }

  if (p === "thumbnail") {
    if (
      settings.resizeMode === "max" &&
      settings.maxWidth === 800 &&
      settings.maxHeight === 800 &&
      settings.lockAspect === true &&
      settings.allowUpscale === false &&
      settings.algorithm === "lanczos3" &&
      settings.outputFormat === "original"
    ) return "thumbnail";
    return "custom";
  }

  if (p === "print") {
    if (
      settings.resizeMode === "exact" &&
      settings.algorithm === "lanczos3" &&
      settings.allowUpscale === false &&
      settings.outputFormat === "original"
    ) return "print";
    return "custom";
  }

  return "custom";
}

export function ResizeOptions({
  settings,
  onChange,
  srcWidth,
  srcHeight,
}: {
  settings: ResizeSettings;
  onChange: (patch: Partial<ResizeSettings>) => void;
  srcWidth: number;
  srcHeight: number;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const update = useCallback(
    (patch: Partial<ResizeSettings>) => {
      const next = { ...settings, ...patch };
      const detected = matchPreset(next);
      if (detected !== settings.preset) {
        patch = { ...patch, preset: detected };
      }
      onChange(patch);
    },
    [onChange, settings],
  );
  const target = computeTargetDimensions(srcWidth, srcHeight, settings);
  const socialContain =
    settings.preset === "social" && settings.socialRatio !== "custom" && srcWidth > 0 && srcHeight > 0
      ? computeSocialContain(srcWidth, srcHeight, settings)
      : null;
  const printPixels = settings.preset === "print" ? printPixelDimensions(settings) : null;
  const customDpi = !PRINT_DPI_OPTIONS.includes(settings.printDpi);

  const showQuality = settings.outputFormat === "jpg" || settings.outputFormat === "webp";
  const showBackground = settings.outputFormat === "jpg";

  const activePreset = PRESETS.find((p) => p.value === settings.preset) ?? PRESETS[5];
  const isCustom = settings.preset === "custom";
  const isPrint = settings.preset === "print";
  const isSocial = settings.preset === "social";

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="font-serif text-lg font-semibold text-text">Resize Options</h2>

      {/* Presets */}
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-text">Presets</legend>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => {
            const selected = settings.preset === preset.value;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                )}
                key={preset.value}
                onClick={() => {
                  const patch = applyPreset(preset.value);
                  onChange(patch);
                }}
                type="button"
              >
                {preset.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">{activePreset.summary}</p>
      </fieldset>

      {/* ===== SOCIAL: Aspect Ratio Selector ===== */}
      {isSocial && (
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-text">Aspect Ratio</legend>
          <div className="mt-2 grid grid-cols-5 gap-1.5">
            {SOCIAL_RATIOS.map((ratio) => {
              const selected = settings.socialRatio === ratio.value;
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-2 py-2 text-xs font-semibold transition-colors",
                    selected
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                  )}
                  key={ratio.value}
                  onClick={() => update({ socialRatio: ratio.value })}
                  type="button"
                >
                  {ratio.label}
                </button>
              );
            })}
          </div>
          {socialContain && (
            <p className="mt-2 text-xs text-muted">
              Image will be fitted inside {socialContain.canvasWidth}&times;{socialContain.canvasHeight}
              {" "}({settings.socialRatio}). Background color fills any padding.
            </p>
          )}
        </fieldset>
      )}

      {/* ===== PRINT: Physical Dimensions ===== */}
      {isPrint && (
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-text">Physical Dimensions</legend>

          <div className="mt-2 grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="print-width">
                Width
              </label>
              <input
                className={cn(fieldClass, "mt-1")}
                id="print-width"
                min="0.1"
                onChange={(event) => update({ printPhysicalWidth: Number(event.target.value) })}
                step="0.1"
                type="number"
                value={settings.printPhysicalWidth}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="print-height">
                Height
              </label>
              <input
                className={cn(fieldClass, "mt-1")}
                id="print-height"
                min="0.1"
                onChange={(event) => update({ printPhysicalHeight: Number(event.target.value) })}
                step="0.1"
                type="number"
                value={settings.printPhysicalHeight}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="print-unit">
                Units
              </label>
              <select
                className={cn(fieldClass, "mt-1")}
                id="print-unit"
                onChange={(event) => update({ printUnit: event.target.value as PrintUnit })}
                value={settings.printUnit}
              >
                {PRINT_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs font-medium text-muted" htmlFor="print-dpi">
              DPI
            </label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {PRINT_DPI_OPTIONS.map((dpi) => (
                <button
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-semibold transition-colors",
                    settings.printDpi === dpi && !customDpi
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                  )}
                  key={dpi}
                  onClick={() => update({ printDpi: dpi })}
                  type="button"
                >
                  {dpi}
                </button>
              ))}
              <input
                className={cn(
                  fieldClass,
                  "max-w-[5rem]",
                  customDpi && "border-primary bg-primary-soft text-primary",
                )}
                min="1"
                onChange={(event) => update({ printDpi: Number(event.target.value) })}
                placeholder="Custom"
                type="number"
                value={customDpi ? settings.printDpi : ""}
              />
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-border bg-[var(--bg-subtle,#f9fafb)] px-3 py-2 text-xs text-muted">
            Pixel dimensions: {printPixels?.width ?? 0} &times; {printPixels?.height ?? 0} px
          </div>

          {srcWidth > 0 &&
            srcHeight > 0 &&
            printPixels &&
            (printPixels.width > srcWidth || printPixels.height > srcHeight) && (
              <div className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                The source image ({srcWidth}&times;{srcHeight}) has fewer pixels than the target
                ({printPixels.width}&times;{printPixels.height}). Upscaling is disabled — the output
                will be constrained to the source dimensions. DPI does not create image detail.
              </div>
            )}
        </fieldset>
      )}

      {/* ===== Resize Mode (visible for Custom and Social with custom ratio) ===== */}
      {(isCustom || (isSocial && settings.socialRatio === "custom")) && (
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-text">Resize Mode</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {RESIZE_MODES.map((mode) => {
              const selected = settings.resizeMode === mode.value;
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-2 py-2 text-sm font-semibold transition-colors",
                    selected
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                  )}
                  key={mode.value}
                  onClick={() => update({ resizeMode: mode.value })}
                  type="button"
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* ===== Mode-specific controls ===== */}
      <div className="mt-4">
        {settings.resizeMode === "exact" && !isPrint && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted" htmlFor="resize-width">
                  Width (px)
                </label>
                <input
                  className={cn(fieldClass, "mt-1")}
                  id="resize-width"
                  min="1"
                  onChange={(event) => {
                    const w = Number(event.target.value);
                    const patch: Partial<ResizeSettings> = { width: w };
                    if (settings.lockAspect && srcWidth > 0) {
                      patch.height = Math.round(w / (srcWidth / srcHeight));
                    }
                    update(patch);
                  }}
                  type="number"
                  value={settings.width}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted" htmlFor="resize-height">
                  Height (px)
                </label>
                <input
                  className={cn(fieldClass, "mt-1")}
                  id="resize-height"
                  min="1"
                  onChange={(event) => {
                    const h = Number(event.target.value);
                    const patch: Partial<ResizeSettings> = { height: h };
                    if (settings.lockAspect && srcHeight > 0) {
                      patch.width = Math.round(h * (srcWidth / srcHeight));
                    }
                    update(patch);
                  }}
                  type="number"
                  value={settings.height}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
              <input
                checked={settings.lockAspect}
                className={cn(checkboxClass, "mt-0.5")}
                onChange={(event) => update({ lockAspect: event.target.checked })}
                type="checkbox"
              />
              <span>
                <span className="font-semibold">Lock aspect ratio</span>
                {settings.lockAspect && (
                  <span className="block text-xs font-normal text-muted">
                    Width and height stay proportional to the original.
                  </span>
                )}
              </span>
            </label>
            {!settings.lockAspect && (
              <p className="text-xs text-amber-600">
                Unlocked aspect ratio may distort the image.
              </p>
            )}
          </div>
        )}

        {settings.resizeMode === "percentage" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {PERCENTAGE_QUICK.map((pct) => (
                <button
                  className={cn(
                    "rounded-[var(--radius-sm)] border px-2 py-1 text-xs font-semibold transition-colors",
                    settings.percentage === pct
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                  )}
                  key={pct}
                  onClick={() => update({ percentage: pct })}
                  type="button"
                >
                  {pct}%
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                className={cn(fieldClass, "max-w-[6rem]")}
                max="500"
                min="1"
                onChange={(event) => update({ percentage: Number(event.target.value) })}
                type="number"
                value={settings.percentage}
              />
              <span className="text-sm text-muted">%</span>
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
              <input
                checked={settings.allowUpscale}
                className={cn(checkboxClass, "mt-0.5")}
                onChange={(event) => update({ allowUpscale: event.target.checked })}
                type="checkbox"
              />
              <span className="font-semibold">Allow upscaling</span>
            </label>
            {settings.percentage > 100 && (
              <p className="text-xs text-amber-600">
                Scaling above 100% will upscale the image and may reduce quality.
              </p>
            )}
          </div>
        )}

        {settings.resizeMode === "max" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted" htmlFor="resize-max-width">
                  Max width (px)
                </label>
                <input
                  className={cn(fieldClass, "mt-1")}
                  id="resize-max-width"
                  min="1"
                  onChange={(event) => update({ maxWidth: Number(event.target.value) })}
                  type="number"
                  value={settings.maxWidth}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted" htmlFor="resize-max-height">
                  Max height (px)
                </label>
                <input
                  className={cn(fieldClass, "mt-1")}
                  id="resize-max-height"
                  min="1"
                  onChange={(event) => update({ maxHeight: Number(event.target.value) })}
                  type="number"
                  value={settings.maxHeight}
                />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
              <input
                checked={settings.allowUpscale}
                className={cn(checkboxClass, "mt-0.5")}
                onChange={(event) => update({ allowUpscale: event.target.checked })}
                type="checkbox"
              />
              <span className="font-semibold">Allow upscaling</span>
            </label>
          </div>
        )}

        {settings.resizeMode === "fit-box" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted" htmlFor="resize-box-width">
                  Box width
                </label>
                <input
                  className={cn(fieldClass, "mt-1")}
                  id="resize-box-width"
                  min="1"
                  onChange={(event) => update({ boxWidth: Number(event.target.value) })}
                  type="number"
                  value={settings.boxWidth}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted" htmlFor="resize-box-height">
                  Box height
                </label>
                <input
                  className={cn(fieldClass, "mt-1")}
                  id="resize-box-height"
                  min="1"
                  onChange={(event) => update({ boxHeight: Number(event.target.value) })}
                  type="number"
                  value={settings.boxHeight}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted" htmlFor="resize-fit-mode">
                Fit mode
              </label>
              <div className="mt-1 flex gap-1.5">
                {FIT_MODES.map((mode) => (
                  <button
                    className={cn(
                      "flex-1 rounded-[var(--radius-sm)] border px-2 py-1.5 text-xs font-semibold transition-colors",
                      settings.fitMode === mode.value
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                    )}
                    key={mode.value}
                    onClick={() => update({ fitMode: mode.value })}
                    type="button"
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Target summary (non-print) */}
        {!isPrint && (
          <div className="mt-3 rounded-lg border border-border bg-[var(--bg-subtle,#f9fafb)] px-3 py-2 text-xs text-muted">
            Target: {target.width} &times; {target.height}
          </div>
        )}
      </div>

      {/* Output Format */}
      <fieldset className="mt-5">
        <legend className="text-sm font-semibold text-text">Output Format</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OUTPUT_FORMATS.map((fmt) => {
            const selected = settings.outputFormat === fmt.value;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-2 py-2 text-sm font-semibold transition-colors",
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                )}
                key={fmt.value}
                onClick={() => update({ outputFormat: fmt.value })}
                type="button"
              >
                {fmt.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Quality slider */}
      {showQuality && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-text" htmlFor="resize-quality">
              Quality
            </label>
            <span className="text-sm font-semibold text-primary">{settings.quality}</span>
          </div>
          <input
            className="mt-2 w-full accent-[var(--primary)]"
            id="resize-quality"
            max="100"
            min="1"
            onInput={(event) => update({ quality: Number((event.target as HTMLInputElement).value) })}
            onChange={(event) => update({ quality: Number(event.target.value) })}
            step="1"
            type="range"
            value={settings.quality}
          />
          <p className="mt-1 text-xs text-muted">Lower = smaller file, higher = better detail.</p>
        </div>
      )}

      {/* Background color */}
      {showBackground && (
        <div className="mt-5">
          <label className="text-sm font-semibold text-text" htmlFor="resize-background">
            Background color
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              className="h-9 w-12 cursor-pointer rounded-md border border-border bg-white p-1"
              id="resize-background"
              onChange={(event) => update({ background: event.target.value })}
              type="color"
              value={settings.background}
            />
            <input
              className={cn(fieldClass, "max-w-[7rem]")}
              onChange={(event) => update({ background: event.target.value })}
              pattern="^#[0-9a-fA-F]{6}$"
              value={settings.background}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Used when converting transparent images to JPG. Transparent areas
            are flattened onto this color.
          </p>
        </div>
      )}

      {/* Advanced Settings */}
      {isCustom && (
        <div className="mt-5">
          <button
            aria-expanded={showAdvanced}
            className="flex w-full items-center justify-between text-sm font-semibold text-text"
            onClick={() => setShowAdvanced((prev) => !prev)}
            type="button"
          >
            <span>Advanced Settings</span>
            <svg
              className={cn("h-4 w-4 text-muted transition-transform", showAdvanced && "rotate-180")}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-4">
              <fieldset>
                <legend className="text-xs font-medium text-muted">Algorithm Presets</legend>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  {ALGORITHM_PRESET_OPTIONS.map((algoPreset) => {
                    const selected = settings.algorithm === algoPreset.algorithm;
                    return (
                      <button
                        className={cn(
                          "rounded-[var(--radius-sm)] border px-2 py-1.5 text-xs font-semibold transition-colors",
                          selected
                            ? "border-primary bg-primary-soft text-primary"
                            : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                        )}
                        key={algoPreset.algorithm}
                        onClick={() => update({ algorithm: algoPreset.algorithm })}
                        type="button"
                      >
                        {algoPreset.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label className="text-xs font-medium text-muted" htmlFor="resize-algorithm">
                  Algorithm
                </label>
                <select
                  className={cn(fieldClass, "mt-1")}
                  id="resize-algorithm"
                  onChange={(event) => update({ algorithm: event.target.value as ResizeAlgorithm })}
                  value={settings.algorithm}
                >
                  {ALL_ALGORITHMS.map((algo) => (
                    <option key={algo.value} value={algo.value}>
                      {algo.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
