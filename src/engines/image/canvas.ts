export type CanvasLike = HTMLCanvasElement | OffscreenCanvas;

export function createCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error("No canvas API available.");
}

export type DrawingContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function get2dContext(canvas: CanvasLike): DrawingContext {
  const context = canvas.getContext("2d") as DrawingContext | null;
  if (!context) throw new Error("Canvas 2D context unavailable.");
  return context;
}

export async function canvasToBlob(
  canvas: CanvasLike,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: mimeType, quality });
  }
  const htmlCanvas = canvas as HTMLCanvasElement;
  return new Promise<Blob>((resolve, reject) => {
    htmlCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas produced no output."));
      },
      mimeType,
      quality,
    );
  });
}
