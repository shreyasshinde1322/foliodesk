"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderDown, ShieldCheck } from "lucide-react";
import {
  IMAGE_FORMAT_META,
  ImageProcessingError,
  analyzeImage,
  createBrowserCodec,
  createZip,
  dedupeNames,
  encodeBitmap,
  estimateWorkingBytes,
  formatMegabytes,
  hasAlpha,
  isHeavy,
  normalizeConversionOptions,
  terminateWorkers,
  transformBitmap,
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
import { CompressOptions, type CompressSettings } from "./CompressOptions";
import { FileQueue } from "./FileQueue";
import { LiveConversionBadge } from "./LiveConversionBadge";
import { PreviewPanel } from "./PreviewPanel";
import { UploadZone } from "./UploadZone";
import type { QueueItem } from "./queue";
import { isInProgress, toFriendlyMessage } from "./queue";

const DEFAULT_SETTINGS: CompressSettings = {
  mode: "webp",
  quality: 75,
  background: "#ffffff",
};

function keepFormatFor(source: ImageFormat | null): EncodeFormat {
  switch (source) {
    case "jpg":
      return "jpg";
    case "png":
      return "png";
    case "webp":
      return "webp";
    case "avif":
      return "avif";
    case "heic":
    case "heif":
      return "webp";
    default:
      return "png";
  }
}

function buildOptions(settings: CompressSettings, source: ImageFormat | null): ConversionOptions {
  const base = normalizeConversionOptions({
    background: settings.background,
    quality: settings.quality,
    resizeMode: "keep",
  });
  if (settings.mode === "webp") return { ...base, outputFormat: "webp" };
  if (settings.mode === "jpg") return { ...base, outputFormat: "jpg" };
  const format = keepFormatFor(source);
  return {
    ...base,
    outputFormat: format,
    pngCompression: format === "png" ? "maximum" : base.pngCompression,
  };
}

let idSequence = 0;
function nextId(): string {
  idSequence += 1;
  const random =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `img-${Date.now().toString(36)}-${random}-${idSequence}`;
}

export function ImageCompressor() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<CompressSettings>(DEFAULT_SETTINGS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const itemsRef = useRef<QueueItem[]>([]);
  const settingsRef = useRef<CompressSettings>(settings);
  const codecRef = useRef<ImageCodec | null>(null);
  const busyRef = useRef(false);
  const cancelledRef = useRef<Set<string>>(new Set());
  const urlsRef = useRef<Set<string>>(new Set());
  const reconvertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    codecRef.current = createBrowserCodec();
    return () => {
      codecRef.current = null;
    };
  }, []);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      if (reconvertTimerRef.current) clearTimeout(reconvertTimerRef.current);
      terminateWorkers();
    };
  }, []);

  const isCancelled = useCallback((id: string) => cancelledRef.current.has(id), []);

  const setStage = useCallback((id: string, status: JobStage, error?: string) => {
    setItems((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, status, error } : entry)),
    );
  }, []);

  const assertNotCancelled = useCallback(
    (id: string): void => {
      if (isCancelled(id)) {
        throw Object.assign(new ImageProcessingError("Conversion cancelled.", "cancelled"), { id });
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

        const itemOptions = buildOptions(settingsRef.current, analyzed.sourceFormat);
        assertNotCancelled(id);
        setStage(id, "processing");
        const { bitmap: working } = await transformBitmap(analyzed.bitmap, itemOptions, codec);
        assertNotCancelled(id);

        setStage(id, "encoding");
        const result = await encodeBitmap(working, item.name, itemOptions, codec);
        assertNotCancelled(id);

        const blob = new Blob([new Uint8Array(result.data)], { type: result.mimeType });
        const resultUrl = URL.createObjectURL(blob);
        urlsRef.current.add(resultUrl);
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === id ? { ...entry, status: "complete", result, resultUrl } : entry,
          ),
        );
      } catch (error) {
        const code = error instanceof ImageProcessingError ? error.code : "convert-failed";
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
      let next = itemsRef.current.find((entry) => entry.status === "queued");
      while (next) {
        await processOne(next.id);
        next = itemsRef.current.find((entry) => entry.status === "queued");
      }
    })().finally(() => {
      busyRef.current = false;
    });
  }, [items, processOne]);

  const addFiles = useCallback((files: File[]) => {
    const incoming: QueueItem[] = files.map((file) => {
      const id = nextId();
      const previewUrl = URL.createObjectURL(file);
      urlsRef.current.add(previewUrl);
      return {
        id,
        file,
        name: file.name,
        status: "queued",
        sourceFormat: null,
        originalSize: file.size,
        previewUrl,
      };
    });
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

  const cancelItem = useCallback((id: string) => {
    cancelledRef.current.add(id);
    setStage(id, "cancelled");
  }, [setStage]);

  const cancelAll = useCallback(() => {
    itemsRef.current.forEach((item) => {
      if (isInProgress(item.status)) cancelledRef.current.add(item.id);
    });
    setItems((prev) =>
      prev.map((entry) =>
        isInProgress(entry.status) ? { ...entry, status: "cancelled" } : entry,
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
        return { ...entry, status: "queued", result: undefined, resultUrl: undefined };
      }),
    );
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<CompressSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
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
          (entry.status !== "complete" && entry.status !== "failed" && entry.status !== "cancelled")
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
          result: undefined,
          resultUrl: undefined,
        };
      }),
    );
  }, []);

  const downloadOne = useCallback((id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item?.result) return;
    downloadBlob(
      new Blob([new Uint8Array(item.result.data)], { type: item.result.mimeType }),
      item.result.outputName,
    );
  }, []);

  const downloadAll = useCallback(() => {
    const complete = itemsRef.current.filter(
      (entry) => entry.status === "complete" && entry.result,
    );
    if (!complete.length) return;
    if (complete.length === 1) {
      downloadBlob(
        new Blob([new Uint8Array(complete[0].result!.data)], {
          type: complete[0].result!.mimeType,
        }),
        complete[0].result!.outputName,
      );
      return;
    }
    const names = dedupeNames(complete.map((entry) => entry.result!.outputName));
    const entries = complete.map((entry, index) => ({
      name: names[index],
      data: entry.result!.data,
    }));
    const zip = createZip(entries);
    downloadBlob(
      new Blob([new Uint8Array(zip)], { type: "application/zip" }),
      "folio-desk-compressed.zip",
    );
  }, []);

  const counts = useMemo(() => {
    const complete = items.filter((entry) => entry.status === "complete").length;
    const failed = items.filter((entry) => entry.status === "failed").length;
    const processing = items.filter((entry) => isInProgress(entry.status)).length;
    const resultBytes = items.reduce((sum, entry) => sum + (entry.result?.sizeBytes ?? 0), 0);
    const originalBytes = items.reduce((sum, entry) => sum + entry.originalSize, 0);
    const savedBytes = originalBytes - resultBytes;
    const savedPercent = originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 100) : 0;
    return { complete, failed, processing, resultBytes, originalBytes, savedBytes, savedPercent };
  }, [items]);

  const selectedItem =
    items.find((entry) => entry.id === selectedId) ?? items[0] ?? null;
  const badgeSource: ImageFormat | null = selectedItem?.sourceFormat ?? null;
  const badgeOutput: EncodeFormat =
    selectedItem?.result?.format ??
    (settings.mode === "webp"
      ? "webp"
      : settings.mode === "jpg"
        ? "jpg"
        : keepFormatFor(badgeSource));

  const mappedOutput: EncodeFormat | null =
    settings.mode === "original" && badgeSource ? keepFormatFor(badgeSource) : null;
  const selectedOutputLossless =
    mappedOutput !== null && !IMAGE_FORMAT_META[mappedOutput].lossy;

  const heavyWarning =
    selectedItem?.heavy && selectedItem.estimatedBytes
      ? `This image needs about ${formatMegabytes(selectedItem.estimatedBytes)} of browser memory to compress. Close other heavy browser tabs if you hit memory issues.`
      : null;

  return (
    <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-text">Image Compressor</h2>
        <LiveConversionBadge output={badgeOutput} source={badgeSource} />
      </div>

      <div className="mt-5 space-y-4">
        <UploadZone onFiles={addFiles} />

        <p className="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/[0.04] px-4 py-3 text-xs leading-relaxed text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          Images are compressed in your browser and are not uploaded to our
          servers.
        </p>

        <CompressOptions
          onChange={updateSettings}
          selectedOutputLossless={selectedOutputLossless}
          settings={settings}
        />

        {items.length ? (
          <>
            <FileQueue
              items={items}
              onCancel={cancelItem}
              onCancelAll={cancelAll}
              onClearAll={clearAll}
              onDownload={downloadOne}
              onReconvert={reconvertOne}
              onRemove={removeItem}
              onSelect={setSelectedId}
              selectedId={selectedItem?.id ?? null}
            />

            {heavyWarning ? (
              <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                <span aria-hidden="true">⚠</span>
                {heavyWarning}
              </p>
            ) : null}

            <PreviewPanel
              background={settings.background}
              item={selectedItem}
              items={items}
              onSelect={setSelectedId}
              outputFormat={badgeOutput}
            />

            <div className="rounded-2xl border border-border bg-paper-deep/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {counts.complete} of {items.length} compressed
                </span>
                {counts.complete ? (
                  <span
                    className={cn(
                      "font-semibold",
                      counts.savedPercent > 0
                        ? "text-success"
                        : counts.savedPercent < 0
                          ? "text-error"
                          : "text-muted",
                    )}
                  >
                    {counts.savedPercent > 0
                      ? `−${formatBytes(counts.savedBytes)} (${counts.savedPercent}%)`
                      : counts.savedPercent < 0
                        ? `+${formatBytes(-counts.savedBytes)} (${-counts.savedPercent}%)`
                        : "No size change"}
                  </span>
                ) : null}
              </div>
              {counts.complete ? (
                <div className="mt-1 flex items-center justify-between text-xs text-muted">
                  <span>
                    {formatBytes(counts.originalBytes)} → {formatBytes(counts.resultBytes)}
                  </span>
                  <span>total</span>
                </div>
              ) : null}
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
                {counts.complete === 1 ? "Download compressed image" : "Download all (.zip)"}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
