"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FolderDown, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  ImageProcessingError,
  analyzeImage,
  createBrowserCodec,
  createZip,
  dedupeNames,
  estimateUniqueColors,
  estimateWorkingBytes,
  formatMegabytes,
  hasAlpha,
  hashFile,
  inspectImageBytes,
  isHeavy,
  optimizeImage,
  recommendFormat,
  terminateWorkers,
} from "@/engines/image";
import type {
  EncodeFormat,
  ImageCodec,
  ImageFormat,
  JobStage,
  OptimizationRequest,
} from "@/engines/image";
import { detectFormat } from "@/engines/image/formats";
import { downloadBlob } from "@/lib/export/download";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ComparisonPreview } from "./ComparisonPreview";
import { CompressOptions } from "./CompressOptions";
import type { CompressSettings } from "./compress-settings";
import { DEFAULT_SETTINGS, loadCompressSettings, saveCompressSettings } from "./compress-settings";
import { FileQueue } from "./FileQueue";
import { ImageInspector } from "./ImageInspector";
import { LiveConversionBadge } from "./LiveConversionBadge";
import { ResultStats } from "./ResultStats";
import { UploadZone } from "./UploadZone";
import type { QueueItem } from "./queue";
import { isInProgress, toFriendlyMessage } from "./queue";

const COMPRESSIBLE = new Set<ImageFormat>([
  "jpg", "webp", "avif", "heic", "heif", "gif", "bmp", "psd", "jxl",
]);

const REJECTED = new Set<ImageFormat>(["png", "ico", "svg"]);

function keepFormatFor(source: ImageFormat | null): EncodeFormat {
  switch (source) {
    case "jpg":
      return "jpg";
    case "webp":
      return "webp";
    case "avif":
      return "avif";
    case "heic":
    case "heif":
      return "heic";
    case "gif":
      return "gif";
    case "jxl":
      return "jxl";
    default:
      return "webp";
  }
}

/** Resolve the concrete output format for a file, or null for Auto format. */
function mappedFormat(settings: CompressSettings, source: ImageFormat | null): EncodeFormat | null {
  if (settings.autoFormat) return null;
  if (settings.format === "webp") return "webp";
  if (settings.format === "jpg") return "jpg";
  if (settings.format === "jxl") return "jxl";
  return keepFormatFor(source);
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

const FORMAT_LABELS: Record<string, string> = {
  png: "PNG",
  gif: "GIF",
  heic: "HEIC",
  heif: "HEIF",
  psd: "PSD",
  bmp: "BMP",
  ico: "ICO",
  svg: "SVG",
  jxl: "JXL",
};

function detectFormatFromFile(file: File): Promise<ImageFormat | null> {
  return new Promise<ImageFormat | null>((resolve) => {
    const slice = file.slice(0, 16);
    const reader = new FileReader();
    reader.onload = () => {
      const bytes = new Uint8Array(reader.result as ArrayBuffer);
      resolve(detectFormat(bytes));
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(slice);
  });
}

export function ImageCompressor() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [settings, setSettings] = useState<CompressSettings>(DEFAULT_SETTINGS);
  const didLoadSettingsRef = useRef(false);

  useEffect(() => {
    if (didLoadSettingsRef.current) return;
    didLoadSettingsRef.current = true;
    const loaded = loadCompressSettings();
    setSettings((prev) =>
      JSON.stringify(loaded) === JSON.stringify(prev) ? prev : loaded,
    );
  }, []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [duplicatesDismissed, setDuplicatesDismissed] = useState(false);

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
    saveCompressSettings(settings);
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
        throw Object.assign(new ImageProcessingError("Compression cancelled.", "cancelled"), { id });
      }
    },
    [isCancelled],
  );

  const processOne = useCallback(
    async (id: string) => {
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (!item) return;
      if (item.formatRejected) return;
      cancelledRef.current.delete(id);
      setStage(id, "analyzing");
      try {
        const codec = codecRef.current ?? createBrowserCodec();

        const analyzed = await analyzeImage(item.file, item.name, codec);
        assertNotCancelled(id);

        if (!COMPRESSIBLE.has(analyzed.sourceFormat) || REJECTED.has(analyzed.sourceFormat)) {
          setItems((prev) =>
            prev.map((entry) =>
              entry.id === id
                ? { ...entry, status: "unsupported", formatRejected: analyzed.sourceFormat, sourceFormat: analyzed.sourceFormat }
                : entry,
            ),
          );
          return;
        }

        const bytes = new Uint8Array(await item.file.arrayBuffer());
        const metadata = inspectImageBytes(bytes, analyzed.sourceFormat);
        const alpha = hasAlpha(analyzed.bitmap);
        const recommendation = recommendFormat(
          analyzed.sourceFormat,
          alpha,
          estimateUniqueColors(analyzed.bitmap),
        ).primary;

        setItems((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  sourceFormat: analyzed.sourceFormat,
                  width: analyzed.bitmap.width,
                  height: analyzed.bitmap.height,
                  hasAlpha: alpha,
                  heavy: isHeavy(analyzed.bitmap.width, analyzed.bitmap.height),
                  estimatedBytes: estimateWorkingBytes(analyzed.bitmap.width, analyzed.bitmap.height),
                  exifOrientation: metadata.orientation,
                  metadataDetected: metadata.metadataDetected,
                  recommendation,
                }
              : entry,
          ),
        );
        assertNotCancelled(id);

        const current = settingsRef.current;
        setStage(id, "optimizing");
        const request: OptimizationRequest = {
          bitmap: analyzed.bitmap,
          name: item.name,
          codec,
          format: mappedFormat(current, analyzed.sourceFormat),
          quality: item.qualityOverride ?? current.quality,
          background: current.background,
          pngCompression: "balanced",
          pngMode: "lossless",
          targetSize: current.targetSize,
          allowResizeForTarget: current.allowResizeForTarget,
          isCancelled: () => cancelledRef.current.has(id),
        };

        const result = await optimizeImage(request);
        assertNotCancelled(id);

        const blob = new Blob([new Uint8Array(result.image.data)], {
          type: result.image.mimeType,
        });
        const resultUrl = URL.createObjectURL(blob);
        urlsRef.current.add(resultUrl);

        const larger =
          current.neverLarger &&
          item.originalSize > 0 &&
          result.image.sizeBytes > item.originalSize;

        setItems((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  status: larger ? "skipped" : "complete",
                  skippedReason: larger ? "larger" : undefined,
                  result: result.image,
                  resultUrl,
                }
              : entry,
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
    setDuplicatesDismissed(false);

    void (async () => {
      const incoming: QueueItem[] = [];

      for (const file of files) {
        const id = nextId();
        const previewUrl = URL.createObjectURL(file);
        urlsRef.current.add(previewUrl);

        const detected = await detectFormatFromFile(file);
        const rejected = detected && REJECTED.has(detected) ? detected : undefined;

        incoming.push({
          id,
          file,
          name: file.name,
          status: rejected ? ("unsupported" as const) : ("queued" as const),
          sourceFormat: null,
          originalSize: file.size,
          previewUrl,
          formatRejected: rejected || undefined,
        });
      }

      setItems((prev) => [...prev, ...incoming]);
      setSelectedId((prev) => prev ?? incoming[0]?.id ?? null);

      for (const entry of incoming) {
        try {
          const hash = await hashFile(entry.file);
          if (cancelledRef.current.has(entry.id)) continue;
          setItems((prev) =>
            prev.map((item) => (item.id === entry.id ? { ...item, hash } : item)),
          );
        } catch {
          // Hashing is best-effort.
        }
      }

      for (const entry of incoming) {
        if (entry.formatRejected) continue;
        if (cancelledRef.current.has(entry.id)) continue;
        try {
          const bitmap = await createImageBitmap(entry.file);
          try {
            setItems((prev) =>
              prev.map((item) =>
                item.id === entry.id
                  ? { ...item, width: bitmap.width, height: bitmap.height }
                  : item,
              ),
            );
          } finally {
            if (typeof bitmap.close === "function") bitmap.close();
          }
        } catch {
          // Dimension detection is best-effort; analysis will catch it later.
        }
      }
    })();
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
    setDuplicatesDismissed(false);
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
        isInProgress(entry.status) ? { ...entry, status: "cancelled" } : entry,
      ),
    );
  }, []);

  const reconvertAll = useCallback(() => {
    setItems((prev) =>
      prev.map((entry) => {
        if (entry.status !== "complete" && entry.status !== "skipped") return entry;
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
          skippedReason: undefined,
          qualityOverride: undefined,
        };
      }),
    );
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<CompressSettings>) => {
      setSettings((prev) => ({ ...prev, ...patch }));
      // Cancel all in-progress items so they re-process with the new quality
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

  const compressItem = useCallback((id: string) => {
    cancelledRef.current.delete(id);
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === id && (entry.status === "ready" || entry.status === "failed" || entry.status === "cancelled")
          ? { ...entry, status: "queued" as const, error: undefined }
          : entry,
      ),
    );
  }, []);

  const reconvertOne = useCallback((id: string) => {
    cancelledRef.current.delete(id);
    setItems((prev) =>
      prev.map((entry) => {
        if (
          entry.id !== id ||
          (entry.status !== "complete" &&
            entry.status !== "failed" &&
            entry.status !== "cancelled" &&
            entry.status !== "skipped")
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
          skippedReason: undefined,
        };
      }),
    );
  }, []);

  const compressStronger = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((entry) => entry.id === id);
      if (!item) return;
      const currentQuality = item.qualityOverride ?? settingsRef.current.quality;
      const override = Math.max(10, currentQuality - 25);
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, qualityOverride: override, status: "queued", error: undefined }
            : entry,
        ),
      );
    },
    [],
  );

  const downloadOne = useCallback((id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item?.result) return;
    downloadBlob(
      new Blob([new Uint8Array(item.result.data)], { type: item.result.mimeType }),
      item.result.outputName,
    );
  }, []);

  const downloadOriginal = useCallback((id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item) return;
    downloadBlob(item.file, item.name);
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

  const duplicateGroups = useMemo(() => {
    const byHash = new Map<string, string[]>();
    for (const item of items) {
      if (!item.hash) continue;
      const list = byHash.get(item.hash) ?? [];
      list.push(item.id);
      byHash.set(item.hash, list);
    }
    return Array.from(byHash.values()).filter((ids) => ids.length > 1);
  }, [items]);
  const duplicateCount = duplicateGroups.reduce((total, ids) => total + ids.length - 1, 0);

  const keepFirstDuplicates = useCallback(() => {
    duplicateGroups.forEach((ids) => {
      ids.slice(1).forEach((id) => removeItem(id));
    });
    setDuplicatesDismissed(true);
  }, [duplicateGroups, removeItem]);

  const counts = useMemo(() => {
    const complete = items.filter((entry) => entry.status === "complete").length;
    const skipped = items.filter((entry) => entry.status === "skipped").length;
    const failed = items.filter((entry) => entry.status === "failed").length;
    const processing = items.filter((entry) => isInProgress(entry.status)).length;
    const resultBytes = items.reduce((sum, entry) => sum + (entry.result?.sizeBytes ?? 0), 0);
    const originalBytes = items.reduce((sum, entry) => sum + entry.originalSize, 0);
    const savedBytes = originalBytes - resultBytes;
    const savedPercent = originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 100) : 0;
    return { complete, skipped, failed, processing, resultBytes, originalBytes, savedBytes, savedPercent };
  }, [items]);

  const processableItems = useMemo(() => items.filter((item) => !item.formatRejected), [items]);

  const selectedItem = processableItems.find((entry) => entry.id === selectedId) ?? processableItems[0] ?? null;
  const badgeSource: ImageFormat | null = selectedItem?.sourceFormat ?? null;
  const mappedOutput: EncodeFormat | null = mappedFormat(settings, badgeSource);
  const badgeOutput: EncodeFormat = selectedItem?.result?.format ?? mappedOutput ?? "webp";

  const heavyWarning =
    selectedItem?.heavy && selectedItem.estimatedBytes
      ? `This image needs about ${formatMegabytes(selectedItem.estimatedBytes)} of browser memory to compress. Close other heavy browser tabs if you hit memory issues.`
      : null;

  const rejectedItems = useMemo(
    () => items.filter((item) => item.formatRejected),
    [items],
  );

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
          servers. Metadata (EXIF, GPS) is removed during local processing.
          <span className="ml-1 font-semibold">Currently supports JPG, WebP, AVIF, JXL, HEIC, HEIF, GIF, BMP, and PSD compression.</span>
        </p>

        {rejectedItems.length > 0 ? (
          <div className="rounded-2xl border border-info/30 bg-info/[0.04] p-5">
            <p className="text-sm font-semibold text-text">
              {rejectedItems.length === 1
                ? `${FORMAT_LABELS[rejectedItems[0].formatRejected ?? ""] ?? rejectedItems[0].formatRejected?.toUpperCase()} detected`
                : `${rejectedItems.length} unsupported files detected`}
            </p>
            <p className="mt-1 text-sm text-muted">
              Compression is currently unavailable for these formats in our browser-only compressor.
              Use the Image Converter to convert them to JPG, WebP, or AVIF.
            </p>
            <Link
              className="mt-3 inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-primary bg-primary-soft px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
              href="/image-converter"
            >
              Open Image Converter
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-xs text-muted">
              Your {rejectedItems.length === 1 ? "file was" : "files were"} analyzed locally in your browser.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {rejectedItems.map((item) => (
                <button
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-white px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-error/40 hover:text-error"
                  key={item.id}
                  onClick={() => removeItem(item.id)}
                  type="button"
                >
                  {item.name}
                  <span className="text-error">×</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <CompressOptions
          onChange={updateSettings}
          settings={settings}
        />

        {processableItems.length > 0 ? (
          <>
            <FileQueue
              items={processableItems}
              onCancel={cancelItem}
              onCancelAll={cancelAll}
              onClearAll={clearAll}
              onCompress={compressItem}
              onCompressStronger={compressStronger}
              onDownload={downloadOne}
              onDownloadOriginal={downloadOriginal}
              onReconvert={reconvertOne}
              onRemove={removeItem}
              onSelect={setSelectedId}
              selectedId={selectedItem?.id ?? null}
            />

            {!duplicatesDismissed && duplicateCount > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
                <p className="flex items-start gap-2 text-xs leading-relaxed text-warning">
                  <span aria-hidden="true">⚠</span>
                  <span>
                    {duplicateCount} duplicate{" "}
                    {duplicateCount === 1 ? "image" : "images"} detected — identical
                    content. Compression is repeated for each copy.
                  </span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-[var(--radius-sm)] border border-warning/40 px-3 py-1.5 text-xs font-semibold text-warning transition-colors hover:bg-warning/20"
                    onClick={keepFirstDuplicates}
                    type="button"
                  >
                    Keep one of each
                  </button>
                  <button
                    className="rounded-[var(--radius-sm)] border border-border bg-white px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:border-primary/40 hover:text-primary"
                    onClick={() => setDuplicatesDismissed(true)}
                    type="button"
                  >
                    Keep all
                  </button>
                </div>
              </div>
            ) : null}

            {heavyWarning ? (
              <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                <span aria-hidden="true">⚠</span>
                {heavyWarning}
              </p>
            ) : null}

            <ComparisonPreview
              background={settings.background}
              item={selectedItem}
              items={processableItems}
              key={selectedItem?.id ?? "none"}
              onSelect={setSelectedId}
              outputFormat={badgeOutput}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <ImageInspector item={selectedItem} />
              <ResultStats item={selectedItem} />
            </div>

            <div className="rounded-2xl border border-border bg-paper-deep/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">
                  {counts.complete} of {processableItems.length} compressed
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
              {counts.skipped ? (
                <p className="mt-1 text-xs text-warning">
                  {counts.skipped} file{counts.skipped === 1 ? "" : "s"} were larger after
                  compression and are excluded from the download.
                </p>
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
