"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderDown, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  analyzeImage,
  convertBitmap,
  createBrowserCodec,
  createZip,
  dedupeNames,
  getBrowserCapabilities,
  hasAlpha,
  normalizeConversionOptions,
} from "@/engines/image";
import type {
  BrowserCapabilities,
  ConversionOptions,
  DecodedBitmap,
  ImageCodec,
  ImageFormat,
} from "@/engines/image";
import { downloadBlob } from "@/lib/export/download";
import { formatBytes } from "@/lib/format";
import { cn } from "@/lib/cn";
import { FileQueue } from "./FileQueue";
import { LiveConversionBadge } from "./LiveConversionBadge";
import { OptionsPanel } from "./OptionsPanel";
import { PreviewPanel } from "./PreviewPanel";
import { UploadZone } from "./UploadZone";
import type { QueueItem } from "./queue";
import { toFriendlyMessage } from "./queue";

let idSequence = 0;
function nextId(): string {
  idSequence += 1;
  const random = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `img-${Date.now().toString(36)}-${random}-${idSequence}`;
}

export function ImageConverter() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [options, setOptions] = useState<ConversionOptions>(() =>
    normalizeConversionOptions({ outputFormat: "webp" }),
  );
  const [capabilities, setCapabilities] = useState<BrowserCapabilities | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const itemsRef = useRef<QueueItem[]>([]);
  const optionsRef = useRef<ConversionOptions>(options);
  const codecRef = useRef<ImageCodec | null>(null);
  const busyRef = useRef(false);
  const urlsRef = useRef<Set<string>>(new Set());
  const decodedRef = useRef<Map<string, DecodedBitmap>>(new Map());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    codecRef.current = createBrowserCodec();
    let cancelled = false;
    void getBrowserCapabilities().then((caps) => {
      if (!cancelled) setCapabilities(caps);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const processOne = useCallback(async (id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item) return;
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "processing", error: undefined } : entry,
      ),
    );
    try {
      const codec = codecRef.current ?? createBrowserCodec();
      if (!decodedRef.current.has(id)) {
        const analyzed = await analyzeImage(item.file, item.name, codec);
        decodedRef.current.set(id, analyzed.bitmap);
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  sourceFormat: analyzed.sourceFormat,
                  width: analyzed.bitmap.width,
                  height: analyzed.bitmap.height,
                  hasAlpha: hasAlpha(analyzed.bitmap),
                }
              : entry,
          ),
        );
      }
      const bitmap = decodedRef.current.get(id);
      if (!bitmap) return;
      const result = await convertBitmap(bitmap, item.name, optionsRef.current, codec);
      const blob = new Blob([new Uint8Array(result.data)], { type: result.mimeType });
      const resultUrl = URL.createObjectURL(blob);
      urlsRef.current.add(resultUrl);
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, status: "complete", result, resultUrl } : entry,
        ),
      );
    } catch (error) {
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? { ...entry, status: "failed", error: toFriendlyMessage(error) }
            : entry,
        ),
      );
    } finally {
      decodedRef.current.delete(id);
    }
  }, []);

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
        decodedRef.current.delete(id);
      }
      return prev.filter((entry) => entry.id !== id);
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const clearAll = useCallback(() => {
    itemsRef.current.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    urlsRef.current.clear();
    decodedRef.current.clear();
    setItems([]);
    setSelectedId(null);
    setDirty(false);
  }, []);

  const updateOptions = useCallback((patch: Partial<ConversionOptions>) => {
    const hasComplete = itemsRef.current.some((entry) => entry.status === "complete");
    if (hasComplete) setDirty(true);
    setOptions((prev) => normalizeConversionOptions({ ...prev, ...patch }));
  }, []);

  const reconvertAll = useCallback(() => {
    setItems((prev) =>
      prev.map((entry) => {
        if (entry.status !== "complete") return entry;
        if (entry.resultUrl) {
          URL.revokeObjectURL(entry.resultUrl);
          urlsRef.current.delete(entry.resultUrl);
        }
        decodedRef.current.delete(entry.id);
        return { ...entry, status: "queued", result: undefined, resultUrl: undefined };
      }),
    );
    setDirty(false);
  }, []);

  const reconvertOne = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((entry) => {
        if (entry.id !== id || entry.status !== "complete") return entry;
        if (entry.resultUrl) {
          URL.revokeObjectURL(entry.resultUrl);
          urlsRef.current.delete(entry.resultUrl);
        }
        decodedRef.current.delete(id);
        return { ...entry, status: "queued", result: undefined, resultUrl: undefined };
      }),
    );
  }, []);

  const downloadOne = useCallback((id: string) => {
    const item = itemsRef.current.find((entry) => entry.id === id);
    if (!item?.result) return;
    downloadBlob(new Blob([new Uint8Array(item.result.data)], { type: item.result.mimeType }), item.result.outputName);
  }, []);

  const downloadAll = useCallback(() => {
    const complete = itemsRef.current.filter(
      (entry) => entry.status === "complete" && entry.result,
    );
    if (!complete.length) return;
    const names = dedupeNames(complete.map((entry) => entry.result!.outputName));
    const entries = complete.map((entry, index) => ({
      name: names[index],
      data: entry.result!.data,
    }));
    const zip = createZip(entries);
    downloadBlob(new Blob([new Uint8Array(zip)], { type: "application/zip" }), "folio-desk-images.zip");
  }, []);

  const counts = useMemo(() => {
    const complete = items.filter((entry) => entry.status === "complete").length;
    const failed = items.filter((entry) => entry.status === "failed").length;
    const processing = items.filter((entry) => entry.status === "processing").length;
    const totalBytes = items.reduce(
      (sum, entry) => sum + (entry.result?.sizeBytes ?? 0),
      0,
    );
    return { complete, failed, processing, totalBytes };
  }, [items]);

  const selectedItem =
    items.find((entry) => entry.id === selectedId) ??
    items[0] ??
    null;
  const badgeSource: ImageFormat | null =
    selectedItem?.sourceFormat ?? items[0]?.sourceFormat ?? null;

  return (
    <div className="mt-6 rounded-[var(--radius-lg)] border border-border bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold text-text">Image Converter</h2>
        <LiveConversionBadge output={options.outputFormat} source={badgeSource} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <UploadZone onFiles={addFiles} />
          {items.length ? (
            <FileQueue
              items={items}
              onClearAll={clearAll}
              onDownload={downloadOne}
              onReconvert={reconvertOne}
              onRemove={removeItem}
              onSelect={setSelectedId}
              selectedId={selectedItem?.id ?? null}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          <OptionsPanel
            capabilities={capabilities}
            onChange={updateOptions}
            options={options}
          />

          {dirty && counts.complete > 0 ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-medium text-warning">
                <TriangleAlert className="h-4 w-4 shrink-0" />
                Options changed.
              </p>
              <button
                className="btn-secondary px-3 py-1.5 text-xs"
                onClick={reconvertAll}
                type="button"
              >
                Reconvert {counts.complete}
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-paper-deep/40 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">
                {counts.complete} of {items.length} converted
              </span>
              {counts.complete ? (
                <span className="font-semibold text-text">{formatBytes(counts.totalBytes)}</span>
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
              Download all (.zip)
            </button>
          </div>

          <p className="flex items-start gap-2 rounded-2xl border border-success/25 bg-success/[0.04] px-4 py-3 text-xs leading-relaxed text-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            Images are processed in your browser and are not uploaded to our
            servers.
          </p>
        </div>
      </div>

      {items.length ? (
        <div className="mt-5">
          <PreviewPanel
            background={options.background}
            item={selectedItem}
            outputFormat={options.outputFormat}
          />
        </div>
      ) : null}
    </div>
  );
}
