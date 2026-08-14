import { formatPair, formatSingle, unitToInches } from "@/lib/calculations/units";
import type { InteriorType, PaperType, PaperbackCoverDimensions } from "@/types/kdp";

export const INTERIOR_LABELS: Record<InteriorType, string> = {
  black_and_white: "Black & White",
  standard_color: "Standard Color",
  premium_color: "Premium Color",
};

export const PAPER_LABELS: Record<PaperType, string> = {
  white: "White",
  cream: "Cream",
  groundwood: "Groundwood",
};

export function formatCoverDimensionsCopy(
  dimensions: PaperbackCoverDimensions,
  extras: {
    trimName: string;
    pageTurn: string;
  },
): string {
  const unit = dimensions.unit;
  return [
    "KDP Cover Dimensions",
    "",
    `Trim Size: ${extras.trimName}`,
    `Page Count: ${dimensions.pageCount}`,
    `Interior: ${INTERIOR_LABELS[dimensions.interiorType]}`,
    `Paper: ${PAPER_LABELS[dimensions.paperType]}`,
    `Page Turn: ${extras.pageTurn}`,
    "",
    `Spine: ${formatSingle(unitToInches(dimensions.spineWidth, unit), unit)}`,
    `Full Cover: ${formatPair(unitToInches(dimensions.fullCoverWidth, unit), unitToInches(dimensions.fullCoverHeight, unit), unit)}`,
    `Front Cover: ${formatPair(unitToInches(dimensions.frontCoverWidth, unit), unitToInches(dimensions.frontCoverHeight, unit), unit)}`,
    `Back Cover: ${formatPair(unitToInches(dimensions.backCoverWidth, unit), unitToInches(dimensions.backCoverHeight, unit), unit)}`,
    `Safe Area: ${formatPair(unitToInches(dimensions.safeArea.width, unit), unitToInches(dimensions.safeArea.height, unit), unit)}`,
    `Bleed: ${formatPair(unitToInches(dimensions.bleed, unit), unitToInches(dimensions.bleed, unit), unit)}`,
    `Margin: ${formatPair(unitToInches(dimensions.margin, unit), unitToInches(dimensions.margin, unit), unit)}`,
    `Spine Safe Area: ${formatPair(unitToInches(dimensions.spineSafeAreaWidth, unit), unitToInches(dimensions.spineSafeAreaHeight, unit), unit)}`,
    `Spine Margin: ${formatPair(unitToInches(dimensions.spineMargin, unit), unitToInches(dimensions.spineMargin, unit), unit)}`,
    `Barcode: ${formatPair(unitToInches(dimensions.barcodeArea.width, unit), unitToInches(dimensions.barcodeArea.height, unit), unit)}`,
    `Barcode Margin: ${formatPair(unitToInches(dimensions.barcodeMargin, unit), unitToInches(dimensions.barcodeMargin, unit), unit)}`,
    "",
    "Independent tool. Not affiliated with or endorsed by Amazon.",
    "Always verify your final files in KDP before publishing.",
  ].join("\n");
}

