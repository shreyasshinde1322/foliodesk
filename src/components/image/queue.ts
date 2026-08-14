import type { ImageProcessingError, ConvertedImage, EncodeFormat, ImageFormat, ImageJobStatus } from "@/engines/image";

export interface QueueItem {
  id: string;
  file: File;
  name: string;
  status: ImageJobStatus;
  error?: string;
  sourceFormat: ImageFormat | null;
  width?: number;
  height?: number;
  originalSize: number;
  previewUrl?: string;
  hasAlpha?: boolean;
  result?: ConvertedImage;
  resultUrl?: string;
}

export function formatSupportsAlpha(format: EncodeFormat): boolean {
  return format !== "jpg";
}

export function toFriendlyMessage(error: unknown): string {
  if (error instanceof Error && "code" in error) {
    const code = (error as ImageProcessingError).code;
    if (code === "file-too-large") {
      return "This file is larger than the 25 MB limit. Try a smaller file.";
    }
    if (code === "unsupported-format") {
      return "This file is not a supported image (JPG, PNG, WebP, GIF, or AVIF).";
    }
    if (code === "decode-failed") {
      return "The image could not be decoded in this browser. Try another format.";
    }
    if (code === "encode-failed") {
      return "This browser could not encode the image in the selected format.";
    }
  }
  return "This image could not be converted. Try again with a different file.";
}
