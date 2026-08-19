export type {
  CompressRequest,
  CompressResult,
  EncodeFormat,
  EncodeResult,
  EncodedCandidate,
  EncoderAdapter,
  EncoderOptions,
  ImageFormat,
  NormalizedImage,
  PngCompression,
  PngMode,
  ValidationResult,
} from "./core/types";

export { decodeImage, decodeToRgba, hasAlpha } from "./core/decode";
export { validateOutput, validateLossless } from "./validators/validate";
export { compressImage } from "./pipeline";
export { generateCandidates } from "./strategies/smart";
export { generatePngCandidates, selectBestCandidate } from "./optimizers/target-size";

export { PngLosslessEncoder } from "./encoders/png-lossless";
export { PngQuantizedEncoder, pickQuantizationColors } from "./encoders/png-quantized";
export { JpegEncoder } from "./encoders/jpeg";
export { WebpEncoder } from "./encoders/webp";
export { AvifEncoder } from "./encoders/avif";
