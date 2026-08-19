import sharp from "sharp";
import type { DecodedBitmap, EncodeFormat, EncodeOptions, ImageCodec } from "@/engines/image";

/**
 * Node implementation of `ImageCodec` used only by tests. It mirrors what the
 * browser codec does (decode → raw RGBA, high-quality resize, re-encode) so
 * the engine pipeline is exercised with real pixels in CI.
 */
export function createSharpCodec(): ImageCodec {
  return { decode, scale, encode };
}

async function decode(data: Uint8Array): Promise<DecodedBitmap> {
  const result = await sharp(Buffer.from(data))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    width: result.info.width,
    height: result.info.height,
    data: toClamped(result.data),
  };
}

async function scale(bitmap: DecodedBitmap, width: number, height: number): Promise<DecodedBitmap> {
  const result = await sharp(Buffer.from(bitmap.data), {
    raw: { width: bitmap.width, height: bitmap.height, channels: 4 },
  })
    .resize(width, height, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    width: result.info.width,
    height: result.info.height,
    data: toClamped(result.data),
  };
}

async function encode(
  bitmap: DecodedBitmap,
  format: EncodeFormat,
  quality: number,
  encodeOptions?: EncodeOptions,
): Promise<{ data: Uint8Array; mimeType: string }> {
  const pipeline = sharp(Buffer.from(bitmap.data), {
    raw: { width: bitmap.width, height: bitmap.height, channels: 4 },
  });
  let buffer: Buffer;
  let mimeType = "image/jpeg";
  if (format === "png") {
    const pngMode = encodeOptions?.pngMode ?? "lossless";
    const pngOpts: Record<string, unknown> = { compressionLevel: pngLevel(encodeOptions?.pngCompression) };
    if (pngMode === "recommended") {
      pngOpts.palette = true;
      pngOpts.colours = 256;
      pngOpts.dither = 0.8;
    } else if (pngMode === "maximum") {
      pngOpts.palette = true;
      pngOpts.colours = 64;
      pngOpts.dither = 0.6;
    }
    buffer = await pipeline.png(pngOpts).toBuffer();
    mimeType = "image/png";
  } else if (format === "webp") {
    buffer = await pipeline.webp({ quality }).toBuffer();
    mimeType = "image/webp";
  } else if (format === "avif") {
    buffer = await pipeline.avif({ quality }).toBuffer();
    mimeType = "image/avif";
  } else {
    buffer = await pipeline.jpeg({ quality }).toBuffer();
    mimeType = "image/jpeg";
  }
  return {
    data: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    mimeType,
  };
}

function pngLevel(compression: EncodeOptions["pngCompression"]): number {
  if (compression === "fast") return 1;
  if (compression === "maximum") return 9;
  return 6;
}

function toClamped(buffer: Buffer): Uint8ClampedArray {
  return new Uint8ClampedArray(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
