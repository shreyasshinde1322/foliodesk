import {
  BARCODE_AREA,
  getPageCountRange,
  getTrimSizeById,
  isPaperAvailable,
  KDP_MIN_TEXT_INSET_FROM_TRIM_INCHES,
  PAPER_UNAVAILABLE_REASON,
  RECOMMENDED_DESIGN_INSET_FROM_TRIM_INCHES,
  SPINE_TEXT_CLEARANCE_INCHES,
  SPINE_TEXT_MORE_THAN_PAGES,
} from "@/data/kdp/specifications";
import type {
  BindingType,
  InteriorType,
  MeasurementUnit,
  PageTurnDirection,
  PaperType,
  ValidationIssue,
} from "@/types/kdp";
import { isBindingImplemented } from "./binding-profiles";

export interface FormInput {
  bindingType: BindingType;
  interiorType: InteriorType;
  paperType: PaperType;
  pageCountRaw: string;
  trimId: string;
  pageTurnDirection: PageTurnDirection;
  units: MeasurementUnit;
}

const WHOLE_NUMBER = /^-?\d+$/;

export function parsePageCount(raw: string): {
  value: number | null;
  issues: ValidationIssue[];
} {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {
      value: null,
      issues: [{ field: "pageCount", message: "Enter the number of pages." }],
    };
  }

  if (trimmed.includes(".") || trimmed.includes(",")) {
    return {
      value: null,
      issues: [
        {
          field: "pageCount",
          message: "Page count must be a whole number.",
        },
      ],
    };
  }

  if (!WHOLE_NUMBER.test(trimmed)) {
    return {
      value: null,
      issues: [
        {
          field: "pageCount",
          message: "Page count must be a whole number.",
        },
      ],
    };
  }

  const value = Number(trimmed);
  if (!Number.isSafeInteger(value) || value <= 0) {
    return {
      value: null,
      issues: [
        {
          field: "pageCount",
          message:
            "Enter a page count supported by the selected KDP configuration.",
        },
      ],
    };
  }

  return { value, issues: [] };
}

export function validateCoverForm(input: FormInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isBindingImplemented(input.bindingType)) {
    issues.push({
      field: "bindingType",
      message: "Hardcover calculations are coming soon and are not available yet.",
    });
  }

  if (!isPaperAvailable(input.interiorType, input.paperType)) {
    const reason =
      PAPER_UNAVAILABLE_REASON[input.interiorType][input.paperType] ??
      "This paper type is not available for the selected interior.";
    issues.push({
      field: "paperType",
      message: "This paper type is not available for the selected interior.",
    });
    issues.push({
      field: "paperTypeReason",
      message: reason,
    });
  }

  const trimSize = getTrimSizeById(input.trimId);
  if (!trimSize) {
    issues.push({
      field: "trimSize",
      message: "Select a supported paperback trim size.",
    });
  }

  const parsed = parsePageCount(input.pageCountRaw);
  issues.push(...parsed.issues);

  if (parsed.value !== null && trimSize && isPaperAvailable(input.interiorType, input.paperType)) {
    const range = getPageCountRange(
      input.trimId,
      input.interiorType,
      input.paperType,
    );
    if (!range) {
      issues.push({
        field: "trimSize",
        message:
          "This interior type is not listed as available for the selected trim size in current KDP paperback guidelines.",
      });
      issues.push({
        field: "pageCount",
        message:
          "Enter a page count supported by the selected KDP configuration.",
      });
    } else if (parsed.value < range.min || parsed.value > range.max) {
      issues.push({
        field: "pageCount",
        message:
          "Enter a page count supported by the selected KDP configuration.",
      });
      issues.push({
        field: "pageCountRange",
        message: `Supported range for this configuration is ${range.min}–${range.max} pages.`,
      });
    }
  }

  return issues;
}

export const validatePaperbackCoverForm = validateCoverForm;

export function isSpineTextEligible(pageCount: number): boolean {
  return pageCount > SPINE_TEXT_MORE_THAN_PAGES;
}

export function safeAreaInches() {
  return {
    kdpMinimumFromTrim: KDP_MIN_TEXT_INSET_FROM_TRIM_INCHES,
    recommendedFromTrim: RECOMMENDED_DESIGN_INSET_FROM_TRIM_INCHES,
    spineClearance: SPINE_TEXT_CLEARANCE_INCHES,
  };
}

export { BARCODE_AREA };
