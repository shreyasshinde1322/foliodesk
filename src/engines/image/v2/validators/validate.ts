import type { NormalizedImage, EncodeResult, ValidationResult } from "../core/types";
import { decodeToRgba } from "../core/decode";

export async function validateOutput(
  input: NormalizedImage,
  output: EncodeResult,
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    widthMatch: false,
    heightMatch: false,
  };

  try {
    const decoded = await decodeToRgba(output.data);

    result.widthMatch = decoded.width === input.width;
    result.heightMatch = decoded.height === input.height;

    if (!result.widthMatch || !result.heightMatch) {
      result.valid = false;
      result.error = `Dimension mismatch: expected ${input.width}x${input.height}, got ${decoded.width}x${decoded.height}`;
      return result;
    }

    const inputPixels = input.width * input.height;
    const outputPixels = decoded.width * decoded.height;
    if (inputPixels * 4 !== input.data.length) {
      result.valid = false;
      result.error = `Input pixel data length mismatch: expected ${inputPixels * 4}, got ${input.data.length}`;
      return result;
    }
    if (outputPixels * 4 !== decoded.data.length) {
      result.valid = false;
      result.error = `Output pixel data length mismatch: expected ${outputPixels * 4}, got ${decoded.data.length}`;
      return result;
    }

    return result;
  } catch (err) {
    result.valid = false;
    result.error = `Validation decode failed: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }
}

export async function validateLossless(
  input: NormalizedImage,
  output: EncodeResult,
): Promise<ValidationResult & { pixelMatch: boolean }> {
  const base = await validateOutput(input, output);
  const result = { ...base, pixelMatch: false };

  if (!base.valid) return result;

  try {
    const decoded = await decodeToRgba(output.data);
    const len = input.data.length;

    let mismatch = false;
    for (let i = 0; i < len; i += 1) {
      if (input.data[i] !== decoded.data[i]) {
        mismatch = true;
        break;
      }
    }

    result.pixelMatch = !mismatch;
    if (mismatch) {
      result.valid = false;
      result.error = "Pixel data mismatch: output is not lossless.";
    }

    return result;
  } catch (err) {
    result.valid = false;
    result.error = `Lossless validation failed: ${err instanceof Error ? err.message : String(err)}`;
    return result;
  }
}
