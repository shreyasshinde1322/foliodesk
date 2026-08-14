"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Upload } from "lucide-react";

export function UploadZone({
  onFiles,
  disabled = false,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onFiles(files);
  }

  return (
    <div
      aria-disabled={disabled}
      className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
        dragging
          ? "border-primary bg-primary-soft/60"
          : "border-border bg-paper-deep/40 hover:border-primary/40"
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFiles(files);
          event.target.value = "";
        }}
        ref={inputRef}
        type="file"
      />
      <span
        aria-hidden="true"
        className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-soft to-paper-deep text-primary ring-1 ring-border/60"
      >
        <ImagePlus className="h-6 w-6" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-sm font-semibold text-text">
        Drag & drop images here, or{" "}
        <button
          className="font-semibold text-primary underline underline-offset-2 hover:text-primary-hover"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          browse files
        </button>
      </p>
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted">
        <Upload className="h-3.5 w-3.5" />
        JPG, PNG, WebP, GIF, and AVIF · up to 25 MB per file · multiple files
        supported
      </p>
    </div>
  );
}
