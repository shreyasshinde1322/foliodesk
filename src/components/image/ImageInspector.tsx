"use client";

import { EXIF_ORIENTATION_LABELS, IMAGE_FORMAT_META, aspectRatioLabel } from "@/engines/image";
import { formatBytes, formatDimensions } from "@/lib/format";
import type { QueueItem } from "./queue";

/**
 * Source inspection for the selected image: format, dimensions, transparency,
 * EXIF orientation, metadata presence, and an output-format recommendation.
 */
export function ImageInspector({ item }: { item: QueueItem | null }) {
  if (!item) return null;

  const sourceFormat = item.sourceFormat;
  const rows: Array<{ label: string; value: string }> = [
    {
      label: "Source format",
      value: sourceFormat ? IMAGE_FORMAT_META[sourceFormat].label : "—",
    },
    {
      label: "Dimensions",
      value: item.width && item.height ? formatDimensions(item.width, item.height) : "—",
    },
    {
      label: "Aspect ratio",
      value: item.width && item.height ? aspectRatioLabel(item.width, item.height) : "—",
    },
    {
      label: "Transparency",
      value: item.hasAlpha ? "Present" : item.hasAlpha === false ? "None" : "—",
    },
    {
      label: "Orientation",
      value:
        item.exifOrientation && item.exifOrientation !== 1
          ? EXIF_ORIENTATION_LABELS[item.exifOrientation] ?? "Unknown"
          : "Normal",
    },
    {
      label: "Metadata",
      value:
        item.metadataDetected === undefined
          ? "—"
          : item.metadataDetected
            ? "EXIF / text detected (removed on output)"
            : "None found",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-semibold text-text">Image inspector</h3>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs text-muted">{row.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-text">{row.value}</dd>
          </div>
        ))}
      </dl>
      {item.recommendation ? (
        <p className="mt-4 rounded-lg bg-primary-soft/40 px-3 py-2 text-xs leading-relaxed text-text">
          <span className="font-semibold text-primary">Recommended: {item.recommendation}</span>
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Original size: <span className="font-semibold text-text">{formatBytes(item.originalSize)}</span>
        {item.estimatedBytes
          ? ` · needs ~${Math.ceil(item.estimatedBytes / (1024 * 1024))} MB of memory to process`
          : ""}
      </p>
    </div>
  );
}
