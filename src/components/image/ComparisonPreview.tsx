"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import type { EncodeFormat } from "@/engines/image";
import { IMAGE_FORMAT_META } from "@/engines/image";
import { cn } from "@/lib/cn";
import type { QueueItem } from "./queue";
import { isInProgress } from "./queue";

const ZOOM_MIN = 10;
const ZOOM_MAX = 400;
const ZOOM_STEP = 10;

/**
 * Before/after comparison with a draggable divider and pixel zoom.
 *
 * The zoom is implemented by rendering both images at their natural size times
 * the zoom factor inside a scrollable frame, so the divider position and the
 * clip region stay in the same coordinate space. The divider is a fraction of
 * the (zoomed) content width, which keeps the comparison pixel-accurate.
 *
 * State resets when the selected item changes via a `key` on the component.
 */
export function ComparisonPreview({
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
  const [position, setPosition] = useState(50);
  const [zoom, setZoom] = useState(100);
  const contentRef = useRef<HTMLDivElement | null>(null);

  if (!item) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-paper-deep/40 p-10 text-center text-sm text-muted">
        Select an image above to compare the original and the compressed result
        side by side.
      </div>
    );
  }

  const working = isInProgress(item.status);
  const hasResult = Boolean(item.result && item.resultUrl);
  const effectiveOutput: EncodeFormat = item.result?.format ?? outputFormat;
  const flattenWarning = effectiveOutput === "jpg" && item.hasAlpha;
  const dimsChanged =
    item.result && item.width ? item.result.width !== item.width || item.result.height !== item.height : false;

  const currentIndex = items.findIndex((entry) => entry.id === item.id);
  const prevItem = currentIndex > 0 ? items[currentIndex - 1] : null;
  const nextItem =
    currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1] : null;

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
  const resultWidth = item.result?.width ?? frameWidth;

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-text">Quality comparison</h3>
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
          <span className="min-w-[3.5rem] text-center text-xs font-semibold text-muted">{zoom}%</span>
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

      <div className="mt-3 max-h-[70vh] overflow-auto rounded-xl border border-border bg-checkerboard">
        <div
          aria-label="Comparison of the original and compressed image"
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
                height: item.result ? Math.round(item.result.height * (zoom / 100)) : contentHeight,
                clipPath: `inset(0 0 0 ${position}%)`,
              }}
            />
          ) : null}

          <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            Original
          </span>
          <span className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
            Compressed
          </span>

          {hasResult ? (
            <div
              className="absolute inset-y-0"
              style={{ left: `${position}%`, width: 0 }}
            >
              <div className="absolute inset-y-0 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_6px_rgba(0,0,0,0.5)]" />
              <button
                aria-label="Drag to compare original and compressed"
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
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-muted">
          {hasResult ? (
            <>
              {item.result!.format.toUpperCase()} · {item.result!.width}×{item.result!.height}
              {dimsChanged ? " · result was resized" : ""}
            </>
          ) : working ? (
            "Compressing locally…"
          ) : (
            "The compressed side appears here after compression."
          )}
        </span>
        <span className="text-muted">{zoom}% zoom</span>
      </div>

      {flattenWarning ? (
        <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning">
          This image has transparency. {IMAGE_FORMAT_META[effectiveOutput].label} cannot
          store it, so transparent areas are flattened onto {background}.
        </p>
      ) : null}

      {items.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
          <button
            aria-label="Compare previous image"
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
            aria-label="Compare next image"
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
