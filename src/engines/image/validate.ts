import { ENCODE_FORMATS } from "./formats";
import type { ConvertedImage } from "./types";

export interface ValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/** Rough upper bound for a single encoded file (500 MB) — always suspicious. */
const MAX_OUTPUT_BYTES = 500 * 1024 * 1024;

/**
 * Structural validation of a produced file, independent of any codec. Catches
 * empty or mislabeled outputs before they are handed to the user. Raster bytes
 * are additionally decode-verified in the browser codec where practical.
 */
export function validateOutput(result: ConvertedImage): ValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!ENCODE_FORMATS.includes(result.format)) {
    errors.push(`Unknown output format "${result.format}".`);
  }
  if (!Number.isFinite(result.width) || !Number.isFinite(result.height) || result.width <= 0 || result.height <= 0) {
    errors.push(`Invalid output dimensions ${result.width}×${result.height}.`);
  }
  if (!result.data || result.data.byteLength === 0) {
    errors.push("The output file is empty.");
  } else if (result.data.byteLength > MAX_OUTPUT_BYTES) {
    errors.push("The output file is implausibly large.");
  }
  if (!result.mimeType || !result.mimeType.startsWith("image/")) {
    errors.push("The output file has an invalid MIME type.");
  }

  return { ok: errors.length === 0, errors, warnings };
}
