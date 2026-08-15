import { describe, expect, it } from "vitest";
import {
  decodeBmp,
  decodeIcoBitmap,
  detectGifAnimation,
  pickBestIcoEntry,
  sanitizeSvg,
} from "@/engines/image";
import type { DecodedBitmap } from "@/engines/image";

function writeU16(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 255;
  target[offset + 1] = (value >> 8) & 255;
}

function writeU32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 255;
  target[offset + 1] = (value >> 8) & 255;
  target[offset + 2] = (value >> 16) & 255;
  target[offset + 3] = (value >>> 24) & 255;
}

function writeI32(target: Uint8Array, offset: number, value: number): void {
  writeU32(target, offset, value < 0 ? value + 0x100000000 : value);
}

interface BmpPainter {
  (x: number, y: number): [number, number, number, number];
}

function buildBmp(width: number, height: number, bpp: 24 | 32, painter: BmpPainter, topDown = false): Uint8Array {
  const bytesPerPixel = bpp / 8;
  const paddedRow = Math.ceil((width * bytesPerPixel) / 4) * 4;
  const offset = 54;
  const out = new Uint8Array(offset + paddedRow * height);
  out[0] = 0x42;
  out[1] = 0x4d;
  writeU32(out, 2, out.length);
  writeU32(out, 10, offset);
  writeU32(out, 14, 40);
  writeI32(out, 18, width);
  writeI32(out, 22, topDown ? -height : height);
  writeU16(out, 26, 1);
  writeU16(out, 28, bpp);
  writeU32(out, 30, 0);
  for (let y = 0; y < height; y += 1) {
    const srcRow = topDown ? y : height - 1 - y;
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = painter(x, y);
      const si = offset + srcRow * paddedRow + x * bytesPerPixel;
      out[si] = b;
      out[si + 1] = g;
      out[si + 2] = r;
      if (bpp === 32) out[si + 3] = a;
    }
  }
  return out;
}

function buildGif(imageCount: number): Uint8Array {
  const out: number[] = [];
  out.push(0x47, 0x49, 0x46, 0x38, 0x39, 0x61);
  out.push(1, 0, 1, 0, 0, 0, 0);
  for (let i = 0; i < imageCount; i += 1) {
    out.push(0x2c);
    out.push(...new Array(9).fill(0));
    out.push(0x00, 0x00);
  }
  out.push(0x3b);
  return new Uint8Array(out);
}

function pixelAt(bitmap: DecodedBitmap, x: number, y: number): [number, number, number, number] {
  const index = (y * bitmap.width + x) * 4;
  return [bitmap.data[index], bitmap.data[index + 1], bitmap.data[index + 2], bitmap.data[index + 3]];
}

describe("BMP decoder", () => {
  it("decodes a 24-bit BMP with bottom-up row order", () => {
    const bytes = buildBmp(2, 2, 24, (x, y) => [x * 120, y * 120, 200, 255]);
    const bitmap = decodeBmp(bytes);
    expect(bitmap.width).toBe(2);
    expect(bitmap.height).toBe(2);
    expect(pixelAt(bitmap, 0, 0)).toEqual([0, 0, 200, 255]);
    expect(pixelAt(bitmap, 1, 1)).toEqual([120, 120, 200, 255]);
  });

  it("decodes a 32-bit BMP and keeps its alpha channel", () => {
    const bytes = buildBmp(2, 2, 32, (x) => [10, 20, 30, x === 1 ? 128 : 255]);
    const bitmap = decodeBmp(bytes);
    expect(pixelAt(bitmap, 0, 0)[3]).toBe(255);
    expect(pixelAt(bitmap, 1, 0)[3]).toBe(128);
  });

  it("treats 32-bit BMPs with all-zero alpha as opaque", () => {
    const bytes = buildBmp(2, 2, 32, () => [10, 20, 30, 0]);
    const bitmap = decodeBmp(bytes);
    expect(pixelAt(bitmap, 0, 0)[3]).toBe(255);
    expect(pixelAt(bitmap, 1, 1)[3]).toBe(255);
  });

  it("supports top-down BMPs", () => {
    const bytes = buildBmp(2, 2, 24, (x, y) => [x * 120, y * 120, 200, 255], true);
    const bitmap = decodeBmp(bytes);
    expect(pixelAt(bitmap, 0, 0)).toEqual([0, 0, 200, 255]);
  });

  it("rejects compressed or exotic BMPs with a clear error", () => {
    const bytes = buildBmp(2, 2, 24, () => [1, 2, 3, 255]);
    writeU32(bytes, 30, 1); // BI_RLE8
    expect(() => decodeBmp(bytes)).toThrow(/Compressed BMP/);
  });
});

describe("ICO decoder", () => {
  it("picks the largest entry and decodes 32-bit pixels", () => {
    // Build a container with two 32-bit entries: 4x4 and 8x8.
    const dibSize = 40;
    const xorRow4 = Math.ceil((4 * 4) / 4) * 4;
    const andRow4 = Math.ceil(4 / 32) * 4;
    const xorRow8 = Math.ceil((8 * 4) / 4) * 4;
    const andRow8 = Math.ceil(8 / 32) * 4;
    const dib4 = dibSize + xorRow4 * 4 + andRow4 * 4;
    const dib8 = dibSize + xorRow8 * 8 + andRow8 * 8;
    const out = new Uint8Array(6 + 16 * 2 + dib4 + dib8);
    writeU16(out, 0, 0);
    writeU16(out, 2, 1);
    writeU16(out, 4, 2);
    const entry0 = 6;
    out[entry0] = 4;
    out[entry0 + 1] = 4;
    writeU16(out, entry0 + 4, 1);
    writeU16(out, entry0 + 6, 32);
    writeU32(out, entry0 + 8, dib4);
    writeU32(out, entry0 + 12, 6 + 32);
    const entry1 = 6 + 16;
    out[entry1] = 8;
    out[entry1 + 1] = 8;
    writeU16(out, entry1 + 4, 1);
    writeU16(out, entry1 + 6, 32);
    writeU32(out, entry1 + 8, dib8);
    writeU32(out, entry1 + 12, 6 + 32 + dib4);
    const dib0 = 6 + 32;
    writeU32(out, dib0, 40);
    writeI32(out, dib0 + 4, 4);
    writeI32(out, dib0 + 8, 8);
    writeU16(out, dib0 + 12, 1);
    writeU16(out, dib0 + 14, 32);
    const dib1 = 6 + 32 + dib4;
    writeU32(out, dib1, 40);
    writeI32(out, dib1 + 4, 8);
    writeI32(out, dib1 + 8, 16);
    writeU16(out, dib1 + 12, 1);
    writeU16(out, dib1 + 14, 32);
    // 8x8 pixels: unique blue value per column.
    for (let y = 0; y < 8; y += 1) {
      const row = 7 - y;
      for (let x = 0; x < 8; x += 1) {
        const si = dib1 + dibSize + row * xorRow8 + x * 4;
        out[si] = x * 30;
        out[si + 1] = 0;
        out[si + 2] = 0;
        out[si + 3] = y === 7 ? 64 : 255;
      }
    }
    const entry = pickBestIcoEntry(out);
    expect(entry).not.toBeNull();
    expect(entry!.width).toBe(8);
    const bitmap = decodeIcoBitmap(out, entry!);
    expect(bitmap).not.toBeNull();
    expect(bitmap!.width).toBe(8);
    expect(bitmap!.height).toBe(8);
    expect(pixelAt(bitmap!, 0, 0)).toEqual([0, 0, 0, 255]);
    expect(pixelAt(bitmap!, 7, 0)).toEqual([0, 0, 210, 255]);
    expect(pixelAt(bitmap!, 0, 7)).toEqual([0, 0, 0, 64]);
  });

  it("applies the AND mask for 24-bit entries", () => {
    const dibSize = 40;
    const width = 4;
    const height = 2;
    const xorRow = Math.ceil((width * 3) / 4) * 4;
    const andRow = Math.ceil(width / 32) * 4;
    const iconBytes = dibSize + xorRow * height + andRow * height;
    const out = new Uint8Array(6 + 16 + iconBytes);
    writeU16(out, 0, 0);
    writeU16(out, 2, 1);
    writeU16(out, 4, 1);
    writeU16(out, 6 + 4, 1);
    writeU16(out, 6 + 6, 24);
    writeU32(out, 6 + 8, iconBytes);
    writeU32(out, 6 + 12, 22);
    const dib = 22;
    writeU32(out, dib, 40);
    writeI32(out, dib + 4, width);
    writeI32(out, dib + 8, height * 2);
    writeU16(out, dib + 12, 1);
    writeU16(out, dib + 14, 24);
    writeU32(out, dib + 16, 0);
    for (let y = 0; y < height; y += 1) {
      const row = height - 1 - y;
      for (let x = 0; x < width; x += 1) {
        const si = dib + dibSize + row * xorRow + x * 3;
        out[si] = 0;
        out[si + 1] = 0;
        out[si + 2] = 200;
      }
    }
    const andOffset = dib + dibSize + xorRow * height;
    // AND mask rows are bottom-up like the XOR data. Bit set = transparent.
    // Image row 0 (top) maps to AND row height-1, so write it there.
    out[andOffset + andRow] = 0x80;
    const bitmap = decodeIcoBitmap(out, pickBestIcoEntry(out)!);
    expect(bitmap).not.toBeNull();
    expect(pixelAt(bitmap!, 0, 0)[3]).toBe(0);
    expect(pixelAt(bitmap!, 1, 0)[3]).toBe(255);
    expect(pixelAt(bitmap!, 0, 1)[3]).toBe(255);
  });
});

describe("GIF animation detection", () => {
  it("flags multi-image GIFs as animated", () => {
    expect(detectGifAnimation(buildGif(2))).toEqual({ animated: true, frameCount: 2 });
    expect(detectGifAnimation(buildGif(5))).toEqual({ animated: true, frameCount: 5 });
  });

  it("treats single-image GIFs as static", () => {
    expect(detectGifAnimation(buildGif(1))).toEqual({ animated: false, frameCount: 1 });
  });
});

describe("SVG sanitizer", () => {
  it("strips scripts and event handlers from untrusted SVG", () => {
    const dirty = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '<script>alert(1)</script>',
      '<rect onmouseover="alert(2)" fill="red" width="10" height="10"/>',
      "<path onclick=\"alert(3)\" d=\"M0 0\"/>",
      "</svg>",
    ].join("");
    const clean = sanitizeSvg(dirty);
    expect(clean).not.toMatch(/script/i);
    expect(clean).not.toMatch(/onmouseover|onclick/i);
    expect(clean).toContain("<svg");
  });

  it("strips external references but keeps internal fragment links", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      '<image href="https://evil.example/x.png"/>',
      '<use href="#symbol"/>',
      "</svg>",
    ].join("");
    const clean = sanitizeSvg(svg);
    expect(clean).not.toContain("https://evil");
    expect(clean).toContain("#symbol");
  });

  it("removes foreignObject and embedded objects", () => {
    const svg = [
      '<svg xmlns="http://www.w3.org/2000/svg">',
      "<foreignObject><body xmlns=\"http://www.w3.org/1999/xhtml\"><iframe src=\"https://x\"/></body></foreignObject>",
      "</svg>",
    ].join("");
    const clean = sanitizeSvg(svg);
    expect(clean.toLowerCase()).not.toContain("foreignobject");
    expect(clean.toLowerCase()).not.toContain("iframe");
  });
});

describe("PSD (RLE) decode fixture", () => {
  const u16 = (v: number): number[] => [v >> 8, v & 255];
  const u32 = (v: number): number[] => [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  const literal = (row: number[]): number[] => [row.length - 1, ...row];

  function buildRlePsd(channels: number, channelRows: number[][][]): Uint8Array {
    const w = 2;
    const h = 2;
    const out: number[] = [];
    out.push(...[0x38, 0x42, 0x50, 0x53], 0, 1, ...new Array(6).fill(0));
    out.push(...u16(channels), ...u32(h), ...u32(w), ...u16(8), ...u16(3));
    out.push(...u32(0), ...u32(0), ...u32(12), ...u32(2), ...u16(0), ...u16(0), ...u32(0), ...u16(1));
    for (let ch = 0; ch < channels; ch += 1) {
      for (let r = 0; r < h; r += 1) out.push(...u16(channelRows[ch][r].length));
    }
    for (let ch = 0; ch < channels; ch += 1) {
      for (let r = 0; r < h; r += 1) out.push(...channelRows[ch][r]);
    }
    return new Uint8Array(out);
  }

  it("builds a valid PSD fixture that @webtoon/psd can decode", async () => {
    const { default: Psd } = await import("@webtoon/psd");
    const redRows = [literal([10, 40]), literal([70, 100])];
    const greenRows = [literal([20, 50]), literal([80, 110])];
    const blueRows = [literal([30, 60]), literal([90, 120])];
    const alphaRows = [literal([255, 128]), literal([64, 32])];
    const data = buildRlePsd(4, [redRows, greenRows, blueRows, alphaRows]);
    const psd = Psd.parse(data.buffer as ArrayBuffer);
    const rgba = await psd.composite();
    expect(rgba.length).toBe(2 * 2 * 4);
    expect(Array.from(rgba)).toEqual([
      10, 20, 30, 255,
      40, 50, 60, 128,
      70, 80, 90, 64,
      100, 110, 120, 32,
    ]);
  });
});
