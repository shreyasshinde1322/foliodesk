import { describe, expect, it } from "vitest";
import { validateOutput } from "@/engines/image";
import type { ConvertedImage } from "@/engines/image";

function rasterResult(overrides: Partial<ConvertedImage> = {}): ConvertedImage {
  return {
    format: "png",
    width: 8,
    height: 8,
    sizeBytes: 100,
    mimeType: "image/png",
    outputName: "x.png",
    data: new Uint8Array([1, 2, 3]),
    ...overrides,
  };
}

describe("output validation", () => {
  it("accepts a valid raster output", () => {
    const report = validateOutput(rasterResult());
    expect(report.ok).toBe(true);
    expect(report.errors).toEqual([]);
  });

  it("rejects an empty output file", () => {
    const report = validateOutput(rasterResult({ sizeBytes: 0, data: new Uint8Array(0) }));
    expect(report.ok).toBe(false);
    expect(report.errors.join(" ")).toContain("empty");
  });

  it("rejects invalid dimensions", () => {
    const report = validateOutput(rasterResult({ width: 0, height: -3 }));
    expect(report.ok).toBe(false);
  });

  it("rejects a bad MIME type", () => {
    const report = validateOutput(rasterResult({ mimeType: "text/plain" }));
    expect(report.ok).toBe(false);
  });
});
