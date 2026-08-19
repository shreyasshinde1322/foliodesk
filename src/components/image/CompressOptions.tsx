"use client";

import { cn } from "@/lib/cn";
import type {
  CompressSettings,
  FormatChoice,
} from "./compress-settings";

const FORMATS: Array<{ value: FormatChoice; label: string; hint: string }> = [
  { value: "webp", label: "WebP", hint: "Smallest" },
  { value: "jpg", label: "JPG", hint: "Photos" },
  { value: "jxl", label: "JXL", hint: "Next-gen" },
  { value: "original", label: "Keep format", hint: "Same type" },
];

const checkboxClass = "h-4 w-4 rounded border-border accent-[var(--primary)]";

export function CompressOptions({
  settings,
  onChange,
}: {
  settings: CompressSettings;
  onChange: (patch: Partial<CompressSettings>) => void;
  isOutputLossless?: boolean;
}) {
  const update = (patch: Partial<CompressSettings>) => onChange(patch);

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="font-serif text-lg font-semibold text-text">Compression options</h2>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-text">Output format</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {FORMATS.map((format) => {
            const selected = settings.format === format.value;
            const disabled = settings.autoFormat;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-2 py-2 text-left transition-colors",
                  disabled && "cursor-not-allowed opacity-45",
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                )}
                disabled={disabled}
                key={format.value}
                onClick={() => update({ format: format.value })}
                type="button"
              >
                <span className="block text-sm font-semibold">{format.label}</span>
                <span className="mt-0.5 block text-xs opacity-80">{format.hint}</span>
              </button>
            );
          })}
        </div>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-text">
          <input
            checked={settings.autoFormat}
            className={cn(checkboxClass, "mt-0.5")}
            onChange={(event) => update({ autoFormat: event.target.checked })}
            type="checkbox"
          />
          <span>
            <span className="font-semibold">Auto-optimize</span>
            <span className="block text-xs font-normal text-muted">
              Compares WebP, JPG, AVIF, and JXL per file and keeps the smallest. JPG is
              excluded when the image has transparency.
            </span>
          </span>
        </label>
      </fieldset>

      {!settings.autoFormat ? (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-text" htmlFor="compress-quality">
              Quality
            </label>
            <span className="text-sm font-semibold text-primary">{settings.quality}</span>
          </div>
          <input
            aria-describedby="compress-quality-hint"
            className="mt-2 w-full accent-[var(--primary)]"
            id="compress-quality"
            max="100"
            min="1"
            onInput={(event) => update({ quality: Number((event.target as HTMLInputElement).value) })}
            onChange={(event) => update({ quality: Number(event.target.value) })}
            step="1"
            type="range"
            value={settings.quality}
          />
          <p className="mt-1 text-xs text-muted" id="compress-quality-hint">
            Lower = smaller file, higher = better detail.
          </p>
        </div>
      ) : (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text">Quality</span>
            <span className="text-sm font-semibold text-primary">{settings.quality}</span>
          </div>
          <input
            aria-describedby="compress-quality-hint"
            className="mt-2 w-full accent-[var(--primary)]"
            max="100"
            min="1"
            onInput={(event) => update({ quality: Number((event.target as HTMLInputElement).value) })}
            onChange={(event) => update({ quality: Number(event.target.value) })}
            step="1"
            type="range"
            value={settings.quality}
          />
          <p className="mt-1 text-xs text-muted" id="compress-quality-hint">
            Lower = smaller file, higher = better detail.
          </p>
        </div>
      )}

      <div className="mt-5 space-y-3">
        <label className="flex cursor-pointer items-start gap-2 text-sm text-text">
          <input
            checked={settings.neverLarger}
            className={cn(checkboxClass, "mt-0.5")}
            onChange={(event) => update({ neverLarger: event.target.checked })}
            type="checkbox"
          />
          <span>
            <span className="font-semibold">Skip if larger</span>
            <span className="block text-xs font-normal text-muted">
              Skip files whose compressed result would be bigger than the original.
            </span>
          </span>
        </label>

        <fieldset className="rounded-xl border border-border p-3">
          <legend className="px-1 text-sm font-semibold text-text">Target file size</legend>
          <div className="flex items-center gap-2">
            <input
              aria-describedby="target-size-hint"
              className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              min="0"
              onChange={(event) => {
                const raw = Number(event.target.value);
                if (Number.isNaN(raw) || raw < 0) return;
                const bytes = settings.targetSizeUnit === "mb" ? raw * 1024 * 1024 : raw * 1024;
                update({ targetSize: Math.round(bytes) });
              }}
              placeholder="0"
              step="1"
              type="number"
              value={
                settings.targetSize === 0
                  ? ""
                  : settings.targetSizeUnit === "mb"
                    ? Number((settings.targetSize / (1024 * 1024)).toFixed(2))
                    : Math.round(settings.targetSize / 1024)
              }
            />
            <select
              className="rounded-lg border border-border bg-white px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(event) => update({ targetSizeUnit: event.target.value as "kb" | "mb" })}
              value={settings.targetSizeUnit}
            >
              <option value="kb">KB</option>
              <option value="mb">MB</option>
            </select>
          </div>
          <p className="mt-1 text-xs text-muted" id="target-size-hint">
            {settings.targetSize > 0
              ? "The compressor will search for the smallest output that fits within this size."
              : "Set a target to search for the smallest output that fits."}
          </p>
          {settings.targetSize > 0 ? (
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-text">
              <input
                checked={settings.allowResizeForTarget}
                className={cn(checkboxClass, "mt-0.5")}
                onChange={(event) => update({ allowResizeForTarget: event.target.checked })}
                type="checkbox"
              />
              <span className="font-normal text-muted">
                Allow dimension reduction to reach target size
              </span>
            </label>
          ) : null}
        </fieldset>
      </div>
    </div>
  );
}
