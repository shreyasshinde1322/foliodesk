"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBytes, formatDimensions } from "@/lib/format";

const ZOOM_MIN = 10;
const ZOOM_MAX = 400;
const ZOOM_STEP = 10;

interface ResizeQueueItem {
  id: string;
  name: string;
  status: string;
  error?: string;
  sourceFormat: string | null;
  width?: number;
  height?: number;
  originalSize: number;
  previewUrl?: string;
  resultUrl?: string;
  resultWidth?: number;
  resultHeight?: number;
  resultSize?: number;
  resultFormat?: string;
}

function isInProgress(status: string): boolean {
  return status === "in-progress" || status === "queued";
}

function isFailed(status: string): boolean {
  return status === "failed";
}

function isDone(status: string): boolean {
  return status === "done";
}

export function ResizePreview({
  item,
  items,
  onSelect,
}: {
  item: ResizeQueueItem | null;
  items: ResizeQueueItem[];
  onSelect: (id: string) => void;
}) {
  const [position, setPosition] = useState(50);
  const [zoom, setZoom] = useState(100);
  const contentRef = useRef<HTMLDivElement | null>(null);

  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-paper-deep/40 p-10 text-center text-sm text-muted">
        Select an image to preview the before and after comparison.
      </div>
    );
  }

  const working = isInProgress(item.status);
  const failed = isFailed(item.status);
  const done = isDone(item.status);
  const hasResult = done && Boolean(item.resultUrl);

  const currentIndex = items.findIndex((entry) => entry.id === item.id);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < items.length - 1
      ? items[currentIndex + 1]
      : null;

  const updatePosition = (clientX: number): void => {
    const content = contentRef.current;
    if (!content) return;
    const rect = content.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(1, Math.min(99, ratio)));
  };

  const frameWidth = item.width ?? 800;
  const frameHeight = item.height ?? 600;
  const contentWidth = Math.round(frameWidth * (zoom / 100));
  const contentHeight = Math.round(frameHeight * (zoom / 100));
  const resultWidth = item.resultWidth ?? frameWidth;
  const resultHeight = item.resultHeight ?? frameHeight;
  const scalePercent =
    item.width && item.resultWidth
      ? Math.round((item.resultWidth / item.width) * 100)
      : null;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">Resize comparison</h3>
        <div className="flex items-center gap-1" aria-label="Zoom level">
          <button
            aria-label="Zoom out"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-white text-muted transition-colors hover:border-primary/40 hover:text-text",
              zoom <= ZOOM_MIN && "cursor-not-allowed opacity-40",
            )}
            disabled={zoom <= ZOOM_MIN}
            onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
            type="button"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[3.5rem] text-center text-xs font-semibold text-muted">
            {zoom}%
          </span>
          <button
            aria-label="Zoom in"
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-white text-muted transition-colors hover:border-primary/40 hover:text-text",
              zoom >= ZOOM_MAX && "cursor-not-allowed opacity-40",
            )}
            disabled={zoom >= ZOOM_MAX}
            onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
            type="button"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-[60vh] overflow-auto rounded-xl border border-border bg-checkerboard">
        <div
          aria-label="Comparison of the original and resized image"
          className="relative cursor-ew-resize"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            updatePosition(event.clientX);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updatePosition(event.clientX);
            }
          }}
          ref={contentRef}
          role="img"
          style={{ width: contentWidth, height: contentHeight }}
        >
          {item.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              className="block"
              style={{ width: contentWidth, height: contentHeight }}
              src={item.previewUrl}
            />
          ) : null}

          {hasResult && item.resultUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 block"
              src={item.resultUrl}
              style={{
                width: Math.round(resultWidth * (zoom / 100)),
                height: Math.round(resultHeight * (zoom / 100)),
                clipPath: `inset(0 0 0 ${position}%)`,
              }}
            />
          ) : null}

          <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            Original
          </span>
          <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            Resized
          </span>

          {hasResult ? (
            <div
              className="absolute inset-y-0"
              style={{ left: `${position}%`, width: 0 }}
            >
              <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.5)]" />
              <button
                aria-label="Drag to compare original and resized"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(position)}
                className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none rounded-full border-2 border-white bg-primary/90 text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/60"
                onKeyDown={(event) => {
                  const step = event.shiftKey ? 10 : 1;
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    setPosition((prev) => Math.max(1, prev - step));
                  } else if (event.key === "ArrowRight") {
                    event.preventDefault();
                    setPosition((prev) => Math.min(99, prev + step));
                  }
                }}
                role="slider"
                type="button"
              >
                <span aria-hidden="true" className="block h-4 w-px bg-white/80" />
              </button>
            </div>
          ) : null}

          {working ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <span className="rounded-lg bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                Processing...
              </span>
            </div>
          ) : null}

          {failed ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10">
              <span className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-semibold text-white">
                Failed: {item.error ?? "Unknown error"}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted">
          {item.width && item.height
            ? `Original: ${formatDimensions(item.width, item.height)}, ${formatBytes(item.originalSize)}`
            : `Original: ${formatBytes(item.originalSize)}`}
        </span>
        <span className="text-muted">
          {done && item.resultWidth && item.resultHeight
            ? `Output: ${formatDimensions(item.resultWidth, item.resultHeight)}, ${formatBytes(item.resultSize ?? 0)}`
            : working
              ? "Processing..."
              : failed
                ? "Failed"
                : "\u2014"}
        </span>
        {scalePercent !== null ? (
          <span className="text-muted font-semibold">Scale: {scalePercent}%</span>
        ) : null}
      </div>

      {items.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
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
