"use client";

import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { EncodeFormat } from "@/engines/image";
import { IMAGE_FORMAT_META } from "@/engines/image";
import { formatBytes, formatDimensions } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { QueueItem } from "./queue";
import { formatSupportsAlpha } from "./queue";

export function PreviewPanel({
  item,
  items,
  outputFormat,
  background,
  onSelect,
}: {
  item: QueueItem | null;
  items: QueueItem[];
  outputFormat: EncodeFormat;
  background: string;
  onSelect: (id: string) => void;
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
  const isWorking = ["analyzing", "decoding", "processing", "encoding"].includes(item.status);

  const currentIndex = items.findIndex((entry) => entry.id === item.id);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

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

      {item.status === "cancelled" ? (
        <p className="mt-4 text-center text-sm text-muted">
          Conversion cancelled. Use the retry button to run it again.
        </p>
      ) : null}

      {item.status === "failed" ? (
        <p className="mt-4 text-center text-sm text-error">{item.error}</p>
      ) : null}

      {isWorking ? (
        <p className="mt-4 text-center text-xs text-muted">Working…</p>
      ) : null}

      {items.length > 1 ? (
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            aria-label="Preview previous image"
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-semibold transition-colors",
              prevItem
                ? "border-border text-text hover:border-primary/40 hover:text-primary"
                : "cursor-not-allowed border-border opacity-40",
            )}
            disabled={!prevItem}
            onClick={() => prevItem && onSelect(prevItem.id)}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-xs font-semibold text-muted">
            Image {currentIndex + 1} of {items.length}
          </span>
          <button
            aria-label="Preview next image"
            className={cn(
              "inline-flex items-center gap-1 rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-semibold transition-colors",
              nextItem
                ? "border-border text-text hover:border-primary/40 hover:text-primary"
                : "cursor-not-allowed border-border opacity-40",
            )}
            disabled={!nextItem}
            onClick={() => nextItem && onSelect(nextItem.id)}
            type="button"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
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
          "flex max-h-[50vh] min-h-32 items-center justify-center overflow-hidden rounded-xl border border-border bg-white",
          checkerboard && "bg-checkerboard",
        )}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="" className="max-h-[50vh] max-w-full object-contain" src={url} />
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
