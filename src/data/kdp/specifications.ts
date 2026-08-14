/**
 * Versioned KDP paperback cover specifications.
 *
 * Source of truth (retrieved August 2026):
 * - Create a Paperback Cover:
 *   https://kdp.amazon.com/en_US/help/topic/G201953020
 * - Paperback Submission Guidelines:
 *   https://kdp.amazon.com/en_US/help/topic/G201857950
 * - Print Options:
 *   https://kdp.amazon.com/en_US/help/topic/G201834180
 *
 * Do not substitute third-party calculator values. Official KDP paperback
 * spine formulas are page count × paper coefficient. This file does not add
 * an extra cover-stock constant because that term is not in the cited pages.
 *
 * Color-spine note: G201953020 lists Premium Color as 0.002347" and Standard
 * Color as 0.002252". G201857950 lists a single “Color paper” coefficient of
 * 0.002347". This configuration follows the more specific G201953020 values.
 */

import type {
  InteriorType,
  MeasurementUnit,
  Orientation,
  PaperType,
  TrimSize,
} from "@/types/kdp";

export const KDP_SPEC_VERSION = "2026-08-paperback-v1";

export const KDP_SOURCES = {
  paperbackCover:
    "https://kdp.amazon.com/en_US/help/topic/G201953020",
  paperbackGuidelines:
    "https://kdp.amazon.com/en_US/help/topic/G201857950",
  printOptions: "https://kdp.amazon.com/en_US/help/topic/G201834180",
  coverCalculator: "https://kdp.amazon.com/en_US/cover-calculator",
} as const;

export const INCH_TO_MM = 25.4;
export const INCH_TO_CM = 2.54;

/** Canonical unit for all cover formulas published by KDP. */
export const CANONICAL_UNIT: MeasurementUnit = "in";

/**
 * Bleed on the top, bottom, and outside edges.
 * Source: G201953020 / G201857950 — 0.125" (3.2 mm).
 */
export const PAPERBACK_BLEED_INCHES = 0.125;

/**
 * Front/back cover text must be at least 0.125" inside the trim lines.
 * Source: G201953020 “Adding text”.
 */
export const KDP_MIN_TEXT_INSET_FROM_TRIM_INCHES = 0.125;

/**
 * Recommended extra design margin inside the trim, independent of the
 * 0.125" KDP text inset. This is a FolioDesk design recommendation, not an
 * Amazon requirement. Official border guidance on G201953020 says borders
 * should cover at least 0.25" inside the trim line.
 */
export const RECOMMENDED_DESIGN_INSET_FROM_TRIM_INCHES = 0.25;

/**
 * Spine text clearance from each spine edge.
 * Source: G201953020 — at least 0.0625" (1.6 mm).
 */
export const SPINE_TEXT_CLEARANCE_INCHES = 0.0625;

/**
 * Spine text is printed on books with more than 79 pages.
 * Source: G201953020 — “We only print spine text on books with more than 79 pages.”
 * Eligible when pageCount > 79.
 */
export const SPINE_TEXT_MORE_THAN_PAGES = 79;

export const SPINE_TEXT_GUIDANCE =
  "Spine text is available for books with more than 79 pages according to current KDP guidance.";

export const SPINE_TEXT_CLEARANCE_GUIDANCE =
  "Current KDP guidance is that spine text should have at least 0.0625 inch / 1.6 mm clearance from each edge of the spine.";

/**
 * Paperback spine coefficients in inches per page.
 * Source: G201953020 (B&W white/cream, Premium Color, Standard Color)
 * and G201857950 (groundwood).
 */
export const SPINE_COEFFICIENTS_INCHES: Record<
  InteriorType,
  Partial<Record<PaperType, number>>
> = {
  black_and_white: {
    white: 0.002252,
    cream: 0.0025,
    groundwood: 0.00235,
  },
  premium_color: {
    white: 0.002347,
  },
  standard_color: {
    white: 0.002252,
  },
};

export const PAPER_AVAILABILITY: Record<InteriorType, PaperType[]> = {
  black_and_white: ["white", "cream", "groundwood"],
  standard_color: ["white"],
  premium_color: ["white"],
};

export const PAPER_UNAVAILABLE_REASON: Record<
  InteriorType,
  Partial<Record<PaperType, string>>
> = {
  black_and_white: {},
  standard_color: {
    cream:
      "Cream paper is listed by KDP for black-and-white interiors, not standard color.",
    groundwood:
      "Groundwood paper is listed by KDP for black-and-white paperback interiors, not color interiors.",
  },
  premium_color: {
    cream:
      "Cream paper is listed by KDP for black-and-white interiors, not premium color.",
    groundwood:
      "Groundwood paper is listed by KDP for black-and-white paperback interiors, not color interiors.",
  },
};

interface PageLimitSet {
  black_and_white: Record<PaperType, { min: number; max: number }>;
  standard_color: { white: { min: number; max: number } | null };
  premium_color: { white: { min: number; max: number } };
}

const LIMITS_COMMON: PageLimitSet = {
  black_and_white: {
    white: { min: 24, max: 828 },
    cream: { min: 24, max: 776 },
    groundwood: { min: 24, max: 812 },
  },
  standard_color: { white: { min: 72, max: 600 } },
  premium_color: { white: { min: 24, max: 828 } },
};

const LIMITS_8_25: PageLimitSet = {
  black_and_white: {
    white: { min: 24, max: 800 },
    cream: { min: 24, max: 750 },
    groundwood: { min: 24, max: 784 },
  },
  standard_color: { white: { min: 72, max: 600 } },
  premium_color: { white: { min: 24, max: 800 } },
};

const LIMITS_8_5: PageLimitSet = {
  black_and_white: {
    white: { min: 24, max: 590 },
    cream: { min: 24, max: 550 },
    groundwood: { min: 24, max: 578 },
  },
  standard_color: { white: { min: 72, max: 600 } },
  premium_color: { white: { min: 24, max: 590 } },
};

const LIMITS_8_27_11_69: PageLimitSet = {
  black_and_white: {
    white: { min: 24, max: 780 },
    cream: { min: 24, max: 730 },
    groundwood: { min: 24, max: 764 },
  },
  // G201857950 first table: Standard color not available for 8.27" x 11.69".
  standard_color: { white: null },
  // First table lists premium color max 590; a later table on the same page
  // lists 780. This configuration uses the first (common-size) table value.
  premium_color: { white: { min: 24, max: 590 } },
};

const LIMITS_8_27_10_12: PageLimitSet = {
  black_and_white: {
    white: { min: 24, max: 780 },
    cream: { min: 24, max: 730 },
    groundwood: { min: 24, max: 764 },
  },
  standard_color: { white: { min: 72, max: 600 } },
  premium_color: { white: { min: 24, max: 780 } },
};

function orientationFor(width: number, height: number): Orientation {
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

function trim(
  id: string,
  widthInches: number,
  heightInches: number,
  group: TrimSize["group"],
  limits: PageLimitSet,
): TrimSize & { pageLimits: PageLimitSet } {
  return {
    id,
    displayName: `${trimDisplay(widthInches)} × ${trimDisplay(heightInches)} in`,
    widthInches,
    heightInches,
    unit: "in",
    orientation: orientationFor(widthInches, heightInches),
    group,
    pageLimits: limits,
  };
}

function trimDisplay(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

/**
 * Paperback trim sizes published in G201857950, including the sizes requested
 * for this tool. This is the catalog from that help page at the time of
 * authoring, not a guarantee that KDP will never add or remove sizes.
 */
export const PAPERBACK_TRIM_SIZES: Array<
  TrimSize & { pageLimits: PageLimitSet }
> = [
  trim("5x8", 5, 8, "common", LIMITS_COMMON),
  trim("5.06x7.81", 5.06, 7.81, "common", LIMITS_COMMON),
  trim("5.25x8", 5.25, 8, "common", LIMITS_COMMON),
  trim("5.5x8.5", 5.5, 8.5, "common", LIMITS_COMMON),
  trim("6x9", 6, 9, "common", LIMITS_COMMON),
  trim("6.14x9.21", 6.14, 9.21, "common", LIMITS_COMMON),
  trim("6.69x9.61", 6.69, 9.61, "common", LIMITS_COMMON),
  trim("7x10", 7, 10, "common", LIMITS_COMMON),
  trim("7.44x9.69", 7.44, 9.69, "common", LIMITS_COMMON),
  trim("7.5x9.25", 7.5, 9.25, "common", LIMITS_COMMON),
  trim("8x10", 8, 10, "common", LIMITS_COMMON),
  trim("8.25x6", 8.25, 6, "common", LIMITS_8_25),
  trim("8.25x8.25", 8.25, 8.25, "common", LIMITS_8_25),
  trim("8.27x11.69", 8.27, 11.69, "common", LIMITS_8_27_11_69),
  trim("8.5x8.5", 8.5, 8.5, "common", LIMITS_8_5),
  trim("8.5x11", 8.5, 11, "common", LIMITS_8_5),
  trim("4.06x7.17", 4.06, 7.17, "additional", LIMITS_COMMON),
  trim("4.13x6.81", 4.13, 6.81, "additional", LIMITS_COMMON),
  trim("4.41x6.85", 4.41, 6.85, "additional", LIMITS_COMMON),
  trim("5x7.4", 5, 7.4, "additional", LIMITS_COMMON),
  trim("5.04x7.17", 5.04, 7.17, "additional", LIMITS_COMMON),
  trim("5.83x8.27", 5.83, 8.27, "additional", LIMITS_COMMON),
  trim("5.98x8.58", 5.98, 8.58, "additional", LIMITS_COMMON),
  trim("5.98x8.94", 5.98, 8.94, "additional", LIMITS_COMMON),
  trim("7.17x10.12", 7.17, 10.12, "additional", LIMITS_COMMON),
  trim("7.17x8.11", 7.17, 8.11, "additional", LIMITS_COMMON),
  trim("8.27x10.12", 8.27, 10.12, "additional", LIMITS_8_27_10_12),
];

export const DEFAULT_TRIM_ID = "6x9";

export function getTrimSizeById(id: string) {
  return PAPERBACK_TRIM_SIZES.find((size) => size.id === id);
}

export function isPaperAvailable(
  interiorType: InteriorType,
  paperType: PaperType,
): boolean {
  return PAPER_AVAILABILITY[interiorType].includes(paperType);
}

export function getSpineCoefficientInches(
  interiorType: InteriorType,
  paperType: PaperType,
): number | null {
  return SPINE_COEFFICIENTS_INCHES[interiorType][paperType] ?? null;
}

export function getPageCountRange(
  trimId: string,
  interiorType: InteriorType,
  paperType: PaperType,
): { min: number; max: number } | null {
  const trimSize = getTrimSizeById(trimId);
  if (!trimSize) return null;

  if (interiorType === "black_and_white") {
    return trimSize.pageLimits.black_and_white[paperType];
  }

  if (paperType !== "white") return null;

  if (interiorType === "standard_color") {
    return trimSize.pageLimits.standard_color.white;
  }

  return trimSize.pageLimits.premium_color.white;
}

/**
 * Barcode location and size taken from the official KDP cover-calculator
 * PNG template (for example 2.000" × 1.200" with a 0.25" margin from the
 * bottom trim and the spine fold). Also documented in older KDP print
 * publishing guidelines.
 */
export const BARCODE_WIDTH_INCHES = 2;
export const BARCODE_HEIGHT_INCHES = 1.2;
export const BARCODE_MARGIN_INCHES = 0.25;

export const BARCODE_AREA = {
  isExactSpecification: true as const,
  label: "Barcode area",
  placement:
    "Back cover, lower edge near the spine, inset by the barcode margin from the trim and spine fold.",
  note: "Size and placement match the official KDP cover calculator template: 2.000 in × 1.200 in, with a 0.25 in barcode margin.",
};

export const DISPLAY_DECIMALS: Record<MeasurementUnit, number> = {
  in: 3,
  mm: 2,
  cm: 3,
};

export const INTERNAL_DECIMALS = 6;
