"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FolderDown, ShieldCheck } from "lucide-react";
import {
  ImageProcessingError,
  analyzeImage,
  createBrowserCodec,
  createZip,
  dedupeNames,
  encodeBitmap,
  hasAlpha,
  isHeavy,
  estimateWorkingBytes,
  normalizeConversionOptions,
  terminateWorkers,
} from "@/engines/image";
import type {
  ConversionOptions,
  EncodeFormat,
  ImageCodec,
  ImageFormat,
  JobStage,
} from "@/engines/image";
import { downloadBlob } from "@/lib/export/download";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/cn";
import { FileQueue } from "./FileQueue";
import { ResizeOptions } from "./ResizeOptions";
import { UploadZone } from "./UploadZone";
import type { ResizeSettings } from "./resize-settings";
import {
  DEFAULT_RESIZE_SETTINGS,
  loadResizeSettings,
  saveResizeSettings,
  computeTargetDimensions,
  printPixelDimensions,
  needsUpscale,
} from "./resize-settings";
import type { ContainResult } from "./resize-settings";

interface ResizeItem {
  id: string;
  file: File;
  name: string;
  status: JobStage;
  error?: string;
  sourceFormat: ImageFormat | null;
  width?: number;
  height?: number;
  originalSize: number;
  previewUrl?: string;
  hasAlpha?: boolean;
  heavy?: boolean;
  estimatedBytes?: number;
  resultUrl?: string;
  resultWidth?: number;
  resultHeight?: number;
  resultSize?: number;
  resultFormat?: string;
  resultData?: Uint8Array;
  resultMimeType?: string;
  resultOutputName?: string;
}

let idSequence = 0;
function nextId(): string {
  idSequence += 1;
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `rsz-${Date.now().toString(36)}-${random}-${idSequence}`;
}

function mapOriginalFormat(source: ImageFormat | null): EncodeFormat {
  switch (source) {
    case "jpg":
      return "jpg";
    case "png":
      return "png";
    case "webp":
      return "webp";
    case "avif":
      return "avif";
    default:
      return "webp";
  }
}

function adaptItem(item: ResizeItem) {
  return {
    id: item.id,
    file: item.file,
    name: item.name,
    status: item.status,
    error: item.error,
    sourceFormat: item.sourceFormat,
    width: item.width,
    height: item.height,
    originalSize: item.originalSize,
    previewUrl: item.previewUrl,
    hasAlpha: item.hasAlpha,
    heavy: item.heavy,
    estimatedBytes: item.estimatedBytes,
    result: item.resultData
      ? {
          format: (item.resultFormat ?? "webp") as EncodeFormat,
          width: item.resultWidth ?? 0,
          height: item.resultHeight ?? 0,
          sizeBytes: item.resultSize ?? 0,
          mimeType: item.resultMimeType ?? "image/webp",
          outputName: item.resultOutputName ?? "output",
          data: item.resultData,
        }
      : undefined,
    resultUrl: item.resultUrl,
  };
}

const IN_PROGRESS: ReadonlySet<JobStage> = new Set([
  "analyzing",
  "decoding",
  "processing",
  "optimizing",
  "encoding",
]);

function isInProgress(status: JobStage): boolean {
  return IN_PROGRESS.has(status);
}

function toFriendlyMessage(error: unknown): string {
  if (error instanceof Error && "code" in error) {
    const code = (error as ImageProcessingError).code;
    switch (code) {
      case "file-too-large":
        return "This file is larger than the 25 MB limit. Try a smaller file.";
      case "invalid-file":
        return "This file is empty and could not be resized.";
      case "unsupported-format":
        return "This file is not a supported image format.";
      case "animated-gif":
        return "Animated GIFs are not supported yet — they would silently lose frames. Convert a static image instead.";
      case "image-too-large":
        return "This image is too large to process safely in the browser.";
      case "decode-failed":
        return "The image could not be decoded in this browser. Try another format.";
      case "encode-failed":
        return "This browser could not encode the image in the selected format.";
      case "output-invalid":
        return "The encoder produced an invalid file.";
      case "worker-failed":
        return "A background worker could not be started.";
      case "cancelled":
        return "Resize was cancelled.";
    }
  }
  return "This image could not be resized. Try again with a different file.";
}

async function detectFormatFromFile(file: File): Promise<ImageFormat | null> {
  try {
    const slice = file.slice(0, 16);
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const { detectFormat } = await import("@/engines/image/formats");
    return detectFormat(bytes);
  } catch {
    return null;
  }
}

async function codecContain(
  codec: ImageCodec,
  bitmap: { width: number; height: number; data: Uint8ClampedArray },
  contain: ContainResult,
  outputFormat: EncodeFormat,
  background: string,
): Promise<{ width: number; height: number; data: Uint8ClampedArray }> {
  const { canvasWidth, canvasHeight, drawWidth, drawHeight, drawX, drawY } = contain;
  const scaled = await codec.scale(bitmap, drawWidth, drawHeight);
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { width: canvasWidth, height: canvasHeight, data: scaled.data };
  }
  const supportsAlpha = outputFormat === "png" || outputFormat === "webp" || outputFormat === "avif";
  if (!supportsAlpha) {
    ctx.fillStyle = background || "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  const imageData = new ImageData(
    new Uint8ClampedArray(scaled.data),
    drawWidth,
    drawHeight,
  );
  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = drawWidth;
  tmpCanvas.height = drawHeight;
  const tmpCtx = tmpCanvas.getContext("2d");
  if (!tmpCtx) {
    return { width: canvasWidth, height: canvasHeight, data: scaled.data };
  }
  tmpCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tmpCanvas, drawX, drawY);
  const result = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  return { width: canvasWidth, height: canvasHeight, data: result.data };
}

export function ImageResizer() {
  const [items, setItems] = useState<ResizeItem[]>([]);
  const [settings, setSettings] = useState<ResizeSettings>(DEFAULT_RESIZE_SETTINGS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const didLoadSettingsRef = useRef(false);

  const itemsRef = useRef<ResizeItem[]>([]);
  const settingsRef = useRef<ResizeSettings>(settings);
  const codecRef = useRef<ImageCodec | null>(null);
  const busyRef = useRef(false);
  const cancelledRef = useRef<Set<string>>(new Set());
  const urlsRef = useRef<Set<string>>(new Set());
  const reconvertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (didLoadSettingsRef.current) return;
    didLoadSettingsRef.current = true;
    const loaded = loadResizeSettings();
    setSettings((prev) =>
      JSON.stringify(loaded) === JSON.stringify(prev) ? prev : loaded,
    );
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    codecRef.current = createBrowserCodec();
  }, []);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      if (reconvertTimerRef.current) clearTimeout(reconvertTimerRef.current);
      terminateWorkers();
    };
  }, []);

  const isCancelled = useCallback(
    (id: string) => cancelledRef.current.has(id),
    [],
  );

  const setStage = useCallback((id: string, status: JobStage, error?: string) => {
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status, error } : entry,
      ),
    );
  }, []);

  const assertNotCancelled = useCallback(
    (id: string): void => {
      if (isCancelled(id)) {
        throw Object.assign(
          new ImageProcessingError("Conversion cancelled.", "cancelled"),
          { id },
        );
      }
    },
    [isCancelled],
  );

  const processOne = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (!item) return;
      cancelledRef.current.delete(id);

      setStage(id, "analyzing");
      try {
        const codec = codecRef.current ?? createBrowserCodec();

        setStage(id, "decoding");
        const analyzed = await analyzeImage(item.file, item.name, codec);
        assertNotCancelled(id);

        setItems((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  sourceFormat: analyzed.sourceFormat,
                  width: analyzed.bitmap.width,
                  height: analyzed.bitmap.height,
                  hasAlpha: hasAlpha(analyzed.bitmap),
                  heavy: isHeavy(analyzed.bitmap.width, analyzed.bitmap.height),
                  estimatedBytes: estimateWorkingBytes(
                    analyzed.bitmap.width,
                    analyzed.bitmap.height,
                  ),
                }
              : entry,
          ),
        );

        assertNotCancelled(id);

        const currentSettings = settingsRef.current;
        const outputFormat =
          currentSettings.outputFormat === "original"
            ? mapOriginalFormat(analyzed.sourceFormat)
            : (currentSettings.outputFormat as EncodeFormat);

        const target = computeTargetDimensions(
          analyzed.bitmap.width,
          analyzed.bitmap.height,
          currentSettings,
        );

        setStage(id, "processing");

        const contain =
          currentSettings.preset === "social" && currentSettings.socialRatio !== "custom"
            ? (
                await import("./resize-settings")
              ).computeSocialContain(
                analyzed.bitmap.width,
                analyzed.bitmap.height,
                currentSettings,
              )
            : null;

        let resized;
        if (contain) {
          resized = await codecContain(
            codec,
            analyzed.bitmap,
            contain,
            outputFormat,
            currentSettings.background,
          );
        } else {
          resized = await codec.scale(
            analyzed.bitmap,
            target.width,
            target.height,
          );
        }
        assertNotCancelled(id);

        setStage(id, "encoding");

        const options: ConversionOptions = normalizeConversionOptions({
          outputFormat,
          quality: currentSettings.quality,
          background: currentSettings.background,
          resizeMode: "keep",
          pngCompression: "balanced",
          pngMode: "lossless",
          maintainAspectRatio: true,
          allowUpscale: false,
          width: target.width,
          height: target.height,
          percentage: 100,
        });

        const result = await encodeBitmap(resized, item.name, options, codec);
        assertNotCancelled(id);

        const blob = new Blob([new Uint8Array(result.data)], {
          type: result.mimeType,
        });
        const resultUrl = URL.createObjectURL(blob);
        urlsRef.current.add(resultUrl);

        setItems((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status: "complete",
                  resultUrl,
                  resultWidth: result.width,
                  resultHeight: result.height,
                  resultSize: result.sizeBytes,
                  resultFormat: result.format,
                  resultData: result.data,
                  resultMimeType: result.mimeType,
                  resultOutputName: result.outputName,
                }
              : entry,
          ),
        );
      } catch (error) {
        const code =
          error instanceof ImageProcessingError ? error.code : "convert-failed";
        if (code === "cancelled") {
          setStage(id, "cancelled");
        } else {
          setStage(id, "failed", toFriendlyMessage(error));
        }
      }
    },
    [assertNotCancelled, setStage],
  );

  useEffect(() => {
    if (busyRef.current) return;
    busyRef.current = true;
    void (async () => {
      let next = itemsRef.current.find(
        (entry) => entry.status === "queued",
      );
      while (next) {
        await processOne(next.id);
        next = itemsRef.current.find(
          (entry) => entry.status === "queued",
        );
      }
    })().finally(() => {
      busyRef.current = false;
    });
  }, [items, processOne]);

  const addFiles = useCallback(async (files: File[]) => {
    const incoming: ResizeItem[] = [];
    for (const file of files) {
      const id = nextId();
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.add(previewUrl);

      const detected = await detectFormatFromFile(file);
      if (detected === "svg" || detected === "ico") {
        URL.revokeObjectURL(previewUrl);
        urlsRef.current.delete(previewUrl);
        incoming.push({
          id,
          file,
          name: file.name,
          status: "unsupported",
          error:
            detected === "svg"
              ? "SVG images cannot be resized — use Image Converter for format conversion."
              : "ICO images cannot be resized — use Image Converter for format conversion.",
          sourceFormat: null,
          originalSize: file.size,
          previewUrl: undefined,
        });
        continue;
      }

      incoming.push({
        id,
        file,
        name: file.name,
        status: "queued",
        sourceFormat: null,
        originalSize: file.size,
        previewUrl,
      });
    }
    setItems((prev) => [...prev, ...incoming]);
    setSelectedId((prev) => prev ?? incoming[0]?.id ?? null);
  }, []);

  const removeItem = useCallback((id: string) => {
    cancelledRef.current.delete(id);
    setItems((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
          urlsRef.current.delete(item.previewUrl);
        }
        if (item.resultUrl) {
          URL.revokeObjectURL(item.resultUrl);
          urlsRef.current.delete(item.resultUrl);
        }
      }
      return prev.filter((entry) => entry.id !== id);
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const clearAll = useCallback(() => {
    cancelledRef.current.clear();
    itemsRef.current.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    urlsRef.current.clear();
    setItems([]);
    setSelectedId(null);
  }, []);

  const cancelItem = useCallback(
    (id: string) => {
      cancelledRef.current.add(id);
      setStage(id, "cancelled");
    },
    [setStage],
  );

  const cancelAll = useCallback(() => {
    itemsRef.current.forEach((item) => {
      if (isInProgress(item.status)) cancelledRef.current.add(item.id);
    });
    setItems((prev) =>
      prev.map((entry) =>
        isInProgress(entry.status)
          ? { ...entry, status: "cancelled" as const }
          : entry,
      ),
    );
  }, []);

  const reconvertAll = useCallback(() => {
    setItems((prev) =>
      prev.map((entry) => {
        if (entry.status !== "complete") return entry;
        if (entry.resultUrl) {
          URL.revokeObjectURL(entry.resultUrl);
          urlsRef.current.delete(entry.resultUrl);
        }
        return {
          ...entry,
          status: "queued",
          resultUrl: undefined,
          resultWidth: undefined,
          resultHeight: undefined,
          resultSize: undefined,
          resultFormat: undefined,
          resultData: undefined,
          resultMimeType: undefined,
          resultOutputName: undefined,
        };
      }),
    );
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<ResizeSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        saveResizeSettings(next);
        return next;
      });
      setItems((prev) =>
        prev.map((entry) => {
          if (isInProgress(entry.status)) {
            cancelledRef.current.add(entry.id);
            return { ...entry, status: "cancelled" as const };
          }
          return entry;
        }),
      );
      if (reconvertTimerRef.current) clearTimeout(reconvertTimerRef.current);
      reconvertTimerRef.current = setTimeout(() => {
        reconvertTimerRef.current = null;
        reconvertAll();
      }, 500);
    },
    [reconvertAll],
  );

  const reconvertOne = useCallback((id: string) => {
    cancelledRef.current.delete(id);
    setItems((prev) =>
      prev.map((entry) => {
        if (
          entry.id !== id ||
          (entry.status !== "complete" &&
            entry.status !== "failed" &&
            entry.status !== "cancelled")
        ) {
          return entry;
        }
        if (entry.resultUrl) {
          URL.revokeObjectURL(entry.resultUrl);
          urlsRef.current.delete(entry.resultUrl);
        }
        return {
          ...entry,
          status: "queued",
          error: undefined,
          resultUrl: undefined,
          resultWidth: undefined,
          resultHeight: undefined,
          resultSize: undefined,
          resultFormat: undefined,
          resultData: undefined,
          resultMimeType: undefined,
          resultOutputName: undefined,
        };
      }),
    );
  }, []);

  const downloadOne = useCallback((id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item?.resultData) return;
    downloadBlob(
      new Blob([new Uint8Array(item.resultData)], {
        type: item.resultMimeType ?? "image/webp",
      }),
      item.resultOutputName ?? "output.webp",
    );
  }, []);

  const downloadAll = useCallback(() => {
    const complete = itemsRef.current.filter(
      (entry) => entry.status === "complete" && entry.resultData,
    );
    if (!complete.length) return;
    if (complete.length === 1) {
      downloadBlob(
        new Blob([new Uint8Array(complete[0].resultData!)], {
          type: complete[0].resultMimeType ?? "image/webp",
        }),
        complete[0].resultOutputName ?? "output.webp",
      );
      return;
    }
    const names = dedupeNames(
      complete.map((entry) => entry.resultOutputName ?? "output.webp"),
    );
    const entries = complete.map((entry, index) => ({
      name: names[index],
      data: entry.resultData!,
    }));
    const zip = createZip(entries);
    downloadBlob(
      new Blob([new Uint8Array(zip)], { type: "application/zip" }),
      "folio-desk-resized.zip",
    );
  }, []);

  const counts = useMemo(() => {
    const complete = items.filter((entry) => entry.status === "complete").length;
    const failed = items.filter((entry) => entry.status === "failed").length;
    const processing = items.filter((entry) =>
      isInProgress(entry.status),
    ).length;
    const totalBytes = items.reduce(
      (sum, entry) => sum + (entry.resultSize ?? 0),
      0,
    );
    return { complete, failed, processing, totalBytes };
  }, [items]);

  const selectedItem =
    items.find((entry) => entry.id === selectedId) ?? items[0] ?? null;

  const heavyWarning =
    selectedItem?.heavy && selectedItem.estimatedBytes
      ? `This image needs about ${formatBytes(selectedItem.estimatedBytes)} of browser memory to resize. Close other heavy browser tabs if you hit memory issues.`
      : null;

  const printWarning =
    settings.preset === "print" &&
    selectedItem?.width &&
    selectedItem?.height
      ? (() => {
          const pp = printPixelDimensions(settings);
          if (needsUpscale(selectedItem.width, selectedItem.height, pp.width, pp.height)) {
            return `The source image (${selectedItem.width}\u00d7${selectedItem.height}) has fewer pixels than the target (${pp.width}\u00d7${pp.height}). DPI does not create image detail — the output will be limited to the source resolution.`;
          }
          return null;
        })()
      : null;

  return (
    <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-text">
          Image Resizer
        </h2>
      </div>

      <div className="mt-5 space-y-4">
        <UploadZone onFiles={addFiles} />

        <p className="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/[0.04] px-4 py-3 text-xs leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          Images are resized in your browser and are not uploaded to our
          servers.
        </p>

        <ResizeOptions
          settings={settings}
          onChange={updateSettings}
          srcWidth={selectedItem?.width ?? 0}
          srcHeight={selectedItem?.height ?? 0}
        />

        {heavyWarning ? (
          <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            <span aria-hidden="true">⚠</span>
            {heavyWarning}
          </p>
        ) : null}

        {printWarning ? (
          <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            <span aria-hidden="true">⚠</span>
            {printWarning}
          </p>
        ) : null}

        {items.length > 0 ? (
          <>
            <FileQueue
              items={items.map(adaptItem)}
              onCancel={cancelItem}
              onCancelAll={cancelAll}
              onClearAll={clearAll}
              onCompress={() => {}}
              onDownload={downloadOne}
              onReconvert={reconvertOne}
              onRemove={removeItem}
              onSelect={setSelectedId}
              selectedId={selectedItem?.id ?? null}
            />

            {selectedItem && selectedItem.width && selectedItem.height ? (
              <ResizeResultCard item={selectedItem} settings={settings} />
            ) : null}

            <div className="rounded-2xl border border-border bg-paper-deep/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {counts.complete} of {items.length} resized
                </span>
                {counts.complete ? (
                  <span className="font-semibold text-text">
                    {formatBytes(counts.totalBytes)}
                  </span>
                ) : null}
              </div>
              <button
                className={cn(
                  "btn-primary mt-3 w-full",
                  counts.complete === 0 && "cursor-not-allowed opacity-50",
                )}
                disabled={counts.complete === 0}
                onClick={downloadAll}
                type="button"
              >
                <FolderDown className="h-4 w-4" />
                {counts.complete === 1
                  ? "Download resized image"
                  : "Download all (.zip)"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ResizeResultCard({
  item,
  settings,
}: {
  item: ResizeItem;
  settings: ResizeSettings;
}) {
  const isComplete = item.status === "complete";
  const isWorking = ["analyzing", "decoding", "processing", "encoding"].includes(item.status);
  const isFailed = item.status === "failed";

  const target = computeTargetDimensions(
    item.width ?? 0,
    item.height ?? 0,
    settings,
  );
  const scalePercent =
    item.width && item.resultWidth
      ? Math.round((item.resultWidth / item.width) * 100)
      : Math.round((target.width / (item.width || 1)) * 100);
  const sizeDelta =
    isComplete && item.resultSize
      ? item.resultSize - item.originalSize
      : null;
  const sizeDeltaPercent =
    sizeDelta !== null && item.originalSize > 0
      ? Math.round((sizeDelta / item.originalSize) * 100)
      : null;

  const format = isComplete
    ? (item.resultFormat ?? "webp").toUpperCase()
    : settings.outputFormat === "original"
      ? (item.sourceFormat ?? "IMG").toUpperCase()
      : settings.outputFormat.toUpperCase();

  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <h3 className="text-sm font-semibold text-text">Resize result</h3>

      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-center">
        {/* Original */}
        <div className="w-full max-w-[200px] text-center">
          <div className="mx-auto flex h-32 items-center justify-center overflow-hidden rounded-xl border border-border bg-paper-deep/40">
            {item.previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="max-h-32 max-w-full object-contain"
                src={item.previewUrl}
              />
            ) : (
              <span className="text-xs text-muted">Original</span>
            )}
          </div>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Original
          </p>
          <p className="mt-1 text-sm font-semibold text-text">
            {item.width && item.height
              ? `${item.width} × ${item.height}`
              : "—"}
          </p>
          <p className="text-xs text-muted">{formatBytes(item.originalSize)}</p>
        </div>

        <ArrowRight
          aria-hidden="true"
          className="mt-8 h-5 w-5 shrink-0 text-muted sm:mt-10"
        />

        {/* Output / Target */}
        <div className="w-full max-w-[200px] text-center">
          <div
            className={cn(
              "mx-auto flex h-32 items-center justify-center overflow-hidden rounded-xl border",
              isComplete
                ? "border-success/40 bg-success/[0.03]"
                : "border-border bg-paper-deep/40",
            )}
          >
            {isComplete && item.resultUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="max-h-32 max-w-full object-contain"
                src={item.resultUrl}
              />
            ) : isWorking ? (
              <span className="text-xs text-muted">Resizing…</span>
            ) : isFailed ? (
              <span className="text-xs text-error">Failed</span>
            ) : (
              <span className="text-xs text-muted">{target.width} × {target.height}</span>
            )}
          </div>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            {isComplete ? "Resized" : "Target"}
          </p>
          <p className="mt-1 text-sm font-semibold text-text">
            {isComplete && item.resultWidth && item.resultHeight
              ? `${item.resultWidth} × ${item.resultHeight}`
              : `${target.width} × ${target.height}`}
          </p>
          <p className="text-xs text-muted">
            {isComplete && item.resultSize
              ? formatBytes(item.resultSize)
              : "…"}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
        <span className="rounded-full border border-border bg-paper-deep/60 px-3 py-1 font-semibold text-muted">
          Scale: {scalePercent}%
        </span>
        <span className="rounded-full border border-border bg-paper-deep/60 px-3 py-1 font-semibold text-muted">
          Format: {format}
        </span>
        {sizeDeltaPercent !== null ? (
          <span
            className={cn(
              "rounded-full border px-3 py-1 font-semibold",
              sizeDeltaPercent <= 0
                ? "border-success/30 bg-success/[0.06] text-success"
                : "border-warning/30 bg-warning/[0.06] text-warning",
            )}
          >
            {sizeDeltaPercent <= 0 ? "−" : "+"}
            {Math.abs(sizeDeltaPercent)}% size
          </span>
        ) : null}
        {isFailed && item.error ? (
          <span className="rounded-full border border-error/30 bg-error/[0.06] px-3 py-1 font-semibold text-error">
            {item.error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
