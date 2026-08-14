import { describe, expect, it } from "vitest";
import { tryCalculatePaperbackCoverDimensions } from "@/lib/kdp/paperback-calculator";
import { getSpineCoefficientInches } from "@/lib/kdp/specifications";
import { inchesToUnit, roundTo } from "@/lib/kdp/unit-conversion";
import {
  parsePageCount,
  validatePaperbackCoverForm,
} from "@/lib/kdp/validation";
import type { PaperbackCoverInput } from "@/lib/kdp/types";

function baseInput(
  overrides: Partial<PaperbackCoverInput> = {},
): PaperbackCoverInput {
  return {
    trimWidth: 6,
    trimHeight: 9,
    pageCount: 250,
    interiorType: "black_and_white",
    paperType: "cream",
    units: "in",
    pageTurnDirection: "ltr",
    bindingType: "paperback",
    ...overrides,
  };
}

describe("paperback cover calculation engine", () => {
  it("calculates 6 × 9, 250 pages, B&W, cream", () => {
    const coefficient = getSpineCoefficientInches("black_and_white", "cream");
    expect(coefficient).toBe(0.0025);
    const result = tryCalculatePaperbackCoverDimensions(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.spineWidth).toBe(roundTo(250 * 0.0025, 6));
    expect(result.value.spineWidth).toBe(0.625);
    expect(result.value.fullCoverWidth).toBe(0.125 + 6 + 0.625 + 6 + 0.125);
    expect(result.value.fullCoverHeight).toBe(9.25);
    expect(result.value.frontCoverWidth).toBe(6);
    expect(result.value.backCoverWidth).toBe(6);
    expect(result.value.bleed).toBe(0.125);
    expect(result.value.spineTextEligible).toBe(true);
  });

  it("matches 6 × 9, 236 pages, B&W, cream wrap sizes", () => {
    const result = tryCalculatePaperbackCoverDimensions(
      baseInput({ pageCount: 236 }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.spineWidth).toBe(0.59);
    expect(result.value.fullCoverWidth).toBe(12.84);
    expect(result.value.fullCoverHeight).toBe(9.25);
    expect(result.value.safeArea.width).toBe(5.875);
    expect(result.value.safeArea.height).toBe(8.75);
    expect(result.value.spineSafeAreaWidth).toBe(0.465);
    expect(result.value.spineSafeAreaHeight).toBe(8.75);
    expect(result.value.barcodeArea.width).toBe(2);
    expect(result.value.barcodeArea.height).toBe(1.2);
    expect(result.value.barcodeMargin).toBe(0.25);
  });

  it("calculates 6 × 9, 100 pages, B&W, white", () => {
    const result = tryCalculatePaperbackCoverDimensions(
      baseInput({ pageCount: 100, paperType: "white" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.spineWidth).toBe(roundTo(100 * 0.002252, 6));
    expect(result.value.fullCoverWidth).toBe(
      roundTo(0.125 + 6 + 100 * 0.002252 + 6 + 0.125, 6),
    );
    expect(result.value.fullCoverHeight).toBe(9.25);
  });

  it("calculates 6 × 9, 300 pages, standard color", () => {
    const result = tryCalculatePaperbackCoverDimensions(
      baseInput({
        pageCount: 300,
        interiorType: "standard_color",
        paperType: "white",
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.spineCoefficientInches).toBe(0.002252);
    expect(result.value.spineWidth).toBe(roundTo(300 * 0.002252, 6));
    expect(result.value.fullCoverWidth).toBe(
      roundTo(12.25 + 300 * 0.002252, 6),
    );
  });

  it("supports different trim sizes", () => {
    const fiveByEight = tryCalculatePaperbackCoverDimensions(
      baseInput({ trimWidth: 5, trimHeight: 8, pageCount: 200 }),
    );
    const eightFive = tryCalculatePaperbackCoverDimensions(
      baseInput({ trimWidth: 8.5, trimHeight: 11, pageCount: 200 }),
    );
    expect(fiveByEight.ok && eightFive.ok).toBe(true);
    if (!fiveByEight.ok || !eightFive.ok) return;
    expect(fiveByEight.value.fullCoverWidth).toBe(0.125 + 5 + 0.5 + 5 + 0.125);
    expect(fiveByEight.value.fullCoverHeight).toBe(8.25);
    expect(eightFive.value.fullCoverWidth).toBe(0.125 + 8.5 + 0.5 + 8.5 + 0.125);
    expect(eightFive.value.fullCoverHeight).toBe(11.25);
  });

  it("scales spine width with page count", () => {
    const a = tryCalculatePaperbackCoverDimensions(baseInput({ pageCount: 100 }));
    const b = tryCalculatePaperbackCoverDimensions(baseInput({ pageCount: 400 }));
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(b.value.spineWidth).toBe(a.value.spineWidth * 4);
  });

  it("converts inches to millimeters", () => {
    const inches = tryCalculatePaperbackCoverDimensions(baseInput());
    const mm = tryCalculatePaperbackCoverDimensions(baseInput({ units: "mm" }));
    expect(inches.ok && mm.ok).toBe(true);
    if (!inches.ok || !mm.ok) return;
    expect(mm.value.unit).toBe("mm");
    expect(mm.value.spineWidth).toBe(roundTo(inchesToUnit(0.625, "mm"), 6));
    expect(mm.value.fullCoverHeight).toBe(roundTo(inchesToUnit(9.25, "mm"), 6));
    expect(mm.value.bleed).toBe(roundTo(inchesToUnit(0.125, "mm"), 6));
  });

  it("converts inches to centimeters", () => {
    const cm = tryCalculatePaperbackCoverDimensions(baseInput({ units: "cm" }));
    expect(cm.ok).toBe(true);
    if (!cm.ok) return;
    expect(cm.value.unit).toBe("cm");
    expect(cm.value.spineWidth).toBe(roundTo(inchesToUnit(0.625, "cm"), 6));
    expect(cm.value.fullCoverHeight).toBe(roundTo(inchesToUnit(9.25, "cm"), 6));
  });

  it("uses back | spine | front for left-to-right layout", () => {
    const result = tryCalculatePaperbackCoverDimensions(
      baseInput({ pageTurnDirection: "ltr" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.layout).toEqual({
      left: "back",
      center: "spine",
      right: "front",
    });
  });

  it("uses front | spine | back for right-to-left layout", () => {
    const result = tryCalculatePaperbackCoverDimensions(
      baseInput({ pageTurnDirection: "rtl" }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.layout).toEqual({
      left: "front",
      center: "spine",
      right: "back",
    });
    expect(result.value.fullCoverWidth).toBe(12.875);
  });

  it("applies the 79/80 spine-text boundary", () => {
    const at79 = tryCalculatePaperbackCoverDimensions(baseInput({ pageCount: 79 }));
    const at80 = tryCalculatePaperbackCoverDimensions(baseInput({ pageCount: 80 }));
    expect(at79.ok && at80.ok).toBe(true);
    if (!at79.ok || !at80.ok) return;
    expect(at79.value.spineTextEligible).toBe(false);
    expect(at80.value.spineTextEligible).toBe(true);
  });

  it("rejects invalid page counts", () => {
    expect(tryCalculatePaperbackCoverDimensions(baseInput({ pageCount: 0 })).ok).toBe(
      false,
    );
    expect(
      tryCalculatePaperbackCoverDimensions(baseInput({ pageCount: -12 })).ok,
    ).toBe(false);
    expect(
      tryCalculatePaperbackCoverDimensions(baseInput({ pageCount: 12.5 })).ok,
    ).toBe(false);
    expect(parsePageCount("").issues[0]?.message).toBe("Enter the number of pages.");
    expect(parsePageCount("12.5").issues[0]?.message).toBe(
      "Page count must be a whole number.",
    );
    const range = validatePaperbackCoverForm({
      bindingType: "paperback",
      interiorType: "black_and_white",
      paperType: "cream",
      pageCountRaw: "900",
      trimId: "6x9",
      pageTurnDirection: "ltr",
      units: "in",
    });
    expect(
      range.some(
        (issue) =>
          issue.message ===
          "Enter a page count supported by the selected KDP configuration.",
      ),
    ).toBe(true);
  });

  it("rejects invalid paper/interior combinations", () => {
    const creamColor = tryCalculatePaperbackCoverDimensions(
      baseInput({
        interiorType: "standard_color",
        paperType: "cream",
      }),
    );
    expect(creamColor.ok).toBe(false);
    if (creamColor.ok) return;
    expect(creamColor.issues[0]?.message).toBe(
      "This paper type is not available for the selected interior.",
    );

    const groundwoodPremium = tryCalculatePaperbackCoverDimensions(
      baseInput({
        interiorType: "premium_color",
        paperType: "groundwood",
      }),
    );
    expect(groundwoodPremium.ok).toBe(false);
  });

  it("does not emit non-finite results for valid inputs", () => {
    const result = tryCalculatePaperbackCoverDimensions(baseInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const numeric = [
      result.value.spineWidth,
      result.value.fullCoverWidth,
      result.value.fullCoverHeight,
      result.value.bleed,
    ];
    expect(numeric.every((value) => Number.isFinite(value))).toBe(true);
    expect(numeric.join(" ")).not.toContain("NaN");
  });

  it("keeps hardcover unimplemented without inventing specs", () => {
    const result = tryCalculatePaperbackCoverDimensions(
      baseInput({ bindingType: "hardcover" }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.message).toContain("coming soon");
  });
});
