import { describe, expect, it } from "vitest";
import { encodePng } from "@/engines/image";
import { decodeRgba, rgbaImage } from "./fixtures";

describe("built-in PNG encoder", () => {
  it("produces a valid, decodable PNG", async () => {
    const raw = rgbaImage(4, 4, (x, y) => [x * 60, y * 60, 100, 255]);
    const png = encodePng({ width: 4, height: 4, data: toClamped(raw) }, "balanced");
    expect(png[0]).toBe(0x89);
    expect(png[1]).toBe(0x50);
    const decoded = await decodeRgba(png);
    expect(decoded.width).toBe(4);
    expect(decoded.height).toBe(4);
    expect(decoded.data.subarray(0, 3)).toEqual(new Uint8Array([0, 0, 100]));
  });

  it("preserves alpha transparency", async () => {
    const raw = rgbaImage(2, 2, (x, y) => [10, 20, 30, (x + y) % 2 === 0 ? 255 : 0]);
    const png = encodePng({ width: 2, height: 2, data: toClamped(raw) }, "balanced");
    const decoded = await decodeRgba(png);
    expect(decoded.data[3]).toBe(255);
    expect(decoded.data[7]).toBe(0);
  });

  it("orders compression effort by size (maximum <= balanced <= fast)", async () => {
    // Noisy random data compresses measurably differently across levels.
    let seed = 42;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed % 256;
    };
    const data = new Uint8ClampedArray(64 * 64 * 4);
    for (let i = 0; i < data.length; i += 1) data[i] = random();
    const bitmap = { width: 64, height: 64, data };
    const fast = encodePng(bitmap, "fast");
    const balanced = encodePng(bitmap, "balanced");
    const maximum = encodePng(bitmap, "maximum");
    expect(maximum.length).toBeLessThanOrEqual(balanced.length);
    expect(balanced.length).toBeLessThanOrEqual(fast.length);
  });

  it("rejects empty images", () => {
    expect(() => encodePng({ width: 0, height: 4, data: new Uint8ClampedArray(0) }, "balanced")).toThrow();
  });
});

function toClamped(buffer: Uint8Array): Uint8ClampedArray {
  return new Uint8ClampedArray(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
