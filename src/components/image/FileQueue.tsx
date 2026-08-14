"use client";

import { AlertCircle, Check, Download, Loader2, RefreshCw, X } from "lucide-react";
import { IMAGE_FORMAT_META } from "@/engines/image";
import { formatBytes, formatDimensions } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { QueueItem } from "./queue";

export function FileQueue({
  items,
  selectedId,
  onSelect,
  onRemove,
  onReconvert,
  onDownload,
  onClearAll,
}: {
  items: QueueItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onReconvert: (id: string) => void;
  onDownload: (id: string) => void;
  onClearAll: () => void;
}) {
  const complete = items.filter((item) => item.status === "complete").length;
  const failed = items.filter((item) => item.status === "failed").length;
  const processing = items.filter((item) => item.status === "processing").length;

  return (
    <div className="rounded-2xl border border-border bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-semibold text-text">
            {items.length} {items.length === 1 ? "image" : "images"}
          </span>
          {processing ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
              <Loader2 className="h-3 w-3 animate-spin" />
              Converting…
            </span>
          ) : null}
          {failed ? (
            <span className="rounded-full bg-error/10 px-2 py-0.5 text-xs font-semibold text-error">
              {failed} failed
            </span>
          ) : null}
          {complete ? (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
              {complete} done
            </span>
          ) : null}
        </div>
        <button
          className="text-xs font-semibold text-muted transition-colors hover:text-error"
          onClick={onClearAll}
          type="button"
        >
          Clear all
        </button>
      </div>

      <ul className="divide-y divide-border">
        {items.map((item) => (
          <li key={item.id}>
            <div
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-paper-deep/40",
                selectedId === item.id && "bg-primary-soft/40",
              )}
            >
              <button
                aria-label={`Preview ${item.name}`}
                className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border"
                onClick={() => onSelect(item.id)}
                type="button"
              >
                {item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className={cn("h-12 w-12 object-cover", item.hasAlpha && "bg-checkerboard")}
                    src={item.previewUrl}
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center bg-paper-deep text-xs font-semibold text-muted">
                    {item.sourceFormat ? IMAGE_FORMAT_META[item.sourceFormat].label : "IMG"}
                  </span>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text">{item.name}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {item.sourceFormat ? IMAGE_FORMAT_META[item.sourceFormat].label : "Detecting…"}
                  {item.width && item.height ? ` · ${formatDimensions(item.width, item.height)}` : ""}
                  {` · ${formatBytes(item.originalSize)}`}
                </p>
                <div className="mt-1">
                  <StatusLine item={item} />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {item.status === "complete" && item.result ? (
                  <>
                    <button
                      aria-label={`Download ${item.result.outputName}`}
                      className="btn-primary px-2.5 py-1.5 text-xs"
                      onClick={() => onDownload(item.id)}
                      type="button"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {formatBytes(item.result.sizeBytes)}
                    </button>
                    <button
                      aria-label="Reconvert this image"
                      className="rounded-[var(--radius-sm)] border border-border p-1.5 text-muted transition-colors hover:border-primary/40 hover:text-primary"
                      onClick={() => onReconvert(item.id)}
                      title="Reconvert with current options"
                      type="button"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : null}
                {item.status === "failed" ? (
                  <button
                    aria-label="Retry this image"
                    className="rounded-[var(--radius-sm)] border border-border p-1.5 text-muted transition-colors hover:border-primary/40 hover:text-primary"
                    onClick={() => onReconvert(item.id)}
                    title="Retry"
                    type="button"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <button
                  aria-label={`Remove ${item.name}`}
                  className="rounded-[var(--radius-sm)] p-1.5 text-muted transition-colors hover:text-error"
                  onClick={() => onRemove(item.id)}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusLine({ item }: { item: QueueItem }) {
  if (item.status === "queued") {
    return <span className="text-xs text-muted">Queued</span>;
  }
  if (item.status === "processing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
        <Loader2 className="h-3 w-3 animate-spin" />
        Converting…
      </span>
    );
  }
  if (item.status === "failed") {
    return (
      <span className="inline-flex items-start gap-1.5 text-xs text-error">
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
        {item.error ?? "Conversion failed."}
      </span>
    );
  }
  if (item.status === "complete" && item.result) {
    const ratio = item.result.sizeBytes / item.originalSize;
    const percent = Math.round((1 - ratio) * 100);
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <Check className="h-3 w-3" />
        {item.result.format.toUpperCase()} · {formatBytes(item.result.sizeBytes)}
        {percent !== 0 ? (
          <span className={percent > 0 ? "text-success" : "text-muted"}>
            ({percent > 0 ? "−" : "+"}
            {Math.abs(percent)}%)
          </span>
        ) : null}
      </span>
    );
  }
  return null;
}
