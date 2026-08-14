import { IMAGE_FORMAT_META } from "./formats";
import type { DecodedBitmap, EncodeFormat, ImageCodec, ImageFormat } from "./types";
import { ImageProcessingError } from "./types";

/**
 * Browser implementation of `ImageCodec` backed by `createImageBitmap`,
 * `OffscreenCanvas` (with an HTMLCanvasElement fallback), and `toBlob` /
 * `convertToBlob`. All work happens on-device; nothing is uploaded.
 *
 * No DOM is touched at module scope, so this file is safe to import during
 * server rendering; the DOM is only accessed when a conversion runs.
 */
export function createBrowserCodec(): ImageCodec {
  return { decode, scale, encode };
}

async function decode(data: Uint8Array, sourceFormat: ImageFormat): Promise<DecodedBitmap> {
  const mime = IMAGE_FORMAT_META[sourceFormat].mime;
  const blob = new Blob([new Uint8Array(data)], { type: mime });
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      try {
        const canvas = createCanvas(bitmap.width, bitmap.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas 2D context unavailable.");
        context.drawImage(bitmap, 0, 0);
        const imageData = context.getImageData(0, 0, bitmap.width, bitmap.height);
        return { width: bitmap.width, height: bitmap.height, data: imageData.data };
      } finally {
        if (typeof bitmap.close === "function") bitmap.close();
      }
    }
    throw new Error("createImageBitmap is unavailable.");
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError(
      "The image could not be decoded by this browser.",
      "decode-failed",
    );
  }
}

async function scale(bitmap: DecodedBitmap, width: number, height: number): Promise<DecodedBitmap> {
  try {
    const source = createCanvas(bitmap.width, bitmap.height);
    const sourceContext = source.getContext("2d");
    if (!sourceContext) throw new Error("Canvas 2D context unavailable.");
    sourceContext.putImageData(
      new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height),
      0,
      0,
    );

    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable.");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(source, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    return { width, height, data: imageData.data };
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError("The image could not be resized.", "encode-failed");
  }
}

async function encode(
  bitmap: DecodedBitmap,
  format: EncodeFormat,
  quality: number,
): Promise<{ data: Uint8Array; mimeType: string }> {
  const mimeType = IMAGE_FORMAT_META[format].mime;
  try {
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable.");
    context.putImageData(
      new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height),
      0,
      0,
    );
    const blob = await canvasToBlob(canvas, mimeType, quality / 100);
    const buffer = await blob.arrayBuffer();
    return { data: new Uint8Array(buffer), mimeType: blob.type || mimeType };
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    throw new ImageProcessingError(
      `This browser could not encode the image as ${IMAGE_FORMAT_META[format].label}.`,
      "encode-failed",
    );
  }
}

type CanvasLike = HTMLCanvasElement | OffscreenCanvas;

function createCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("No canvas API available.");
}

async function canvasToBlob(
  canvas: CanvasLike,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: mimeType, quality });
  }
  const htmlCanvas = canvas as HTMLCanvasElement;
  return new Promise<Blob>((resolve, reject) => {
    htmlCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas produced no output."));
      },
      mimeType,
      quality,
    );
  });
}
