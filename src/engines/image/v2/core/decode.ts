import type { ImageFormat, NormalizedImage } from "./types";

const FORMAT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  psd: "image/vnd.adobe.photoshop",
  bmp: "image/bmp",
  ico: "image/x-icon",
  svg: "image/svg+xml",
};

function toBlob(data: Uint8Array, type: string): Blob {
  return new Blob([data as unknown as BlobPart], { type });
}

export async function decodeImage(
  data: Uint8Array,
  sourceFormat: ImageFormat,
): Promise<NormalizedImage> {
  const mime = FORMAT_MIME[sourceFormat] ?? "image/png";
  const blob = toBlob(data, mime);

  if (typeof createImageBitmap !== "function") {
    throw new Error("createImageBitmap is unavailable in this browser.");
  }

  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context for decoding.");
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    return {
      width: bitmap.width,
      height: bitmap.height,
      data: new Uint8ClampedArray(imageData.data),
    };
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}

export async function decodeToRgba(bytes: Uint8Array): Promise<NormalizedImage> {
  if (typeof createImageBitmap !== "function") {
    throw new Error("createImageBitmap is unavailable in this browser.");
  }

  const blob = toBlob(bytes, "image/png");
  const bitmap = await createImageBitmap(blob);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context.");
    ctx.drawImage(bitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
    return {
      width: bitmap.width,
      height: bitmap.height,
      data: new Uint8ClampedArray(imageData.data),
    };
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}

export function hasAlpha(data: Uint8ClampedArray): boolean {
  const len = data.length;
  for (let i = 3; i < len; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}
