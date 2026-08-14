"use client";

import { ArrowRight } from "lucide-react";
import type { EncodeFormat } from "@/engines/image";
import { IMAGE_FORMAT_META } from "@/engines/image";
import { formatBytes, formatDimensions } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { QueueItem } from "./queue";
import { formatSupportsAlpha } from "./queue";

export function PreviewPanel({
  item,
  outputFormat,
  background,
}: {
  item: QueueItem | null;
  outputFormat: EncodeFormat;
  background: string;
}) {
  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-paper-deep/40 p-10 text-center text-sm text-muted">
        Select an image above to preview the original and the converted result.
      </div>
    );
  }

  const convertedSupportsAlpha = formatSupportsAlpha(outputFormat);
  const showConvertedCheckerboard = Boolean(item.hasAlpha && convertedSupportsAlpha);
  const flattenWarning = outputFormat === "jpg" && item.hasAlpha;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
        <PreviewCard
          label="Original"
          format={item.sourceFormat ? IMAGE_FORMAT_META[item.sourceFormat].label : "—"}
          dimensions={item.width && item.height ? formatDimensions(item.width, item.height) : "—"}
          size={formatBytes(item.originalSize)}
          url={item.previewUrl}
          checkerboard={Boolean(item.hasAlpha)}
        />
        <ArrowRight aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-muted" />
        <PreviewCard
          label="Converted"
          format={item.result ? item.result.format.toUpperCase() : IMAGE_FORMAT_META[outputFormat].label}
          dimensions={
            item.result
              ? formatDimensions(item.result.width, item.result.height)
              : item.status === "complete"
                ? "—"
                : "Converting…"
          }
          size={item.result ? formatBytes(item.result.sizeBytes) : item.status === "complete" ? "—" : "…"}
          url={item.resultUrl}
          checkerboard={showConvertedCheckerboard}
        />
      </div>

      {flattenWarning ? (
        <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-center text-xs text-warning">
          This image has transparency. JPG cannot store it, so transparent areas
          will be flattened onto {background}.
        </p>
      ) : null}

      {item.status === "failed" ? (
        <p className="mt-4 text-center text-sm text-error">{item.error}</p>
      ) : null}
    </div>
  );
}

function PreviewCard({
  label,
  format,
  dimensions,
  size,
  url,
  checkerboard,
}: {
  label: string;
  format: string;
  dimensions: string;
  size: string;
  url?: string;
  checkerboard: boolean;
}) {
  return (
    <div className="w-full max-w-xs text-center">
      <div
        className={cn(
          "flex h-48 items-center justify-center overflow-hidden rounded-xl border border-border bg-white",
          checkerboard && "bg-checkerboard",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="max-h-48 max-w-full object-contain" src={url} />
        ) : (
          <span className="text-sm text-muted">Waiting for conversion…</span>
        )}
      </div>
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text">
        {format} · {dimensions}
      </p>
      <p className="text-xs text-muted">{size}</p>
    </div>
  );
}
