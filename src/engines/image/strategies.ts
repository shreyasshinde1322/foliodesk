import { ENCODE_FORMATS, IMAGE_FORMAT_META } from "./formats";
import type { EncodeFormat, ImageFormat } from "./types";

export type DecoderId =
  | "native-bitmap"
  | "pure-bmp"
  | "pure-ico"
  | "libheif-wasm"
  | "webtoon-psd"
  | "sanitized-svg-render";

export type EncoderId =
  | "canvas"
  | "fflate-png"
  | "libwebp-wasm"
  | "libavif-wasm"
  | "libjxl-wasm"
  | "mozjpeg-wasm"
  | "elheif-wasm"
  | "gifenc";

export interface ImageProcessingStrategy {
  input: ImageFormat;
  output: EncodeFormat;
  decoder: DecoderId;
  encoder: EncoderId;
  pipeline: string;
  workerRecommended: boolean;
  browserRequirements: string[];
  qualityControls: string[];
  transparencySupport: "preserve" | "flatten" | "n/a";
  metadataSupport: "strip";
  notes?: string;
}

const INPUT_DECODER: Record<ImageFormat, { id: DecoderId; worker: boolean; notes?: string }> = {
  jpg: { id: "native-bitmap", worker: false },
  png: { id: "native-bitmap", worker: false },
  webp: { id: "native-bitmap", worker: false },
  gif: { id: "native-bitmap", worker: false, notes: "Static GIFs only; animated GIFs are rejected." },
  avif: { id: "native-bitmap", worker: false, notes: "Requires browser AVIF decode support." },
  heic: { id: "libheif-wasm", worker: false, notes: "libheif compiled to WASM (heic2any); must run on the main thread." },
  heif: { id: "libheif-wasm", worker: false, notes: "libheif compiled to WASM (heic2any); must run on the main thread." },
  psd: { id: "webtoon-psd", worker: true, notes: "@webtoon/psd (MIT) in a Web Worker. Reads the flattened composite." },
  bmp: { id: "pure-bmp", worker: false, notes: "Built-in decoder for 24/32-bit uncompressed BMP." },
  ico: { id: "pure-ico", worker: false, notes: "Built-in ICO container decoder with native fallback." },
  svg: { id: "sanitized-svg-render", worker: false, notes: "SVG is sanitized (scripts/event handlers/external refs removed) before rendering." },
  jxl: { id: "native-bitmap", worker: false, notes: "JPEG XL decode requires browser support (Safari 17+)." },
};

interface OutputProfile {
  encoder: EncoderId;
  qualityControls: string[];
  transparency: "preserve" | "flatten" | "n/a";
  notes?: string;
}

const OUTPUT_PROFILE: Record<EncodeFormat, OutputProfile> = {
  jpg: {
    encoder: "canvas",
    qualityControls: ["Quality 10-100"],
    transparency: "flatten",
    notes: "Canvas JPEG encode; alpha is flattened onto the chosen background color.",
  },
  png: {
    encoder: "fflate-png",
    qualityControls: ["Compression: Fast / Balanced / Maximum"],
    transparency: "preserve",
    notes: "Built-in fflate-based PNG encoder gives exact compression control.",
  },
  webp: {
    encoder: "canvas",
    qualityControls: ["Quality 10-100"],
    transparency: "preserve",
    notes: "Lossy WebP via native canvas when available; libwebp WASM fallback otherwise.",
  },
  avif: {
    encoder: "canvas",
    qualityControls: ["Quality 10-100"],
    transparency: "preserve",
    notes: "Native canvas AVIF when available; @jsquash/avif (libavif WASM) as fallback.",
  },
  jxl: {
    encoder: "libjxl-wasm",
    qualityControls: ["Quality 10-100"],
    transparency: "preserve",
    notes: "@jsquash/jxl (libjxl WASM). Best next-gen format for quality/size ratio.",
  },
  heic: {
    encoder: "elheif-wasm",
    qualityControls: ["Fixed quality (kvazaar)"],
    transparency: "preserve",
    notes: "HEIC encoding via elheif (libheif + kvazaar WASM). iPhone native format.",
  },
  gif: {
    encoder: "gifenc",
    qualityControls: ["Quality 1-100 (maps to palette size)"],
    transparency: "flatten",
    notes: "GIF encoding via gifenc (pure JS). Limited to 256 colors per frame.",
  },
};

const PIPELINE: Record<EncodeFormat, string> = {
  jpg: "decode → resize → flatten alpha → canvas JPEG encode",
  png: "decode → resize → fflate PNG encode (selected compression)",
  webp: "decode → resize → canvas (lossy) or libwebp WASM encode",
  avif: "decode → resize → canvas or libavif WASM encode",
  jxl: "decode → resize → libjxl WASM encode",
  heic: "decode → resize → elheif WASM (kvazaar) encode",
  gif: "decode → resize → gifenc quantize + LZW encode",
};

const browserRequirementsFor = (decoder: DecoderId, encoder: EncoderId): string[] => {
  const requirements = new Set<string>();
  if (decoder === "native-bitmap" || decoder === "sanitized-svg-render") {
    requirements.add("createImageBitmap");
    requirements.add("Canvas 2D");
  }
  if (encoder === "canvas") requirements.add("Canvas toBlob");
  if (decoder === "webtoon-psd") requirements.add("Web Worker");
  if (decoder === "libheif-wasm") requirements.add("WebAssembly");
  if (requirements.size === 0) requirements.add("No special APIs (pure in-browser code)");
  return Array.from(requirements);
};

/** The full, explicit input × output strategy matrix. */
export function buildStrategies(): ImageProcessingStrategy[] {
  const strategies: ImageProcessingStrategy[] = [];
  const inputs = Object.keys(INPUT_DECODER) as ImageFormat[];
  for (const input of inputs) {
    for (const output of ENCODE_FORMATS) {
      const decoder = INPUT_DECODER[input];
      const profile = OUTPUT_PROFILE[output];
      strategies.push({
        input,
        output,
        decoder: decoder.id,
        encoder: profile.encoder,
        pipeline: PIPELINE[output],
        workerRecommended: decoder.worker,
        browserRequirements: browserRequirementsFor(decoder.id, profile.encoder),
        qualityControls: profile.qualityControls,
        transparencySupport: profile.transparency,
        metadataSupport: "strip",
        notes: [decoder.notes, profile.notes].filter(Boolean).join(" "),
      });
    }
  }
  return strategies;
}

const STRATEGIES = buildStrategies();

export function getStrategy(input: ImageFormat, output: EncodeFormat): ImageProcessingStrategy | null {
  return STRATEGIES.find((strategy) => strategy.input === input && strategy.output === output) ?? null;
}

export function getSupportedPairs(): Array<{ input: ImageFormat; output: EncodeFormat }> {
  return STRATEGIES.map(({ input, output }) => ({ input, output }));
}

export function getInputFormats(): ImageFormat[] {
  return (Object.keys(INPUT_DECODER) as ImageFormat[]).sort(
    (a, b) => IMAGE_FORMAT_META[a].label.localeCompare(IMAGE_FORMAT_META[b].label),
  );
}

export function getOutputFormats(): EncodeFormat[] {
  return [...ENCODE_FORMATS];
}
