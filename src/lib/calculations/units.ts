import {
  DISPLAY_DECIMALS,
  INCH_TO_CM,
  INCH_TO_MM,
  INTERNAL_DECIMALS,
} from "@/data/kdp/specifications";
import type { MeasurementUnit } from "@/types/kdp";

export function roundTo(value: number, decimals: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Cannot round a non-finite number.");
  }
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function roundInternal(value: number): number {
  return roundTo(value, INTERNAL_DECIMALS);
}

export function inchesToUnit(inches: number, unit: MeasurementUnit): number {
  if (unit === "in") return inches;
  if (unit === "mm") return inches * INCH_TO_MM;
  return inches * INCH_TO_CM;
}

export function unitToInches(value: number, unit: MeasurementUnit): number {
  if (unit === "in") return value;
  if (unit === "mm") return value / INCH_TO_MM;
  return value / INCH_TO_CM;
}

export function convertFromInches(
  inches: number,
  unit: MeasurementUnit,
): number {
  return roundInternal(inchesToUnit(inches, unit));
}

export function formatDimension(
  inches: number,
  unit: MeasurementUnit,
  decimals: number = DISPLAY_DECIMALS[unit],
): string {
  const converted = inchesToUnit(inches, unit);
  const rounded = roundTo(converted, decimals);
  return rounded.toFixed(decimals);
}

export function formatCompact(inches: number, unit: MeasurementUnit): string {
  const converted = inchesToUnit(inches, unit);
  const rounded = roundTo(converted, DISPLAY_DECIMALS[unit]);
  return String(Number(rounded.toFixed(DISPLAY_DECIMALS[unit])));
}

export function formatPair(
  widthInches: number,
  heightInches: number,
  unit: MeasurementUnit,
): string {
  return `${formatCompact(widthInches, unit)} x ${formatCompact(heightInches, unit)} ${unitLabel(unit)}`;
}

export function formatInchesAndMm(inches: number, inchDecimals = 3): string {
  const mm = roundTo(inches * INCH_TO_MM, 2);
  return `${inches.toFixed(inchDecimals)}" (${mm.toFixed(2)}mm)`;
}

export function unitLabel(unit: MeasurementUnit): string {
  if (unit === "in") return "in";
  if (unit === "mm") return "mm";
  return "cm";
}

export function formatSingle(inches: number, unit: MeasurementUnit): string {
  return `${formatDimension(inches, unit)} ${unitLabel(unit)}`;
}
