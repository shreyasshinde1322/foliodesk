import { describe, expect, it } from "vitest";
import { computeTargetSize, needsResize } from "@/engines/image";
import type { ConversionOptions } from "@/engines/image";

const base: ConversionOptions = {
  outputFormat: "webp",
  quality: 85,
  background: "#ffffff",
  resizeMode: "keep",
  maintainAspectRatio: true,
  allowUpscale: false,
  pngCompression: "balanced",
};

describe("resize math", () => {
  it("keeps original size by default", () => {
    expect(computeTargetSize(800, 400, base)).toEqual({ width: 800, height: 400 });
    expect(needsResize(800, 400, base)).toBe(false);
  });

  it("forces exact dimensions when aspect ratio is off", () => {
    const options = { ...base, resizeMode: "exact" as const, width: 400, height: 200, maintainAspectRatio: false };
    expect(computeTargetSize(800, 400, options)).toEqual({ width: 400, height: 200 });
  });

  it("fits inside the box preserving aspect ratio", () => {
    const options = { ...base, resizeMode: "exact" as const, width: 400, height: 400 };
    expect(computeTargetSize(800, 400, options)).toEqual({ width: 400, height: 200 });
    const tall = { ...base, resizeMode: "exact" as const, width: 400, height: 200 };
    expect(computeTargetSize(300, 600, tall)).toEqual({ width: 100, height: 200 });
  });

  it("caps width preserving ratio", () => {
    const options = { ...base, resizeMode: "max-width" as const, width: 400 };
    expect(computeTargetSize(800, 400, options)).toEqual({ width: 400, height: 200 });
    expect(needsResize(800, 400, options)).toBe(true);
  });

  it("does not upscale with max-width", () => {
    const options = { ...base, resizeMode: "max-width" as const, width: 2000 };
    expect(computeTargetSize(800, 400, options)).toEqual({ width: 800, height: 400 });
    expect(needsResize(800, 400, options)).toBe(false);
  });

  it("caps height preserving ratio", () => {
    const options = { ...base, resizeMode: "max-height" as const, height: 200 };
    expect(computeTargetSize(800, 400, options)).toEqual({ width: 400, height: 200 });
  });

  it("scales by percentage and clamps to 1-500", () => {
    const options = { ...base, resizeMode: "percentage" as const, percentage: 150, allowUpscale: true };
    expect(computeTargetSize(800, 400, options)).toEqual({ width: 1200, height: 600 });
    const huge = { ...base, resizeMode: "percentage" as const, percentage: 1000, allowUpscale: true };
    const big = computeTargetSize(100, 50, huge);
    expect(big.width).toBe(500);
    expect(big.height).toBe(250);
  });

  it("does not upscale by percentage unless allowUpscale is set", () => {
    const options = { ...base, resizeMode: "percentage" as const, percentage: 150 };
    expect(computeTargetSize(800, 400, options)).toEqual({ width: 800, height: 400 });
  });

  it("never returns zero dimensions", () => {
    const options = { ...base, resizeMode: "exact" as const, width: 0, height: 0 };
    const size = computeTargetSize(100, 100, options);
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });

  it("guards non-finite source dimensions", () => {
    expect(computeTargetSize(0, 0, base)).toEqual({ width: 1, height: 1 });
  });
});
