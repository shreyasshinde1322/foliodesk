import { describe, expect, it } from "vitest";
import {
  aspectRatioLabel,
  estimateUniqueColors,
  hashBytes,
  inspectImageBytes,
  optimizeImage,
  readJpegExif,
  recommendFormat,
} from "@/engines/image";
import type { OptimizationRequest } from "@/engines/image";
import { quantizeImage, hasAlphaChannel } from "@/engines/image/quantize";
import { createSharpCodec } from "./sharp-codec";
import {
  decodeRgba,
  encodeJpeg,
  encodePng,
  gradientImage,
  solidImage,
  transparentChecker,
} from "./fixtures";

const codec = createSharpCodec();

async function request(overrides: Partial<OptimizationRequest> = {}): Promise<OptimizationRequest> {
  const raw = gradientImage(800, 500);
  const decoded = await decodeRgba(await encodeJpeg(raw, 800, 500));
  return {
    bitmap: { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) },
    name: "photo.jpg",
    codec,
    format: "webp",
    quality: 85,
    background: "#ffffff",
    pngCompression: "balanced",
    pngMode: "lossless",
    ...overrides,
  };
}

describe("optimizeImage", () => {
  it("produces a compressed output", async () => {
    const result = await optimizeImage(await request());
    expect(result.image.sizeBytes).toBeGreaterThan(0);
    expect(result.image.format).toBe("webp");
  });

  it("auto-compares formats when none is chosen (opaque source)", async () => {
    const result = await optimizeImage(await request({ format: null }));
    expect(["webp", "jpg"]).toContain(result.image.format);
    expect(result.image.sizeBytes).toBeGreaterThan(0);
  });

  it("never suggests JPG when the source has transparency", async () => {
    const raw = transparentChecker(64, 64);
    const decoded = await decodeRgba(await encodePng(raw, 64, 64));
    const result = await optimizeImage({
      ...(await request()),
      format: null,
      bitmap: { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) },
      name: "icon.png",
    });
    expect(result.image.format).toBe("webp");
  });

  it("honours cancellation", async () => {
    await expect(
      optimizeImage(await request({ isCancelled: () => true })),
    ).rejects.toMatchObject({ code: "cancelled" });
  });
});

describe("PNG compression modes", () => {
  it("lossless mode produces a valid PNG", async () => {
    const raw = gradientImage(200, 200);
    const decoded = await decodeRgba(await encodePng(raw, 200, 200));
    const result = await optimizeImage(await request({
      format: "png",
      pngMode: "lossless",
      bitmap: { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) },
      name: "gradient.png",
    }));
    expect(result.image.format).toBe("png");
    expect(result.image.sizeBytes).toBeGreaterThan(0);
    expect(result.image.data[0]).toBe(0x89);
    expect(result.image.data[1]).toBe(0x50);
  });

  it("recommended mode produces a smaller or equal PNG than lossless", async () => {
    const raw = gradientImage(200, 200);
    const decoded = await decodeRgba(await encodePng(raw, 200, 200));
    const bitmap = { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };

    const lossless = await optimizeImage(await request({
      format: "png",
      pngMode: "lossless",
      bitmap,
      name: "gradient.png",
    }));
    const recommended = await optimizeImage(await request({
      format: "png",
      pngMode: "recommended",
      bitmap,
      name: "gradient.png",
    }));
    expect(recommended.image.sizeBytes).toBeLessThanOrEqual(lossless.image.sizeBytes);
  });

  it("maximum mode produces a smaller or equal PNG than recommended", async () => {
    const raw = gradientImage(200, 200);
    const decoded = await decodeRgba(await encodePng(raw, 200, 200));
    const bitmap = { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };

    const recommended = await optimizeImage(await request({
      format: "png",
      pngMode: "recommended",
      bitmap,
      name: "gradient.png",
    }));
    const maximum = await optimizeImage(await request({
      format: "png",
      pngMode: "maximum",
      bitmap,
      name: "gradient.png",
    }));
    expect(maximum.image.sizeBytes).toBeLessThanOrEqual(recommended.image.sizeBytes);
  });

  it("changing pngMode actually changes the output size", async () => {
    const raw = gradientImage(400, 400);
    const decoded = await decodeRgba(await encodePng(raw, 400, 400));
    const bitmap = { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };

    const lossless = await optimizeImage(await request({
      format: "png",
      pngMode: "lossless",
      bitmap,
      name: "test.png",
    }));
    const maximum = await optimizeImage(await request({
      format: "png",
      pngMode: "maximum",
      bitmap,
      name: "test.png",
    }));
    expect(lossless.image.sizeBytes).not.toBe(maximum.image.sizeBytes);
  });
});

describe("quantizer", () => {
  it("reduces unique colors in the palette", async () => {
    const raw = gradientImage(64, 64);
    const decoded = await decodeRgba(await encodePng(raw, 64, 64));
    const data = new Uint8ClampedArray(decoded.data);

    const quantized = quantizeImage(data, 64, 64, 16);
    expect(quantized.colorCount).toBeLessThanOrEqual(16);
    expect(quantized.colorCount).toBeGreaterThan(0);
    expect(quantized.indices.length).toBe(64 * 64);
    expect(quantized.palette.length).toBe(quantized.colorCount * 4);
  });

  it("produces a valid result for solid-color images", async () => {
    const solid = solidImage(32, 32, [255, 0, 128, 255]);
    const quantized = quantizeImage(new Uint8ClampedArray(solid), 32, 32, 256);
    expect(quantized.colorCount).toBe(1);
    expect(quantized.indices.length).toBe(32 * 32);
  });

  it("preserves alpha detection", () => {
    const opaque = solidImage(8, 8, [255, 0, 0, 255]);
    expect(hasAlphaChannel(new Uint8ClampedArray(opaque), 8, 8)).toBe(false);

    const transparent = transparentChecker(8, 8);
    expect(hasAlphaChannel(new Uint8ClampedArray(transparent), 8, 8)).toBe(true);
  });
});

describe("PNG lossless pixel identity", () => {
  it("lossless PNG output has valid PNG magic bytes", async () => {
    const raw = gradientImage(100, 100);
    const decoded = await decodeRgba(await encodePng(raw, 100, 100));
    const result = await optimizeImage(await request({
      format: "png",
      pngMode: "lossless",
      bitmap: { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) },
      name: "test.png",
    }));
    expect(result.image.data[0]).toBe(0x89);
    expect(result.image.data[1]).toBe(0x50);
    expect(result.image.data[2]).toBe(0x4e);
    expect(result.image.data[3]).toBe(0x47);
    expect(result.image.mimeType).toBe("image/png");
  });

  it("lossless PNG round-trips with identical pixel data", async () => {
    const raw = solidImage(16, 16, [200, 100, 50, 255]);
    const decoded = await decodeRgba(await encodePng(raw, 16, 16));
    const bitmap = { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };

    const result = await optimizeImage(await request({
      format: "png",
      pngMode: "lossless",
      bitmap,
      name: "solid.png",
    }));

    const roundTripped = await decodeRgba(result.image.data);
    expect(roundTripped.width).toBe(16);
    expect(roundTripped.height).toBe(16);
    expect(roundTripped.data.length).toBe(16 * 16 * 4);

    for (let i = 0; i < 16 * 16; i += 1) {
      const o = i * 4;
      expect(roundTripped.data[o]).toBe(bitmap.data[o]);
      expect(roundTripped.data[o + 1]).toBe(bitmap.data[o + 1]);
      expect(roundTripped.data[o + 2]).toBe(bitmap.data[o + 2]);
      expect(roundTripped.data[o + 3]).toBe(bitmap.data[o + 3]);
    }
  });

  it("lossless PNG round-trips gradient image pixel-perfectly", async () => {
    const raw = gradientImage(32, 32);
    const decoded = await decodeRgba(await encodePng(raw, 32, 32));
    const bitmap = { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };

    const result = await optimizeImage(await request({
      format: "png",
      pngMode: "lossless",
      bitmap,
      name: "gradient.png",
    }));

    const roundTripped = await decodeRgba(result.image.data);
    expect(roundTripped.width).toBe(32);
    expect(roundTripped.height).toBe(32);

    for (let i = 0; i < 32 * 32; i += 1) {
      const o = i * 4;
      expect(roundTripped.data[o]).toBe(bitmap.data[o]);
      expect(roundTripped.data[o + 1]).toBe(bitmap.data[o + 1]);
      expect(roundTripped.data[o + 2]).toBe(bitmap.data[o + 2]);
      expect(roundTripped.data[o + 3]).toBe(bitmap.data[o + 3]);
    }
  });

  it("palette PNG round-trips without corruption (correct color type)", async () => {
    const raw = solidImage(16, 16, [200, 100, 50, 255]);
    const decoded = await decodeRgba(await encodePng(raw, 16, 16));
    const bitmap = { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };

    const result = await optimizeImage(await request({
      format: "png",
      pngMode: "recommended",
      bitmap,
      name: "palette.png",
    }));

    const roundTripped = await decodeRgba(result.image.data);
    expect(roundTripped.width).toBe(16);
    expect(roundTripped.height).toBe(16);
    expect(roundTripped.data.length).toBe(16 * 16 * 4);

    for (let i = 0; i < 16 * 16; i += 1) {
      const o = i * 4;
      const dr = Math.abs(roundTripped.data[o] - bitmap.data[o]);
      const dg = Math.abs(roundTripped.data[o + 1] - bitmap.data[o + 1]);
      const db = Math.abs(roundTripped.data[o + 2] - bitmap.data[o + 2]);
      expect(dr).toBeLessThanOrEqual(2);
      expect(dg).toBeLessThanOrEqual(2);
      expect(db).toBeLessThanOrEqual(2);
    }
  });

  it("palette PNG with transparency round-trips correctly", async () => {
    const raw = transparentChecker(16, 16);
    const decoded = await decodeRgba(await encodePng(raw, 16, 16));
    const bitmap = { width: decoded.width, height: decoded.height, data: new Uint8ClampedArray(decoded.data) };

    const result = await optimizeImage(await request({
      format: "png",
      pngMode: "maximum",
      bitmap,
      name: "transparent.png",
    }));

    expect(result.image.data[0]).toBe(0x89);
    expect(result.image.data[1]).toBe(0x50);

    const roundTripped = await decodeRgba(result.image.data);
    expect(roundTripped.width).toBe(16);
    expect(roundTripped.height).toBe(16);
    expect(roundTripped.data.length).toBe(16 * 16 * 4);

    let nonZeroPixels = 0;
    for (let i = 0; i < 16 * 16; i += 1) {
      const o = i * 4;
      if (roundTripped.data[o] !== 0 || roundTripped.data[o + 1] !== 0 ||
          roundTripped.data[o + 2] !== 0 || roundTripped.data[o + 3] !== 0) {
        nonZeroPixels += 1;
      }
    }
    expect(nonZeroPixels).toBeGreaterThan(0);
  });

  it("quantizer does not mutate the input bitmap data", async () => {
    const raw = solidImage(32, 32, [100, 150, 200, 255]);
    const decoded = await decodeRgba(await encodePng(raw, 32, 32));
    const data = new Uint8ClampedArray(decoded.data);
    const copy = new Uint8ClampedArray(data);

    quantizeImage(data, 32, 32, 16);

    for (let i = 0; i < data.length; i += 1) {
      expect(data[i]).toBe(copy[i]);
    }
  });
});

describe("hashBytes", () => {
  it("is deterministic for identical bytes", async () => {
    const a = await hashBytes(new TextEncoder().encode("same content"));
    const b = await hashBytes(new TextEncoder().encode("same content"));
    expect(a).toBe(b);
  });

  it("differs for different bytes", async () => {
    const a = await hashBytes(new TextEncoder().encode("one"));
    const b = await hashBytes(new TextEncoder().encode("two"));
    expect(a).not.toBe(b);
  });
});

describe("EXIF and metadata inspection", () => {
  it("reads orientation 6 from a JPEG Exif segment", () => {
    const jpeg = buildJpegWithExifOrientation(6);
    const parsed = readJpegExif(jpeg);
    expect(parsed.orientation).toBe(6);
    expect(parsed.hasMetadata).toBe(true);

    const report = inspectImageBytes(jpeg, "jpg");
    expect(report.orientation).toBe(6);
    expect(report.orientationLabel).toContain("90");
    expect(report.metadataDetected).toBe(true);
  });

  it("defaults to orientation 1 when no Exif segment exists", () => {
    const plain = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    expect(readJpegExif(plain).orientation).toBe(1);
    expect(readJpegExif(plain).hasMetadata).toBe(false);
  });

  it("detects PNG text chunks", async () => {
    const plain = await encodePng(gradientImage(4, 4), 4, 4);
    expect(inspectImageBytes(plain, "png").metadataDetected).toBe(false);

    const withText = await pngWithTextChunk(plain);
    expect(inspectImageBytes(withText, "png").metadataDetected).toBe(true);
  });
});

describe("analysis helpers", () => {
  it("recommends transparency-safe formats when alpha is present", () => {
    expect(recommendFormat("jpg", true, 100).primary).toBe("WebP or PNG");
  });

  it("recommends PNG/WebP for simple graphics", () => {
    expect(recommendFormat("png", false, 40).primary).toBe("PNG or WebP");
  });

  it("recommends WebP or JPG for photos", () => {
    expect(recommendFormat("jpg", false, 5000).primary).toBe("WebP or JPG");
  });

  it("estimates unique colors", async () => {
    const solid = solidImage(16, 16, [10, 20, 30, 255]);
    expect(estimateUniqueColors({ width: 16, height: 16, data: new Uint8ClampedArray(solid) })).toBe(1);

    const gradient = gradientImage(32, 32);
    expect(
      estimateUniqueColors({ width: 32, height: 32, data: new Uint8ClampedArray(gradient) }),
    ).toBeGreaterThan(10);
  });

  it("renders aspect ratios", () => {
    expect(aspectRatioLabel(1920, 1080)).toBe("16:9");
    expect(aspectRatioLabel(1, 1)).toBe("1:1");
    expect(aspectRatioLabel(500, 500)).toBe("1:1");
  });
});

function buildJpegWithExifOrientation(orientation: number): Uint8Array {
  const tiff = new Uint8Array(26);
  tiff.set([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00], 0);
  tiff.set([0x01, 0x00], 8);
  tiff.set([0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00], 10);
  tiff.set([orientation, 0x00, 0x00, 0x00], 18);
  tiff.set([0x00, 0x00, 0x00, 0x00], 22);

  const app1 = new Uint8Array(6 + tiff.length);
  app1.set([0x45, 0x78, 0x69, 0x66, 0x00, 0x00], 0);
  app1.set(tiff, 6);

  const length = app1.length;
  const out = new Uint8Array(2 + 2 + app1.length + 2);
  out[0] = 0xff;
  out[1] = 0xd8;
  out[2] = 0xff;
  out[3] = 0xe1;
  out[4] = length >> 8;
  out[5] = length & 0xff;
  out.set(app1, 6);
  out[6 + app1.length] = 0xff;
  out[6 + app1.length + 1] = 0xd9;
  return out;
}

async function pngWithTextChunk(base: Uint8Array): Promise<Uint8Array> {
  let offset = 8;
  while (offset + 8 <= base.length) {
    const type = String.fromCharCode(base[offset + 4], base[offset + 5], base[offset + 6], base[offset + 7]);
    const len = (base[offset] << 24) | (base[offset + 1] << 16) | (base[offset + 2] << 8) | base[offset + 3];
    if (type === "IEND") break;
    offset += 12 + len;
  }

  const text = new Uint8Array([
    0x74, 0x45, 0x58, 0x74,
    0x53, 0x6f, 0x66, 0x74, 0x77, 0x61, 0x72, 0x65, 0x00, 0x54, 0x65, 0x73, 0x74,
  ]);
  const chunk = new Uint8Array(4 + text.length + 4);
  chunk[0] = text.length >>> 24;
  chunk[1] = (text.length >>> 16) & 0xff;
  chunk[2] = (text.length >>> 8) & 0xff;
  chunk[3] = text.length & 0xff;
  chunk.set(text, 4);

  const out = new Uint8Array(base.length + chunk.length);
  out.set(base.subarray(0, offset), 0);
  out.set(chunk, offset);
  out.set(base.subarray(offset), offset + chunk.length);
  return out;
}
