export type {
  AnalyzedImage,
  BatchEntry,
  ConvertRequest,
} from "./engine";
export {
  analyzeImage,
  convertBatch,
  convertBitmap,
  convertImage,
  encodeBitmap,
  transformBitmap,
} from "./engine";
export { createBrowserCodec } from "./codec";
export { getBrowserCapabilities, UNSUPPORTED_CAPABILITIES } from "./capability";
export type { BrowserCapabilities } from "./capability";
export { decodeBmp } from "./decoders/bmp";
export { decodeIcoBitmap, extractPng, pickBestIcoEntry } from "./decoders/ico";
export type { IcoEntry } from "./decoders/ico";
export { detectGifAnimation } from "./decoders/gif";
export { renderSvg, renderSvgIntrinsic, sanitizeSvg, svgToText } from "./decoders/svg";
export { encodePng } from "./encoders/png";
export {
  ENCODE_FORMATS,
  IMAGE_FORMAT_META,
  INPUT_EXTENSIONS,
  MAX_FILE_BYTES,
  detectFormat,
  formatFromExtension,
  isSupportedInput,
} from "./formats";
export { flattenBitmap, hasAlpha } from "./bitmap";
export {
  buildOutputName,
  dedupeNames,
  sanitizeFileComponent,
  stripExtension,
} from "./filename";
export {
  DEFAULT_OPTIONS,
  clampQuality,
  normalizeConversionOptions,
} from "./options";
export {
  formatMegabytes,
  estimateWorkingBytes,
  isBelowHardLimit,
  isHeavy,
  pixelCount,
} from "./memory";
export {
  clampPercentage,
  computeTargetSize,
  needsResize,
} from "./resize";
export { buildStrategies, getInputFormats, getOutputFormats, getStrategy, getSupportedPairs } from "./strategies";
export type { DecoderId, EncoderId, ImageProcessingStrategy } from "./strategies";
export { validateOutput } from "./validate";
export type { ValidationReport } from "./validate";
export { callWorker, terminateWorkers } from "./worker/manager";
export { createZip, crc32 } from "./zip";
export type { ZipEntryInput } from "./zip";
export { ImageProcessingError } from "./types";
export type {
  ConversionOptions,
  ConvertedImage,
  DecodedBitmap,
  EncodeFormat,
  EncodeOptions,
  ImageCodec,
  ImageFormat,
  JobStage,
  OutputKind,
  PngCompression,
  ResizeMode,
} from "./types";
