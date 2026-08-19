declare module "gifenc" {
  interface GIFEncoderOptions {
    auto?: boolean;
    initialCapacity?: number;
  }

  interface WriteFrameOptions {
    palette?: number[][];
    first?: boolean;
    transparent?: boolean;
    transparentIndex?: number;
    delay?: number;
    repeat?: number;
    colorDepth?: number;
    dispose?: number;
  }

  interface GIFStream {
    writeByte(byte: number): void;
    writeBytes(bytes: Uint8Array | number[], offset?: number, length?: number): void;
  }

  interface GIFEncoder {
    reset(): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
    buffer: ArrayBuffer;
    stream: GIFStream;
    writeHeader(): void;
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOptions,
    ): void;
  }

  function GIFEncoder(opts?: GIFEncoderOptions): GIFEncoder;
  function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    opts?: { format?: "rgb565" | "rgb444" | "rgba4444" },
  ): number[][];
  function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: "rgb565" | "rgb444" | "rgba4444",
  ): Uint8Array;
  function prequantize(
    rgba: Uint8Array | Uint8ClampedArray,
    opts?: { round?: boolean; blueBits?: number; greenBits?: number; redBits?: number },
  ): void;

  export { GIFEncoder, quantize, applyPalette, prequantize };
  export default GIFEncoder;
}
