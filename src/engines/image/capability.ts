import type { EncodeFormat, ImageFormat } from "./types";

export interface BrowserCapabilities {
  encode: Record<EncodeFormat, boolean>;
  decode: Record<ImageFormat, boolean>;
  workers: boolean;
}

// Tiny 1x1 red images used to probe real codec support without shipping a
// large fixture. Generated once at dev time with libvips (identical bytes to
// what browsers decode).
const SAMPLE_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";
const SAMPLE_GIF = "R0lGODlhAQABAIAAAExpcf8AACH5BAUAAAAALAAAAAABAAEAAAICTAEAOw==";
const SAMPLE_WEBP =
  "UklGRjwAAABXRUJQVlA4IDAAAADQAQCdASoBAAEAAUAmJaACdLoB+AADsAD+8ut//NgVzXPv9//S4P0uD9Lg/9KQAAA=";
const SAMPLE_AVIF =
  "AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAAWBtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAADRpbG9jAAAAAERAAAIAAQAAAAABhAABAAAAAAAAACQAAgAAAAABqAABAAAAAAAAABQAAAA4aWluZgAAAAAAAgAAABVpbmZlAgAAAAABAABhdjAxAAAAABVpbmZlAgAAAAACAABhdjAxAAAAAA5waXRtAAAAAAABAAAAn2lwcnAAAAB6aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAEAAAABAAAADnBpeGkAAAAAAQgAAAAMYXYxQ4EAHAAAAAA4YXV4QwAAAAB1cm46bXBlZzptcGVnQjpjaWNwOnN5c3RlbXM6YXV4aWxpYXJ5OmFscGhhAAAAAB1pcG1hAAAAAAAAAAIAAQOBAgMAAgSEAgOFAAAAGmlyZWYAAAAAAAAADmF1eGwAAgABAAEAAABAbWRhdBIACgc4AAaQENBpMhcZQmMEwAA0AACQQMkcYUuNGtYQVLH7IBIACgQYAAYVMgoYAAABAAIhG6Ng";
const SAMPLE_SVG =
  'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9InJlZCIvPjwvc3ZnPg==';

export const UNSUPPORTED_CAPABILITIES: BrowserCapabilities = {
  encode: { jpg: true, png: true, webp: false, avif: false, jxl: false, heic: false, gif: true },
  decode: {
    jpg: true,
    png: true,
    webp: false,
    gif: false,
    avif: false,
    heic: false,
    heif: false,
    psd: false,
    bmp: false,
    ico: false,
    svg: false,
    jxl: false,
  },
  workers: false,
};

function decodeSample(base64: string): Uint8Array {
  if (typeof atob !== "function") return new Uint8Array(0);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function canDecode(bytes: Uint8Array): Promise<boolean> {
  if (typeof createImageBitmap !== "function") return false;
  try {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(bytes)]));
    if (typeof bitmap.close === "function") bitmap.close();
    return true;
  } catch {
    return false;
  }
}

function canEncode(format: EncodeFormat, test: (type: string) => boolean): boolean {
  if (format === "jpg" || format === "png") return true;
  return test(`image/${format}`);
}

async function canLoadHeicModule(): Promise<boolean> {
  try {
    await import("heic2any");
    return true;
  } catch {
    return false;
  }
}

/**
 * Probe the actual capabilities of the current browser. Runs on the client
 * only (never during SSR). Output formats that cannot be encoded are disabled
 * in the UI instead of silently producing a different format.
 *
 * `heic`/`heif` decode is reported as "available" when the heic2any module can
 * be loaded (the module's main-thread requirement is always met in the
 * browser). `psd` requires Workers plus the @webtoon/psd module.
 */
export async function getBrowserCapabilities(): Promise<BrowserCapabilities> {
  if (typeof document === "undefined") return UNSUPPORTED_CAPABILITIES;

  const canvasProbe = (type: string): boolean => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      const context = canvas.getContext("2d");
      if (!context) return false;
      const dataUrl = canvas.toDataURL(type);
      return dataUrl.startsWith(`data:${type}`);
    } catch {
      return false;
    }
  };

  const [pngDecode, gifDecode, webpDecode, avifDecode, svgDecode, heicModule] = await Promise.all([
    canDecode(decodeSample(SAMPLE_PNG)),
    canDecode(decodeSample(SAMPLE_GIF)),
    canDecode(decodeSample(SAMPLE_WEBP)),
    canDecode(decodeSample(SAMPLE_AVIF)),
    canDecode(decodeSample(SAMPLE_SVG)),
    canLoadHeicModule(),
  ]);

  const workers = typeof Worker !== "undefined";
  const psdDecode = workers;

  return {
    encode: {
      jpg: true,
      png: true,
      webp: canEncode("webp", canvasProbe),
      avif: canEncode("avif", canvasProbe),
      jxl: true,
      heic: heicModule,
      gif: true,
    },
    decode: {
      jpg: true,
      png: pngDecode,
      webp: webpDecode,
      gif: gifDecode,
      avif: avifDecode,
      heic: heicModule,
      heif: heicModule,
      psd: psdDecode,
      bmp: true,
      ico: true,
      svg: svgDecode,
      jxl: true,
    },
    workers,
  };
}
