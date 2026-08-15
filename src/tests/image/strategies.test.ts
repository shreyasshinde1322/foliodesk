import { describe, expect, it } from "vitest";
import {
  getInputFormats,
  getOutputFormats,
  getStrategy,
  getSupportedPairs,
} from "@/engines/image";
import { ENCODE_FORMATS, INPUT_EXTENSIONS } from "@/engines/image";
import type { ImageFormat } from "@/engines/image";

const INPUT_FORMATS: ImageFormat[] = [
  "jpg", "png", "webp", "gif", "avif", "heic", "heif", "psd", "bmp", "ico", "svg",
];

describe("strategy registry", () => {
  it("documents an explicit strategy for every input × output pair", () => {
    const pairs = getSupportedPairs();
    expect(pairs.length).toBe(INPUT_FORMATS.length * ENCODE_FORMATS.length);
    for (const input of INPUT_FORMATS) {
      for (const output of ENCODE_FORMATS) {
        const strategy = getStrategy(input, output);
        expect(strategy, `${input} → ${output}`).not.toBeNull();
        expect(strategy!.decoder).toBeTruthy();
        expect(strategy!.encoder).toBeTruthy();
        expect(strategy!.pipeline).toBeTruthy();
        expect(strategy!.browserRequirements.length).toBeGreaterThan(0);
        expect(strategy!.metadataSupport).toBe("strip");
      }
    }
  });

  it("uses the pure fflate PNG encoder for every PNG output", () => {
    for (const input of INPUT_FORMATS) {
      expect(getStrategy(input, "png")!.encoder).toBe("fflate-png");
    }
  });

  it("routes PSD input through the @webtoon/psd worker decoder", () => {
    expect(getStrategy("psd", "webp")!.decoder).toBe("webtoon-psd");
    expect(getStrategy("psd", "webp")!.workerRecommended).toBe(true);
  });

  it("routes HEIC input through libheif WASM", () => {
    expect(getStrategy("heic", "jpg")!.decoder).toBe("libheif-wasm");
    expect(getStrategy("heif", "png")!.decoder).toBe("libheif-wasm");
  });

  it("sanitizes SVG input before rendering", () => {
    expect(getStrategy("svg", "jpg")!.decoder).toBe("sanitized-svg-render");
  });

  it("flattens alpha only for JPEG output", () => {
    expect(getStrategy("png", "jpg")!.transparencySupport).toBe("flatten");
    expect(getStrategy("png", "webp")!.transparencySupport).toBe("preserve");
  });

  it("exposes input and output format lists used by the UI", () => {
    const inputs = getInputFormats();
    expect(inputs).toEqual(expect.arrayContaining(["heic", "psd", "bmp", "ico", "svg"]));
    expect(getOutputFormats()).toEqual(["jpg", "png", "webp", "avif"]);
    for (const ext of ["heic", "psd", "bmp", "ico", "svg"]) {
      expect(INPUT_EXTENSIONS).toContain(ext);
    }
  });
});
