import { describe, expect, it } from "vitest";
import { clampQuality, normalizeConversionOptions } from "@/engines/image";

describe("conversion options normalization", () => {
  it("applies defaults", () => {
    const options = normalizeConversionOptions({});
    expect(options.outputFormat).toBe("webp");
    expect(options.quality).toBe(85);
    expect(options.background).toBe("#ffffff");
    expect(options.resizeMode).toBe("keep");
    expect(options.maintainAspectRatio).toBe(true);
  });

  it("clamps quality to 10-100", () => {
    expect(clampQuality(undefined)).toBe(85);
    expect(clampQuality(5)).toBe(10);
    expect(clampQuality(120)).toBe(100);
    expect(clampQuality(73.4)).toBe(73);
    expect(clampQuality(Number.NaN)).toBe(85);
  });

  it("normalizes hex colors and rejects invalid ones", () => {
    expect(normalizeConversionOptions({ background: "#AABBCC" }).background).toBe("#aabbcc");
    expect(normalizeConversionOptions({ background: "red" }).background).toBe("#ffffff");
    expect(normalizeConversionOptions({ background: "#abc" }).background).toBe("#ffffff");
  });

  it("only accepts known output formats", () => {
    // @ts-expect-error intentionally invalid format
    expect(normalizeConversionOptions({ outputFormat: "bmp" }).outputFormat).toBe("webp");
    expect(normalizeConversionOptions({ outputFormat: "png" }).outputFormat).toBe("png");
  });

  it("clamps resize numbers", () => {
    const options = normalizeConversionOptions({ width: -5, percentage: 999 });
    expect(options.width).toBeUndefined();
    expect(options.percentage).toBe(500);
  });
});
