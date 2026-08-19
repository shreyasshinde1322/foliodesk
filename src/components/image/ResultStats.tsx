"use client";

import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { QueueItem } from "./queue";

/**
 * Per-file compression report for the selected image: size delta, dimensions,
 * format and quality, target-size status, and larger-than-original warnings.
 */
export function ResultStats({ item }: { item: QueueItem | null }) {
  if (!item || !item.result) return null;

  const result = item.result;
  const originalBytes = item.originalSize;
  const resultBytes = result.sizeBytes;
  const deltaBytes = originalBytes - resultBytes;
  const deltaPercent =
    originalBytes > 0 ? Math.round((deltaBytes / originalBytes) * 100) : 0;
  const skippedLarger = item.skippedReason === "larger";
  const qualityLabel =
    typeof result.quality === "number"
      ? `Lossy ${result.quality}`
      : result.format === "png"
        ? result.pngMode === "maximum"
          ? "Lossy (Maximum)"
          : result.pngMode === "recommended"
            ? "Recommended"
            : "Lossless"
        : "—";

  const dimsChanged =
    item.width !== undefined &&
    (result.width !== item.width || result.height !== item.height);

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-semibold text-text">Result</h3>

      <div className="mt-3 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted">Compressed size</p>
          <p className="text-xl font-semibold text-text">{formatBytes(resultBytes)}</p>
          <p className="mt-0.5 text-xs text-muted">
            from {formatBytes(originalBytes)}
          </p>
        </div>
        <div
          className={cn(
            "rounded-[var(--radius-sm)] px-2.5 py-1.5 text-sm font-semibold",
            deltaPercent > 0
              ? "bg-success/10 text-success"
              : deltaPercent < 0
                ? "bg-error/10 text-error"
                : "bg-muted/20 text-muted",
          )}
        >
          {deltaPercent > 0
            ? `−${formatBytes(deltaBytes)} · ${deltaPercent}%`
            : deltaPercent < 0
              ? `+${formatBytes(-deltaBytes)} · ${-deltaPercent}%`
              : "No change"}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Format</dt>
          <dd className="mt-0.5 font-semibold text-text">
            {result.format.toUpperCase()}
            <span className="ml-1 text-xs font-normal text-muted">({qualityLabel})</span>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Dimensions</dt>
          <dd className="mt-0.5 font-semibold text-text">
            {result.width}×{result.height}
            {dimsChanged ? (
              <span className="ml-1 text-xs font-normal text-muted">
                (was {item.width}×{item.height})
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Output file</dt>
          <dd className="mt-0.5 break-all font-semibold text-text">{result.outputName}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Metadata</dt>
          <dd className="mt-0.5 font-semibold text-text">Removed</dd>
        </div>
      </dl>

      {skippedLarger ? (
        <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning">
          The compressed result was larger than the original, so it was skipped
          and excluded from the ZIP download. You can still download the original
          or compress it stronger.
        </p>
      ) : null}
    </div>
  );
}
