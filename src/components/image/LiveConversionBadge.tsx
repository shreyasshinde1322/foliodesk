"use client";

import { ArrowRight } from "lucide-react";
import { FileTypeIcon } from "@/components/icons/FileTypeIcon";
import type { EncodeFormat, ImageFormat } from "@/engines/image";
import type { FileFormat } from "@/types/tools";

const FORMAT_TO_FILE: Record<string, FileFormat> = {
  jpg: "jpg",
  png: "png",
  webp: "webp",
  gif: "gif",
  avif: "avif",
};

export function LiveConversionBadge({
  source,
  output,
}: {
  source: ImageFormat | null;
  output: EncodeFormat;
}) {
  const sourceType: FileFormat = source ? FORMAT_TO_FILE[source] : "image";
  const outputType: FileFormat = FORMAT_TO_FILE[output] ?? "image";

  return (
    <div
      aria-label={`Conversion preview: ${source ?? "image"} to ${output}`}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-gradient-to-br from-white to-primary-soft/50 px-3 py-2 shadow-[var(--shadow-subtle)]"
      role="img"
    >
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md ring-1 ring-border/60">
        <FileTypeIcon size="sm" type={sourceType} />
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-md ring-1 ring-border/60">
        <FileTypeIcon size="sm" type={outputType} />
      </span>
      <span className="hidden pl-1 text-xs font-semibold text-muted sm:block">
        {source ? source.toUpperCase() : "IMG"} → {output.toUpperCase()}
      </span>
    </div>
  );
}
