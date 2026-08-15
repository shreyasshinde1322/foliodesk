import { decodeBmp } from "./decoders/bmp";
import { decodeHeic } from "./decoders/heic";
import { decodeIcoBitmap, extractPng, icoContainerError, pickBestIcoEntry } from "./decoders/ico";
import { decodePsd } from "./decoders/psd";
import { renderSvgIntrinsic, sanitizeSvg, svgToText } from "./decoders/svg";
import { encodePng } from "./encoders/png";
import { canvasToBlob, createCanvas, get2dContext } from "./canvas";
import { IMAGE_FORMAT_META } from "./formats";
import type {
  DecodedBitmap,
  EncodeFormat,
  EncodeOptions,
  ImageCodec,
  ImageFormat,
} from "./types";
import { ImageProcessingError } from "./types";

/**
 * Browser implementation of `ImageCodec`.
 *
 * - `decode` dispatches per source format: native `createImageBitmap` for the
 *   common raster formats, pure decoders for BMP/ICO, `heic2any` for HEIC,
 *   `@webtoon/psd` (worker) for PSD, and a sanitizing SVG renderer.
 * - `encode` uses the built-in fflate PNG encoder (exact compression control),
 *   canvas for JPEG/WebP/AVIF, and lazy WASM fallbacks (@jsquash) for WebP and
 *   AVIF where the browser lacks native support.
 *
 * No DOM is touched at module scope, so this file is safe to import during
 * server rendering; the DOM is only accessed when a conversion runs.
 */
export function createBrowserCodec(): ImageCodec {
  return { decode, scale, encode };
}

async function decode(data: Uint8Array, sourceFormat: ImageFormat): Promise<DecodedBitmap> {
  switch (sourceFormat) {
    case "bmp":
      return decodeBmp(data);
    case "ico":
      return decodeIco(data);
    case "psd":
      return decodePsd(copyBuffer(data));
    case "heic":
    case "heif":
      return decodeHeic(data);
    case "svg": {
      const svg = sanitizeSvg(svgToText(data));
      return renderSvgIntrinsic(svg);
    }
    default:
      return decodeNative(data, sourceFormat);
  }
}

async function decodeIco(data: Uint8Array): Promise<DecodedBitmap> {
  const entry = pickBestIcoEntry(data);
  if (entry) {
    if (entry.isPng) {
      const png = extractPng(data, entry);
      if (png) {
        try {
          return await decodeNative(png, "png");
        } catch {
          // Fall through to the container decoder below.
        }
      }
    } else {
      const bitmap = decodeIcoBitmap(data, entry);
      if (bitmap) return bitmap;
    }
  }
  try {
    return await decodeNative(data, "ico");
  } catch {
    throw icoContainerError();
  }
}

async function decodeNative(data: Uint8Array, sourceFormat: ImageFormat): Promise<DecodedBitmap> {
  const mime = IMAGE_FORMAT_META[sourceFormat].mime;
  const blob = new Blob([new Uint8Array(data)], { type: mime });
  try {
    if (typeof createImageBitmap === "function") {
      const bitmap = await createImageBitmap(blob);
      try {
        const context = get2dContext(createCanvas(bitmap.width, bitmap.height));
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
    const sourceContext = get2dContext(createCanvas(bitmap.width, bitmap.height));
    sourceContext.putImageData(
      new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height),
      0,
      0,
    );

    const context = get2dContext(createCanvas(width, height));
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(sourceContext.canvas as CanvasImageSource, 0, 0, width, height);
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
  encodeOptions?: EncodeOptions,
): Promise<{ data: Uint8Array; mimeType: string }> {
  if (format === "png") {
    const data = encodePng(bitmap, encodeOptions?.pngCompression ?? "balanced");
    return { data, mimeType: "image/png" };
  }

  const mimeType = IMAGE_FORMAT_META[format].mime;
  try {
    const context = get2dContext(createCanvas(bitmap.width, bitmap.height));
    context.putImageData(
      new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height),
      0,
      0,
    );
    const blob = await canvasToBlob(context.canvas as CanvasLike, mimeType, quality / 100);
    const buffer = await blob.arrayBuffer();
    return { data: new Uint8Array(buffer), mimeType: blob.type || mimeType };
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error;
    if (format === "webp") return encodeWasmWebp(bitmap, quality);
    if (format === "avif") return encodeWasmAvif(bitmap, quality);
    throw new ImageProcessingError(
      `This browser could not encode the image as ${IMAGE_FORMAT_META[format].label}.`,
      "encode-failed",
    );
  }
}

async function encodeWasmWebp(
  bitmap: DecodedBitmap,
  quality = 80,
): Promise<{ data: Uint8Array; mimeType: string }> {
  try {
    const wasm = await import("@jsquash/webp/encode.js");
    // @jsquash keeps a module-level encoder singleton that reuses a stale
    // encoder config after the first call, producing wrong output for every
    // later encode (e.g. "compressing" an already-compressed image does
    // nothing). A fresh module instance per call restores correct behavior.
    await wasm.init();
    const buffer = await wasm.default(toImageData(bitmap), {
      quality,
      lossless: 0,
    });
    return { data: new Uint8Array(buffer), mimeType: "image/webp" };
  } catch {
    throw new ImageProcessingError("This browser could not encode WebP.", "encode-failed");
  }
}

async function encodeWasmAvif(
  bitmap: DecodedBitmap,
  quality: number,
): Promise<{ data: Uint8Array; mimeType: string }> {
  try {
    const wasm = await import("@jsquash/avif/encode.js");
    // See the WebP note above — same singleton-staleness bug in @jsquash/avif.
    await wasm.init();
    const buffer = await wasm.default(toImageData(bitmap), { quality, lossless: false });
    return { data: new Uint8Array(buffer), mimeType: "image/avif" };
  } catch {
    throw new ImageProcessingError("This browser could not encode AVIF.", "encode-failed");
  }
}

function toImageData(bitmap: DecodedBitmap): ImageData {
  return new ImageData(new Uint8ClampedArray(bitmap.data), bitmap.width, bitmap.height);
}

function copyBuffer(data: Uint8Array): ArrayBuffer {
  return data.slice().buffer;
}

type CanvasLike = HTMLCanvasElement | OffscreenCanvas;
