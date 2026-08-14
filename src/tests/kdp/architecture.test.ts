import { describe, expect, it } from "vitest";
import {
  calculateBleedInches,
  calculateFullCoverDimensionsInches,
  calculateSpineWidthInches,
} from "@/engines/kdp/formulas";
import { getToolBySlug, searchTools } from "@/data/tools/registry";

describe("extracted KDP formulas", () => {
  it("calculates spine width from page count and coefficient", () => {
    expect(calculateSpineWidthInches(250, "black_and_white", "cream")).toBe(
      0.625,
    );
  });

  it("calculates full wrap from bleed, trim, and spine", () => {
    const wrap = calculateFullCoverDimensionsInches({
      trimWidth: 6,
      trimHeight: 9,
      spineWidth: 0.625,
      bleed: calculateBleedInches(),
    });
    expect(wrap.fullCoverWidth).toBe(12.875);
    expect(wrap.fullCoverHeight).toBe(9.25);
  });
});

describe("tool registry", () => {
  it("registers the cover calculator as the active local KDP tool", () => {
    const tool = getToolBySlug("kdp-cover-calculator");
    expect(tool?.status).toBe("active");
    expect(tool?.route).toBe("/kdp-cover-calculator");
    expect(tool?.processingType).toBe("local");
  });
});

describe("dynamic tool icons", () => {
  it("describes conversion pairs from the registry", () => {
    const pairs = [
      ["pdf-to-word", "pdf", "word"],
      ["word-to-pdf", "word", "pdf"],
      ["pdf-to-excel", "pdf", "excel"],
      ["excel-to-pdf", "excel", "pdf"],
      ["pdf-to-powerpoint", "pdf", "powerpoint"],
      ["powerpoint-to-pdf", "powerpoint", "pdf"],
      ["pdf-to-jpg", "pdf", "jpg"],
      ["jpg-to-pdf", "jpg", "pdf"],
    ] as const;
    for (const [slug, source, output] of pairs) {
      const item = getToolBySlug(slug);
      expect(item?.action).toBe("convert");
      expect(item?.iconType).toBe("conversion");
      expect(item?.sourceFormat).toBe(source);
      expect(item?.outputFormat).toBe(output);
    }
  });

  it("describes document and publishing actions", () => {
    expect(getToolBySlug("merge-pdf")?.action).toBe("merge");
    expect(getToolBySlug("split-pdf")?.action).toBe("split");
    expect(getToolBySlug("compress-pdf")?.action).toBe("compress");
    expect(getToolBySlug("kdp-cover-calculator")?.action).toBe("calculate");
    expect(getToolBySlug("kdp-cover-calculator")?.iconType).toBe("publishing");
  });
});

describe("searchTools", () => {
  it("finds compress tools from a shared keyword", () => {
    const names = searchTools("compress").map((tool) => tool.name);
    expect(names).toContain("Compress PDF");
    expect(names).toContain("Image Compressor");
    expect(names).toContain("Video Compressor");
  });

  it("finds word conversion tools", () => {
    const names = searchTools("word").map((tool) => tool.name);
    expect(names).toContain("PDF to Word");
    expect(names).toContain("Word to PDF");
  });

  it("finds kdp tools from the registry", () => {
    const names = searchTools("kdp").map((tool) => tool.name);
    expect(names).toContain("KDP Cover Calculator");
    expect(names).toContain("KDP Interior Formatter");
    expect(names).toContain("KDP Preflight");
  });
});
