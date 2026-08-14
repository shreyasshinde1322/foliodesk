"use client";

import { generateCoverTemplateSvg } from "@/lib/kdp/template-generator";
import type { PaperbackCoverDimensions, TemplateOptions } from "@/lib/kdp/types";

export function TemplateControls({
  options,
  onChange,
  disabled,
  dimensions,
  onDownloadSvg,
  onDownloadPng,
  onDownloadPdf,
  zoom,
  onZoom,
}: {
  options: TemplateOptions;
  onChange: (next: TemplateOptions) => void;
  disabled: boolean;
  dimensions: PaperbackCoverDimensions;
  onDownloadSvg: () => void;
  onDownloadPng: () => void;
  onDownloadPdf: () => void;
  zoom: number;
  onZoom: (next: number) => void;
}) {
  function toggle(key: keyof TemplateOptions) {
    onChange({ ...options, [key]: !options[key] });
  }

  const checks: Array<{ key: keyof TemplateOptions; label: string }> = [
    { key: "showMeasurements", label: "Show measurements" },
    { key: "showLabels", label: "Show labels" },
    { key: "showBleed", label: "Show bleed" },
    { key: "showSafeArea", label: "Show safe area" },
    { key: "showBarcodeArea", label: "Show barcode area" },
  ];

  const previewSvg = generateCoverTemplateSvg(dimensions, options);

  return (
    <section
      className="rounded-[var(--radius-md)] border border-border bg-surface p-5"
      id="template"
    >
      <h2 className="font-serif text-xl">Download template</h2>
      <p className="mt-1 text-sm text-muted">
        SVG, PNG, and PDF all use the same wrap-cover guide: pink bleed, white
        live area, solid trim, blue spine folds, and a 2.000 x 1.200 in barcode
        box.
      </p>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Layer visibility</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {checks.map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-2 rounded-md px-1 py-1 text-sm"
            >
              <input
                checked={options[item.key]}
                className="h-4 w-4 accent-accent"
                onChange={() => toggle(item.key)}
                type="checkbox"
              />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex flex-wrap gap-2">
        <PreviewButton
          label="Zoom out"
          onClick={() => onZoom(Math.max(0.6, Number((zoom - 0.15).toFixed(2))))}
        />
        <PreviewButton label="Fit" onClick={() => onZoom(1)} />
        <PreviewButton
          label="Zoom in"
          onClick={() => onZoom(Math.min(1.6, Number((zoom + 0.15).toFixed(2))))}
        />
        <PreviewButton label="Reset" onClick={() => onZoom(1)} />
      </div>
      <div className="mt-4 overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-[#ececec] p-2">
        <div
          aria-label="Print template preview"
          className="min-w-[36rem] origin-top-left [&_svg]:h-auto [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: previewSvg.replace(/^<\?xml[^>]*>/, "") }}
          style={{ transform: `scale(${zoom})` }}
        />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <DownloadOption
          disabled={disabled}
          hint="Best for editing in vector design software."
          label="SVG"
          onClick={onDownloadSvg}
          primary
        />
        <DownloadOption
          disabled={disabled}
          hint="Best for printing."
          label="PDF"
          onClick={onDownloadPdf}
        />
        <DownloadOption
          disabled={disabled}
          hint="Best for quick preview/reference."
          label="PNG"
          onClick={onDownloadPng}
        />
      </div>
    </section>
  );
}

function PreviewButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-[var(--radius-sm)] border border-border px-3 py-1.5 text-xs font-medium hover:bg-paper-deep"
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function DownloadOption({
  label,
  hint,
  onClick,
  disabled,
  primary,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled: boolean;
  primary?: boolean;
}) {
  return (
    <button
      className={`rounded-[var(--radius-md)] border p-4 text-left shadow-[var(--shadow-subtle)] disabled:cursor-not-allowed disabled:opacity-50 ${
        primary
          ? "border-transparent bg-brand-gradient text-white shadow-[var(--shadow-primary)] hover:shadow-[var(--shadow-elevated)]"
          : "border-border bg-white hover:bg-paper-deep"
      }`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span
        className={`mt-1 block text-xs ${primary ? "text-white/85" : "text-muted"}`}
      >
        {hint}
      </span>
    </button>
  );
}
