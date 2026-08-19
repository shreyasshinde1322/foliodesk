import { decodeBmp } from "./decoders/bmp";
import { decodeHeic } from "./decoders/heic";
import { decodeIcoBitmap, extractPng, icoContainerError, pickBestIcoEntry } from "./decoders/ico";
import { decodePsd } from "./decoders/psd";
import { renderSvgIntrinsic, sanitizeSvg, svgToText } from "./decoders/svg";
import { encodePng } from "./encoders/png";
import { encodeWasmJxl } from "./encoders/jxl";
import { encodeWasmMozJpeg } from "./encoders/mozjpeg";
import { encodeWasmHeic } from "./encoders/heic";
import { encodeGif } from "./encoders/gif";
import { canvasToBlob, createCanvas, get2dContext } from "./canvas";
import { IMAGE_FORMAT_META } from "./formats";
import { hasAlphaChannel, quantizeImage, buildExactPalette } from "./quantize";
import type {
  DecodedBitmap,
  EncodeFormat,
  EncodeOptions,
  ImageCodec,
  ImageFormat,
  PngMode,
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
    case "jxl":
      return decodeJxl(data);
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

async function decodeJxl(data: Uint8Array): Promise<DecodedBitmap> {
  // Try native browser support first (Safari 17+)
  try {
    return await decodeNative(data, "jxl");
  } catch {
    // Fall through to WASM decoder
  }

  // WASM fallback via @jsquash/jxl
  try {
    const wasm = await import("@jsquash/jxl/decode.js");
    await wasm.init();
    const imageData = await wasm.default(data.slice().buffer as ArrayBuffer);
    return {
      width: imageData.width,
      height: imageData.height,
      data: new Uint8ClampedArray(imageData.data),
    };
  } catch {
    throw new ImageProcessingError(
      "JPEG XL images could not be decoded. Your browser does not support JXL decoding.",
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
    return await encodePngMode(bitmap, encodeOptions?.pngCompression ?? "balanced", encodeOptions?.pngMode ?? "lossless");
  }

  if (format === "jxl") {
    return encodeWasmJxl(bitmap, quality);
  }

  if (format === "heic") {
    return encodeWasmHeic(bitmap);
  }

  if (format === "gif") {
    return encodeGif(bitmap, quality);
  }

  const mimeType = IMAGE_FORMAT_META[format].mime;
  try {
    const canvas = createCanvas(bitmap.width, bitmap.height);
    const context = get2dContext(canvas);
    context.clearRect(0, 0, bitmap.width, bitmap.height);
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
    if (format === "webp") return encodeWasmWebp(bitmap, quality);
    if (format === "avif") return encodeWasmAvif(bitmap, quality);
    if (format === "jpg") return encodeWasmMozJpeg(bitmap, quality);
    const label = (IMAGE_FORMAT_META as Record<string, { label: string }>)[format]?.label ?? String(format).toUpperCase();
    throw new ImageProcessingError(
      `This browser could not encode the image as ${label}.`,
      "encode-failed",
    );
  }
}

async function encodePngMode(
  bitmap: DecodedBitmap,
  compression: EncodeOptions["pngCompression"],
  pngMode: PngMode,
): Promise<{ data: Uint8Array; mimeType: string }> {
  if (pngMode === "lossless") {
    const data = await encodeWasmPng(bitmap, compression);
    return { data, mimeType: "image/png" };
  }

  const hasAlpha = hasAlphaChannel(bitmap.data, bitmap.width, bitmap.height);

  if (pngMode === "recommended") {
    const exact = buildExactPalette(bitmap.data, bitmap.width, bitmap.height);
    if (exact) {
      const data = await encodeWasmPng(bitmap, compression, exact);
      return { data, mimeType: "image/png" };
    }
    const data = await encodeWasmPng(bitmap, compression);
    return { data, mimeType: "image/png" };
  }

  const maxColors = hasAlpha ? 128 : 64;
  const quantized = quantizeImage(bitmap.data, bitmap.width, bitmap.height, maxColors);
  if (quantized.colorCount <= 256) {
    const data = await encodeWasmPng(bitmap, compression, { ...quantized, hasAlpha });
    return { data, mimeType: "image/png" };
  }
  const data = await encodeWasmPng(bitmap, compression);
  return { data, mimeType: "image/png" };
}

async function encodeWasmPng(
  bitmap: DecodedBitmap,
  compression: EncodeOptions["pngCompression"],
  paletteInput?: import("./encoders/png").PaletteInput,
): Promise<Uint8Array> {
  try {
    const wasm = await import("@jsquash/png/encode.js");
    await wasm.init();
    const imageData = new ImageData(
      new Uint8ClampedArray(bitmap.data),
      bitmap.width,
      bitmap.height,
    );
    const buffer = await wasm.default(imageData, { bitDepth: 8 });
    return new Uint8Array(buffer);
  } catch {
    return encodePng(bitmap, compression, paletteInput);
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
