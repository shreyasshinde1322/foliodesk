import type {
  ConvertedImage,
  EncodeFormat,
  ImageFormat,
  ImageProcessingError,
  JobStage,
} from "@/engines/image";

export interface QueueItem {
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
  /** Rough estimate of the working buffer, set after decoding heavy images. */
  heavy?: boolean;
  /** Estimated peak RGBA working buffer size in bytes. */
  estimatedBytes?: number;
  result?: ConvertedImage;
  resultUrl?: string;
}

const IN_PROGRESS: ReadonlySet<JobStage> = new Set([
  "analyzing",
  "decoding",
  "processing",
  "encoding",
]);

export function isInProgress(status: JobStage): boolean {
  return IN_PROGRESS.has(status);
}

export const STAGE_LABEL: Record<JobStage, string> = {
  queued: "Queued",
  analyzing: "Detecting format",
  decoding: "Decoding pixels",
  processing: "Resizing / preparing",
  encoding: "Encoding",
  complete: "Complete",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function formatSupportsAlpha(format: EncodeFormat): boolean {
  return format !== "jpg";
}

const INPUT_TEXT =
  "JPG, PNG, WebP, GIF, AVIF, HEIC, HEIF, PSD, BMP, ICO, or SVG";

export function toFriendlyMessage(error: unknown): string {
  if (error instanceof Error && "code" in error) {
    const code = (error as ImageProcessingError).code;
    switch (code) {
      case "file-too-large":
        return "This file is larger than the 25 MB limit. Try a smaller file.";
      case "invalid-file":
        return "This file is empty and could not be converted.";
      case "unsupported-format":
        return `This file is not a supported image (${INPUT_TEXT}).`;
      case "animated-gif":
        return "Animated GIFs are not supported yet — they would silently lose frames. Convert a static image instead.";
      case "image-too-large":
        return "This image is too large to convert safely in the browser. Reduce its dimensions first.";
      case "decode-failed":
        return "The image could not be decoded in this browser. Try another format.";
      case "encode-failed":
        return "This browser could not encode the image in the selected format.";
      case "output-invalid":
        return "The encoder produced an invalid file.";
      case "worker-failed":
        return "A background worker could not be started. PSD input needs Web Worker support.";
      case "cancelled":
        return "Conversion was cancelled.";
    }
  }
  return "This image could not be converted. Try again with a different file.";
}
