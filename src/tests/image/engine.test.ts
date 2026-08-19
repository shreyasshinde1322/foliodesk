import { describe, expect, it } from "vitest";
import { analyzeImage, convertBatch, convertImage, ImageProcessingError } from "@/engines/image";
import type { ConversionOptions, EncodeFormat, ImageFormat } from "@/engines/image";
import { createSharpCodec } from "./sharp-codec";
import {
  decodeRgba,
  encodeJpeg,
  encodePng,
  encodeWebp,
  gradientImage,
  solidImage,
  toBlob,
  transparentChecker,
} from "./fixtures";

const codec = createSharpCodec();

const baseOptions: ConversionOptions = {
  outputFormat: "webp",
  quality: 85,
  background: "#ffffff",
  resizeMode: "keep",
  maintainAspectRatio: true,
  allowUpscale: false,
  pngCompression: "balanced",
  pngMode: "lossless",
};

function magic(bytes: Uint8Array): string {
  const decoder = new TextDecoder();
  if (bytes.length >= 12 && decoder.decode(bytes.subarray(0, 4)) === "RIFF") {
    return decoder.decode(bytes.subarray(8, 12)) === "WEBP" ? "webp" : "riff";
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return "jpeg";
  if (bytes.length >= 4 && decoder.decode(bytes.subarray(4, 8)) === "ftyp") return "avif";
  return "unknown";
}

async function sourceOf(format: ImageFormat, width = 8, height = 8): Promise<{ bytes: Uint8Array; mime: string }> {
  const raw = gradientImage(width, height);
  if (format === "png") return { bytes: await encodePng(raw, width, height), mime: "image/png" };
  if (format === "jpg") return { bytes: await encodeJpeg(raw, width, height), mime: "image/jpeg" };
  return { bytes: await encodeWebp(raw, width, height), mime: "image/webp" };
}

describe("image converter engine (end-to-end with real pixels)", () => {
  const pairs: Array<[ImageFormat, EncodeFormat]> = [
    ["jpg", "png"],
    ["png", "jpg"],
    ["jpg", "webp"],
    ["png", "webp"],
    ["webp", "jpg"],
    ["webp", "png"],
  ];

  it.each(pairs)("converts %s → %s and produces a valid file", async (input, output) => {
    const { bytes, mime } = await sourceOf(input);
    const result = await convertImage({
      blob: toBlob(bytes, mime),
      name: `photo.${input === "jpg" ? "jpeg" : input}`,
      options: { ...baseOptions, outputFormat: output },
      codec,
    });
    expect(result.format).toBe(output);
    expect(result.width).toBe(8);
    expect(result.height).toBe(8);
    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.outputName).toBe(`photo.${output}`);
    expect(result.mimeType).toBe(`image/${output === "jpg" ? "jpeg" : output}`);
    expect(magic(result.data)).toBe(output === "jpg" ? "jpeg" : output);
  });

  it("decodes and reports source metadata", async () => {
    const { bytes, mime } = await sourceOf("png", 16, 9);
    const analyzed = await analyzeImage(toBlob(bytes, mime), "wide.png", codec);
    expect(analyzed.sourceFormat).toBe("png");
    expect(analyzed.bitmap.width).toBe(16);
    expect(analyzed.bitmap.height).toBe(9);
  });

  it("rejects an invalid image", async () => {
    await expect(
      convertImage({
        blob: toBlob(new TextEncoder().encode("definitely not an image"), "text/plain"),
        name: "fake.png",
        options: { outputFormat: "png" },
        codec,
      }),
    ).rejects.toMatchObject({ code: "unsupported-format" });
  });

  it("rejects an empty file", async () => {
    await expect(
      convertImage({ blob: new Blob([]), name: "empty.png", options: { outputFormat: "png" }, codec }),
    ).rejects.toBeInstanceOf(ImageProcessingError);
  });

  it("handles a 1x1 image", async () => {
    const png = await encodePng(solidImage(1, 1, [255, 0, 0, 255]), 1, 1);
    const result = await convertImage({
      blob: toBlob(png, "image/png"),
      name: "pixel.png",
      options: { outputFormat: "jpg" },
      codec,
    });
    expect(result.width).toBe(1);
    expect(result.height).toBe(1);
    expect(magic(result.data)).toBe("jpeg");
  });

  it("handles a large image without losing dimensions", async () => {
    const png = await encodePng(gradientImage(1600, 900), 1600, 900);
    const result = await convertImage({
      blob: toBlob(png, "image/png"),
      name: "large.png",
      options: { outputFormat: "webp" },
      codec,
    });
    expect(result.width).toBe(1600);
    expect(result.height).toBe(900);
  });

  it("flattens transparency to the chosen background when converting PNG → JPG", async () => {
    const raw = solidImage(4, 4, [0, 0, 0, 0]);
    const png = await encodePng(raw, 4, 4);
    const result = await convertImage({
      blob: toBlob(png, "image/png"),
      name: "alpha.png",
      options: { ...baseOptions, outputFormat: "jpg", background: "#ff0000" },
      codec,
    });
    const decoded = await decodeRgba(result.data);
    expect(decoded.width).toBe(4);
    const pixel = decoded.data.subarray(0, 3);
    // Uniform red survives lossy JPEG well; allow small JPEG tolerance.
    expect(pixel[0]).toBeGreaterThan(240);
    expect(pixel[1]).toBeLessThan(25);
    expect(pixel[2]).toBeLessThan(25);
  });

  it("preserves transparency when converting PNG → WebP", async () => {
    const png = await encodePng(transparentChecker(4, 4), 4, 4);
    const result = await convertImage({
      blob: toBlob(png, "image/png"),
      name: "alpha.png",
      options: { ...baseOptions, outputFormat: "webp" },
      codec,
    });
    const decoded = await decodeRgba(result.data);
    let hasOpaque = false;
    let hasTransparent = false;
    for (let i = 3; i < decoded.data.length; i += 4) {
      if (decoded.data[i] === 255) hasOpaque = true;
      if (decoded.data[i] === 0) hasTransparent = true;
    }
    expect(hasOpaque).toBe(true);
    expect(hasTransparent).toBe(true);
  });

  it("outputs opaque pixels for JPG → PNG", async () => {
    const { bytes, mime } = await sourceOf("jpg");
    const result = await convertImage({
      blob: toBlob(bytes, mime),
      name: "photo.jpg",
      options: { outputFormat: "png" },
      codec,
    });
    const decoded = await decodeRgba(result.data);
    for (let i = 3; i < decoded.data.length; i += 4) {
      expect(decoded.data[i]).toBe(255);
    }
  });

  it("resizes and converts together", async () => {
    const png = await encodePng(gradientImage(800, 400), 800, 400);
    const result = await convertImage({
      blob: toBlob(png, "image/png"),
      name: "wide.png",
      options: { ...baseOptions, outputFormat: "webp", resizeMode: "max-width", width: 400 },
      codec,
    });
    expect(result.width).toBe(400);
    expect(result.height).toBe(200);
    expect(magic(result.data)).toBe("webp");
  });

  it("respects exact sizing with aspect ratio", async () => {
    const png = await encodePng(gradientImage(800, 400), 800, 400);
    const result = await convertImage({
      blob: toBlob(png, "image/png"),
      name: "wide.png",
      options: { ...baseOptions, outputFormat: "png", resizeMode: "exact", width: 400, height: 400 },
      codec,
    });
    expect(result.width).toBe(400);
    expect(result.height).toBe(200);
  });

  it("changes output size when quality changes", async () => {
    const png = await encodePng(gradientImage(200, 200), 200, 200);
    const low = await convertImage({
      blob: toBlob(png, "image/png"),
      name: "grad.png",
      options: { ...baseOptions, outputFormat: "jpg", quality: 10 },
      codec,
    });
    const high = await convertImage({
      blob: toBlob(png, "image/png"),
      name: "grad.png",
      options: { ...baseOptions, outputFormat: "jpg", quality: 100 },
      codec,
    });
    expect(low.sizeBytes).toBeLessThan(high.sizeBytes);
  });

  it("builds safe output names for unusual and Unicode inputs", async () => {
    const { bytes, mime } = await sourceOf("png");
    const odd = await convertImage({
      blob: toBlob(bytes, mime),
      name: "My Holiday Photo (2).PNG",
      options: { outputFormat: "webp" },
      codec,
    });
    expect(odd.outputName).toBe("My Holiday Photo (2).webp");

    const unicode = await convertImage({
      blob: toBlob(bytes, mime),
      name: "éclair 画像.png",
      options: { outputFormat: "png" },
      codec,
    });
    expect(unicode.outputName).toBe("éclair 画像.png");

    const hostile = await convertImage({
      blob: toBlob(bytes, mime),
      name: "../../etc/passwd.png",
      options: { outputFormat: "jpg" },
      codec,
    });
    expect(hostile.outputName).not.toContain("/");
    expect(hostile.outputName).not.toContain("..");
  });

  it("converts a batch of multiple images", async () => {
    const first = await encodePng(solidImage(4, 4, [10, 20, 30, 255]), 4, 4);
    const second = await encodeWebp(gradientImage(6, 6), 6, 6);
    const progress: Array<{ done: number; total: number; id: string }> = [];
    const results = await convertBatch(
      [
        { id: "a", blob: toBlob(first, "image/png"), name: "one.png" },
        { id: "b", blob: toBlob(second, "image/webp"), name: "two.webp" },
        { id: "c", blob: toBlob(first, "image/png"), name: "three.png" },
      ],
      { outputFormat: "jpg" },
      codec,
      (done, total, id) => progress.push({ done, total, id }),
    );
    expect(results.size).toBe(3);
    expect(results.get("a")?.format).toBe("jpg");
    expect(results.get("b")?.format).toBe("jpg");
    expect(results.get("c")?.format).toBe("jpg");
    expect(progress.length).toBe(3);
    expect(progress[2]).toMatchObject({ done: 3, total: 3 });
  });
});
