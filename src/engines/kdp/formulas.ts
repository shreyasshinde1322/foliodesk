import {
  BARCODE_HEIGHT_INCHES,
  BARCODE_MARGIN_INCHES,
  BARCODE_WIDTH_INCHES,
  PAPERBACK_BLEED_INCHES,
  getSpineCoefficientInches,
} from "@/data/kdp/specifications";
import type { InteriorType, PaperType } from "@/types/kdp";
import { safeAreaInches } from "./validate-cover";

export function calculateBleedInches(): number {
  return PAPERBACK_BLEED_INCHES;
}

export function calculateSpineWidthInches(
  pageCount: number,
  interiorType: InteriorType,
  paperType: PaperType,
): number {
  const coefficient = getSpineCoefficientInches(interiorType, paperType);
  if (coefficient === null) {
    throw new Error("This paper type is not available for the selected interior.");
  }
  return pageCount * coefficient;
}

export function calculateFullCoverDimensionsInches(input: {
  trimWidth: number;
  trimHeight: number;
  spineWidth: number;
  bleed: number;
}) {
  return {
    frontCoverWidth: input.trimWidth,
    frontCoverHeight: input.trimHeight,
    backCoverWidth: input.trimWidth,
    backCoverHeight: input.trimHeight,
    spineHeight: input.trimHeight,
    fullCoverWidth:
      input.bleed +
      input.trimWidth +
      input.spineWidth +
      input.trimWidth +
      input.bleed,
    fullCoverHeight: input.bleed + input.trimHeight + input.bleed,
  };
}

export function calculateSafeAreaInches(input: {
  trimWidth: number;
  trimHeight: number;
}) {
  const safe = safeAreaInches();
  return {
    ...safe,
    width: Math.max(input.trimWidth - safe.kdpMinimumFromTrim, 0),
    height: Math.max(input.trimHeight - safe.kdpMinimumFromTrim * 2, 0),
  };
}

export function calculateSpineSafeAreaInches(input: {
  spineWidth: number;
  trimHeight: number;
}) {
  const safe = safeAreaInches();
  return {
    width: Math.max(input.spineWidth - safe.spineClearance * 2, 0),
    height: Math.max(input.trimHeight - safe.kdpMinimumFromTrim * 2, 0),
    margin: safe.spineClearance,
  };
}

export function calculateBarcodeAreaInches() {
  return {
    width: BARCODE_WIDTH_INCHES,
    height: BARCODE_HEIGHT_INCHES,
    margin: BARCODE_MARGIN_INCHES,
  };
}
