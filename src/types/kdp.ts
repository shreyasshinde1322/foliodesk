export type BindingType = "paperback" | "hardcover";

export type InteriorType =
  | "black_and_white"
  | "standard_color"
  | "premium_color";

export type PaperType = "white" | "cream" | "groundwood";

export type PageTurnDirection = "ltr" | "rtl";

export type MeasurementUnit = "in" | "mm" | "cm";

export type Orientation = "portrait" | "landscape" | "square";

export type CoverPanel = "front" | "back" | "spine";

export interface TrimSize {
  id: string;
  displayName: string;
  widthInches: number;
  heightInches: number;
  unit: "in";
  orientation: Orientation;
  group: "common" | "additional";
}

export interface PageCountRange {
  min: number;
  max: number;
}

export interface PaperbackCoverInput {
  trimWidth: number;
  trimHeight: number;
  pageCount: number;
  interiorType: InteriorType;
  paperType: PaperType;
  units: MeasurementUnit;
  pageTurnDirection: PageTurnDirection;
  bindingType?: BindingType;
}

export interface SafeAreaSpec {
  kdpMinimumFromTrim: number;
  recommendedFromTrim: number;
  spineClearance: number;
  width: number;
  height: number;
  unit: MeasurementUnit;
}

export interface BarcodeAreaSpec {
  isExactSpecification: true;
  label: string;
  placement: string;
  note: string;
  width: number;
  height: number;
  margin: number;
}

export interface CoverLayout {
  left: CoverPanel;
  center: CoverPanel;
  right: CoverPanel;
}

export interface PaperbackCoverDimensions {
  trimWidth: number;
  trimHeight: number;
  spineWidth: number;
  bleed: number;
  fullCoverWidth: number;
  fullCoverHeight: number;
  frontCoverWidth: number;
  frontCoverHeight: number;
  backCoverWidth: number;
  backCoverHeight: number;
  spineHeight: number;
  spineTextEligible: boolean;
  spineCoefficientInches: number;
  margin: number;
  spineSafeAreaWidth: number;
  spineSafeAreaHeight: number;
  spineMargin: number;
  barcodeMargin: number;
  safeArea: SafeAreaSpec;
  barcodeArea: BarcodeAreaSpec;
  layout: CoverLayout;
  unit: MeasurementUnit;
  pageCount: number;
  interiorType: InteriorType;
  paperType: PaperType;
}

export interface ValidationIssue {
  field: string;
  message: string;
}

export type CalculatorResult =
  | { ok: true; value: PaperbackCoverDimensions }
  | { ok: false; issues: ValidationIssue[] };

export interface TemplateOptions {
  showMeasurements: boolean;
  showLabels: boolean;
  showBleed: boolean;
  showSafeArea: boolean;
  showBarcodeArea: boolean;
}

export type CoverInput = PaperbackCoverInput;
export type CoverDimensions = PaperbackCoverDimensions;
