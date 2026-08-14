import sharp from "sharp";

/** Build an RGBA buffer with a per-pixel painter. */
export function rgbaImage(
  width: number,
  height: number,
  painter: (x: number, y: number) => [number, number, number, number],
): Uint8Array {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = painter(x, y);
      const index = (y * width + x) * 4;
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
      data[index + 3] = a;
    }
  }
  return Uint8Array.from(data);
}

/** Solid color image. */
export function solidImage(
  width: number,
  height: number,
  color: [number, number, number, number],
): Uint8Array {
  return rgbaImage(width, height, () => color);
}

/** Half-transparent checkerboard pattern (opaque / fully transparent). */
export function transparentChecker(width: number, height: number): Uint8Array {
  return rgbaImage(width, height, (x, y) => {
    const visible = (x + y) % 2 === 0;
    return visible ? [30, 90, 200, 255] : [0, 0, 0, 0];
  });
}

/** Diagonal gradient, fully opaque. */
export function gradientImage(width: number, height: number): Uint8Array {
  return rgbaImage(width, height, (x, y) => [
    Math.round((x / width) * 255),
    Math.round((y / height) * 255),
    128,
    255,
  ]);
}

export async function encodePng(rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const buffer = await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export async function encodeJpeg(rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const buffer = await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .jpeg({ quality: 90 })
    .toBuffer();
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export async function encodeWebp(rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  const buffer = await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } })
    .webp({ quality: 90 })
    .toBuffer();
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

export interface DecodedRgba {
  width: number;
  height: number;
  data: Uint8Array;
}

export async function decodeRgba(bytes: Uint8Array): Promise<DecodedRgba> {
  const result = await sharp(Buffer.from(bytes))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    width: result.info.width,
    height: result.info.height,
    data: new Uint8Array(result.data.buffer, result.data.byteOffset, result.data.byteLength),
  };
}

export function toBlob(bytes: Uint8Array, mime: string): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: mime });
}
