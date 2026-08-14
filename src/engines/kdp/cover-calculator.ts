import {
  BARCODE_AREA,
  getSpineCoefficientInches,
  isPaperAvailable,
} from "@/data/kdp/specifications";
import { convertFromInches } from "@/lib/calculations/units";
import type {
  CalculatorResult,
  CoverLayout,
  PaperbackCoverDimensions,
  PaperbackCoverInput,
  ValidationIssue,
} from "@/types/kdp";
import { isBindingImplemented } from "./binding-profiles";
import {
  calculateBarcodeAreaInches,
  calculateBleedInches,
  calculateFullCoverDimensionsInches,
  calculateSafeAreaInches,
  calculateSpineSafeAreaInches,
  calculateSpineWidthInches,
} from "./formulas";
import { isSpineTextEligible } from "./validate-cover";

function layoutFor(
  direction: PaperbackCoverInput["pageTurnDirection"],
): CoverLayout {
  if (direction === "rtl") {
    return { left: "front", center: "spine", right: "back" };
  }
  return { left: "back", center: "spine", right: "front" };
}

function convertValue(
  inches: number,
  unit: PaperbackCoverInput["units"],
): number {
  return convertFromInches(inches, unit);
}

export function calculateCoverDimensions(
  input: PaperbackCoverInput,
): PaperbackCoverDimensions {
  const result = tryCalculateCoverDimensions(input);
  if (!result.ok) {
    throw new Error(result.issues.map((issue) => issue.message).join(" "));
  }
  return result.value;
}

export const calculatePaperbackCoverDimensions = calculateCoverDimensions;

export function tryCalculateCoverDimensions(
  input: PaperbackCoverInput,
): CalculatorResult {
  const issues: ValidationIssue[] = [];

  if (!isBindingImplemented(input.bindingType ?? "paperback")) {
    issues.push({
      field: "bindingType",
      message: "Hardcover calculations are coming soon and are not available yet.",
    });
  }

  if (
    !Number.isInteger(input.pageCount) ||
    !Number.isFinite(input.pageCount)
  ) {
    issues.push({
      field: "pageCount",
      message: "Page count must be a whole number.",
    });
  } else if (input.pageCount <= 0) {
    issues.push({
      field: "pageCount",
      message:
        "Enter a page count supported by the selected KDP configuration.",
    });
  }

  if (
    !Number.isFinite(input.trimWidth) ||
    !Number.isFinite(input.trimHeight) ||
    input.trimWidth <= 0 ||
    input.trimHeight <= 0
  ) {
    issues.push({
      field: "trimSize",
      message: "Select a supported paperback trim size.",
    });
  }

  if (!isPaperAvailable(input.interiorType, input.paperType)) {
    issues.push({
      field: "paperType",
      message: "This paper type is not available for the selected interior.",
    });
  }

  const coefficient = getSpineCoefficientInches(
    input.interiorType,
    input.paperType,
  );
  if (coefficient === null) {
    issues.push({
      field: "paperType",
      message: "This paper type is not available for the selected interior.",
    });
  }

  if (issues.length > 0 || coefficient === null) {
    return { ok: false, issues };
  }

  const bleedInches = calculateBleedInches();
  const spineWidthInches = calculateSpineWidthInches(
    input.pageCount,
    input.interiorType,
    input.paperType,
  );
  const wrap = calculateFullCoverDimensionsInches({
    trimWidth: input.trimWidth,
    trimHeight: input.trimHeight,
    spineWidth: spineWidthInches,
    bleed: bleedInches,
  });
  const live = calculateSafeAreaInches({
    trimWidth: input.trimWidth,
    trimHeight: input.trimHeight,
  });
  const spineSafe = calculateSpineSafeAreaInches({
    spineWidth: spineWidthInches,
    trimHeight: input.trimHeight,
  });
  const barcode = calculateBarcodeAreaInches();

  const values = [
    spineWidthInches,
    wrap.fullCoverWidth,
    wrap.fullCoverHeight,
  ];
  if (values.some((value) => !Number.isFinite(value))) {
    return {
      ok: false,
      issues: [
        {
          field: "calculation",
          message: "The cover dimensions could not be calculated from these inputs.",
        },
      ],
    };
  }

  const unit = input.units;

  const value: PaperbackCoverDimensions = {
    trimWidth: convertValue(input.trimWidth, unit),
    trimHeight: convertValue(input.trimHeight, unit),
    spineWidth: convertValue(spineWidthInches, unit),
    bleed: convertValue(bleedInches, unit),
    fullCoverWidth: convertValue(wrap.fullCoverWidth, unit),
    fullCoverHeight: convertValue(wrap.fullCoverHeight, unit),
    frontCoverWidth: convertValue(wrap.frontCoverWidth, unit),
    frontCoverHeight: convertValue(wrap.frontCoverHeight, unit),
    backCoverWidth: convertValue(wrap.backCoverWidth, unit),
    backCoverHeight: convertValue(wrap.backCoverHeight, unit),
    spineHeight: convertValue(wrap.spineHeight, unit),
    spineTextEligible: isSpineTextEligible(input.pageCount),
    spineCoefficientInches: coefficient,
    margin: convertValue(live.kdpMinimumFromTrim, unit),
    spineSafeAreaWidth: convertValue(spineSafe.width, unit),
    spineSafeAreaHeight: convertValue(spineSafe.height, unit),
    spineMargin: convertValue(spineSafe.margin, unit),
    barcodeMargin: convertValue(barcode.margin, unit),
    safeArea: {
      kdpMinimumFromTrim: convertValue(live.kdpMinimumFromTrim, unit),
      recommendedFromTrim: convertValue(live.recommendedFromTrim, unit),
      spineClearance: convertValue(live.spineClearance, unit),
      width: convertValue(live.width, unit),
      height: convertValue(live.height, unit),
      unit,
    },
    barcodeArea: {
      ...BARCODE_AREA,
      width: convertValue(barcode.width, unit),
      height: convertValue(barcode.height, unit),
      margin: convertValue(barcode.margin, unit),
    },
    layout: layoutFor(input.pageTurnDirection),
    unit,
    pageCount: input.pageCount,
    interiorType: input.interiorType,
    paperType: input.paperType,
  };

  return { ok: true, value };
}

export const tryCalculatePaperbackCoverDimensions = tryCalculateCoverDimensions;
