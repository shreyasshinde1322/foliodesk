"use client";

import { cn } from "@/lib/cn";

export type CompressMode = "webp" | "jpg" | "original";

export interface CompressSettings {
  mode: CompressMode;
  quality: number;
  background: string;
}

const MODES: Array<{ value: CompressMode; label: string; hint: string }> = [
  { value: "webp", label: "WebP", hint: "Best overall" },
  { value: "jpg", label: "JPG", hint: "Photos" },
  { value: "original", label: "Keep format", hint: "Same extension" },
];

const fieldClass =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text shadow-[var(--shadow-subtle)] transition-[border-color,box-shadow] focus:border-primary focus:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]";

export function CompressOptions({
  settings,
  onChange,
  selectedOutputLossless,
}: {
  settings: CompressSettings;
  onChange: (patch: Partial<CompressSettings>) => void;
  selectedOutputLossless: boolean;
}) {
  const showBackground = settings.mode === "jpg";

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h2 className="font-serif text-lg font-semibold text-text">Compression options</h2>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-text">Output format</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {MODES.map((mode) => {
            const selected = settings.mode === mode.value;
            return (
              <button
                aria-pressed={selected}
                className={cn(
                  "rounded-[var(--radius-sm)] border px-2 py-2 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-white text-muted hover:border-primary/40 hover:text-text",
                )}
                key={mode.value}
                onClick={() => onChange({ mode: mode.value })}
                type="button"
              >
                <span className="block text-sm font-semibold">{mode.label}</span>
                <span className="mt-0.5 block text-xs opacity-80">{mode.hint}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-text" htmlFor="compress-quality">
            Quality
          </label>
          <span
            className={cn(
              "text-sm font-semibold",
              selectedOutputLossless ? "text-muted" : "text-primary",
            )}
          >
            {settings.quality}
          </span>
        </div>
        <input
          aria-describedby={selectedOutputLossless ? "compress-quality-note" : undefined}
          className={cn(
            "mt-2 w-full accent-[var(--primary)]",
            selectedOutputLossless && "cursor-not-allowed opacity-50",
          )}
          disabled={selectedOutputLossless}
          id="compress-quality"
          max="100"
          min="10"
          onChange={(event) => onChange({ quality: Number(event.target.value) })}
          step="1"
          type="range"
          value={settings.quality}
        />
        {selectedOutputLossless ? (
          <p
            className="mt-1 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning"
            id="compress-quality-note"
          >
            <span aria-hidden="true">⚠</span>
            <span>
              This image stays PNG — a lossless format, so the quality slider
              does not change the file size. It is re-compressed at full
              quality. For smaller files,{" "}
              <button
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
                onClick={() => onChange({ mode: "webp" })}
                type="button"
              >
                compress as WebP instead
              </button>
              .
            </span>
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            Lower size ↔ Higher quality. In &quot;Keep format&quot; mode, PNG and BMP sources
            stay lossless and only get best-effort recompression.
          </p>
        )}
      </div>

      {showBackground ? (
        <div className="mt-5">
          <label className="text-sm font-semibold text-text" htmlFor="compress-background">
            Background color
          </label>
          <div className="mt-1 flex items-center gap-2">
            <input
              className="h-9 w-12 cursor-pointer rounded-md border border-border bg-white p-1"
              id="compress-background"
              onChange={(event) => onChange({ background: event.target.value })}
              type="color"
              value={settings.background}
            />
            <input
              className={cn(fieldClass, "max-w-[7rem]")}
              onChange={(event) => onChange({ background: event.target.value })}
              pattern="^#[0-9a-fA-F]{6}$"
              value={settings.background}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Used when compressing transparent images to JPG. Transparent areas
            are flattened onto this color.
          </p>
        </div>
      ) : null}
    </div>
  );
}
